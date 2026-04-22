/**
 * getCurrentUser — server-side helper to resolve the authenticated user.
 *
 * Call this at the top of any Server Component or Route Handler that needs
 * the current user's DB record. It reads the Clerk session and looks up the
 * matching User row in the database.
 *
 * Returns null when:
 *  - No active Clerk session exists
 *  - The user has not completed onboarding (no DB row yet)
 *
 * Usage in a Server Component:
 *   const user = await getCurrentUser();
 *   if (!user) redirect('/sign-in');
 *
 * Usage in a Route Handler:
 *   const user = await getCurrentUser();
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Returns the full Prisma User record for the currently signed-in Clerk user,
 * including their profile. Returns null if unauthenticated or not yet in the DB.
 *
 * @param {{ includeProfile?: boolean, includeCompany?: boolean }} [options]
 */
export async function getCurrentUser(options = {}) {
  const { includeProfile = true, includeCompany = false } = options;

  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      profile: includeProfile,
      ownedCompany: includeCompany,
    },
  });

  return user;
}

/**
 * Returns the raw Clerk user object (from Clerk's servers).
 * Useful when you need email addresses, OAuth accounts, or session metadata
 * before the user has a DB record (e.g. during onboarding).
 */
export async function getClerkUser() {
  return currentUser();
}

/**
 * Returns the Clerk user ID from the current session, or null.
 * Lighter than getCurrentUser() when you only need the ID for an auth check.
 */
export async function getClerkId() {
  const { userId } = await auth();
  return userId ?? null;
}

/**
 * Asserts the current request is authenticated and returns the user.
 * Throws a structured error object if not authenticated, designed to be caught
 * by route handler wrappers.
 *
 * @throws {{ status: 401, message: string }}
 */
export async function requireUser(options = {}) {
  const user = await getCurrentUser(options);
  if (!user) {
    throw { status: 401, message: 'Authentication required.' };
  }
  return user;
}

/**
 * Asserts the current user has the Admin account type.
 *
 * @throws {{ status: 401 | 403, message: string }}
 */
export async function requireAdmin() {
  const user = await getCurrentUser({ includeProfile: false });
  if (!user) throw { status: 401, message: 'Authentication required.' };
  if (user.accountType !== 'Admin') throw { status: 403, message: 'Admin access required.' };
  return user;
}

/**
 * Asserts the current user is an Employer.
 *
 * @throws {{ status: 401 | 403, message: string }}
 */
export async function requireEmployer() {
  const user = await getCurrentUser({ includeProfile: false, includeCompany: true });
  if (!user) throw { status: 401, message: 'Authentication required.' };
  if (user.accountType !== 'Employer' && user.accountType !== 'Admin') {
    throw { status: 403, message: 'Employer access required.' };
  }
  return user;
}
