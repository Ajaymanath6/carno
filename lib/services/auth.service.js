/**
 * auth.service.js — Authentication & user-provisioning business logic.
 *
 * Responsible for:
 *  - Syncing a Clerk user into the local database on first sign-in
 *  - Completing the onboarding flow (creating Profile, optionally Company)
 *  - Updating Clerk public metadata after onboarding so the session reflects
 *    the new state without requiring a sign-out/sign-in cycle
 *  - Providing lightweight helpers used by route handlers
 */

import { clerkClient } from '@clerk/nextjs/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// ─── User provisioning ────────────────────────────────────────────────────────

/**
 * Ensures a User row exists in the database for the given Clerk user.
 * Safe to call on every authenticated request — uses upsert.
 *
 * @param {{ clerkId: string, email: string }} params
 * @returns {Promise<import('@prisma/client').User>}
 */
export async function provisionUser({ clerkId, email }) {
  return prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: {
      clerkId,
      email,
      accountType: 'JobSeeker',
      isOnboarded: false,
    },
  });
}

/**
 * Fetches the Clerk session and provisions the user if needed.
 * Returns null when no active session exists.
 *
 * @returns {Promise<import('@prisma/client').User | null>}
 */
export async function getOrProvisionCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) return null;

  return provisionUser({ clerkId, email });
}

// ─── Onboarding ────────────────────────────────────────────────────────────────

/**
 * Completes the onboarding flow for a job seeker.
 *
 * Creates the user's Profile and marks the user as onboarded in both
 * the local DB and Clerk public metadata.
 *
 * @param {string} userId - Local DB user ID
 * @param {string} clerkId - Clerk user ID
 * @param {{
 *   firstName: string,
 *   lastName?: string,
 *   phone?: string,
 *   city: string,
 *   state?: string,
 *   pincode: string,
 *   skills?: string[],
 *   jobTitles?: string[],
 *   experienceYears?: number,
 *   experienceLevel?: string,
 * }} profileData
 * @returns {Promise<{ user: object, profile: object }>}
 */
export async function completeJobSeekerOnboarding(userId, clerkId, profileData) {
  const [user, profile] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    }),
    prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, ...profileData },
    }),
  ]);

  // Reflect onboarding state in the Clerk session token so the middleware
  // can read it from sessionClaims without a DB round-trip.
  await syncClerkMetadata(clerkId, {
    isOnboarded: true,
    accountType: 'JobSeeker',
    role: 'jobseeker',
  });

  return { user, profile };
}

/**
 * Completes onboarding for an employer.
 *
 * Creates the Profile and Company, then marks the user as onboarded.
 *
 * @param {string} userId
 * @param {string} clerkId
 * @param {{
 *   firstName: string,
 *   lastName?: string,
 *   phone?: string,
 *   city: string,
 *   state?: string,
 *   pincode: string,
 * }} profileData
 * @param {{
 *   name: string,
 *   slug: string,
 *   description?: string,
 *   industry?: string,
 *   size?: string,
 *   city: string,
 *   state?: string,
 *   pincode?: string,
 *   websiteUrl?: string,
 * }} companyData
 * @returns {Promise<{ user: object, profile: object, company: object }>}
 */
export async function completeEmployerOnboarding(userId, clerkId, profileData, companyData) {
  const [user, profile, company] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { accountType: 'Employer', isOnboarded: true },
    }),
    prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, ...profileData },
    }),
    prisma.company.upsert({
      where: { slug: companyData.slug },
      update: companyData,
      create: { ownerId: userId, ...companyData },
    }),
  ]);

  await syncClerkMetadata(clerkId, {
    isOnboarded: true,
    accountType: 'Employer',
    role: 'employer',
  });

  return { user, profile, company };
}

// ─── Clerk metadata sync ───────────────────────────────────────────────────────

/**
 * Updates Clerk public metadata for a user.
 * Public metadata is embedded in the session JWT and readable client-side.
 *
 * @param {string} clerkId
 * @param {Record<string, unknown>} metadata - Fields to merge into publicMetadata
 */
export async function syncClerkMetadata(clerkId, metadata) {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: metadata,
    });
  } catch (err) {
    // Metadata sync failure must not break the main flow — log and continue.
    console.error('[auth.service] Failed to sync Clerk metadata:', err?.message ?? err);
  }
}

// ─── Role helpers ──────────────────────────────────────────────────────────────

/**
 * Promotes a user to Admin in both the local DB and Clerk metadata.
 * Only callable by an existing admin (enforce at the call site).
 *
 * @param {string} userId - Local DB user ID
 * @param {string} clerkId
 */
export async function promoteToAdmin(userId, clerkId) {
  await prisma.user.update({
    where: { id: userId },
    data: { accountType: 'Admin' },
  });

  await syncClerkMetadata(clerkId, { role: 'admin', accountType: 'Admin' });
}

// ─── Validation helpers ────────────────────────────────────────────────────────

/**
 * Generates a URL-safe company slug from a company name.
 * Appends a short random suffix to reduce collisions.
 *
 * @param {string} name
 * @returns {string}
 */
export function generateCompanySlug(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/**
 * Returns true if a company slug is already taken.
 *
 * @param {string} slug
 * @returns {Promise<boolean>}
 */
export async function isSlugTaken(slug) {
  const count = await prisma.company.count({ where: { slug } });
  return count > 0;
}
