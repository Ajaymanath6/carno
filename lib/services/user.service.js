import { prisma } from '@/lib/prisma';
import { compact } from '@/lib/utils';

/**
 * Get a user by their local DB id, with optional relations.
 */
export async function getUserById(id, { includeProfile = true, includeCompany = false } = {}) {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: includeProfile, ownedCompany: includeCompany },
  });
}

/**
 * Get a user by their Clerk id.
 */
export async function getUserByClerkId(clerkId, options = {}) {
  const { includeProfile = true, includeCompany = false } = options;
  return prisma.user.findUnique({
    where: { clerkId },
    include: { profile: includeProfile, ownedCompany: includeCompany },
  });
}

/**
 * Update a user's profile fields.
 * Only updates fields that are explicitly provided (undefined = skip).
 *
 * @param {string} userId - Local DB user id
 * @param {Partial<Profile>} data
 */
export async function updateProfile(userId, data) {
  const safeData = compact({
    firstName:       data.firstName,
    lastName:        data.lastName,
    phone:           data.phone,
    bio:             data.bio,
    city:            data.city,
    district:        data.district,
    state:           data.state,
    pincode:         data.pincode,
    latitude:        data.latitude,
    longitude:       data.longitude,
    skills:          data.skills,
    jobTitles:       data.jobTitles,
    experienceYears: data.experienceYears,
    experienceLevel: data.experienceLevel,
    resumeUrl:       data.resumeUrl,
    linkedinUrl:     data.linkedinUrl,
    portfolioUrl:    data.portfolioUrl,
    avatarUrl:       data.avatarUrl,
  });

  return prisma.profile.update({
    where: { userId },
    data: safeData,
  });
}

/**
 * List all users (admin use). Supports pagination and search by email.
 */
export async function listUsers({ page = 1, pageSize = 20, search, accountType } = {}) {
  const where = {
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
      ],
    }),
    ...(accountType && { accountType }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { profile: { select: { firstName: true, lastName: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

/**
 * Deactivate (soft-delete) a user account.
 */
export async function deactivateUser(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });
}
