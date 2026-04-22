import { prisma } from '@/lib/prisma';
import { compact, slugify, geoBoxFilter } from '@/lib/utils';
import { remember, del, invalidatePattern, CacheKeys, CacheTTL } from '@/lib/services/cache.service';
import { DEFAULT_SEARCH_RADIUS_KM } from '@/lib/constants';

const JOB_PUBLIC_INCLUDE = {
  company: {
    select: {
      id: true, name: true, slug: true, logoUrl: true,
      industry: true, size: true, city: true, state: true, isVerified: true,
    },
  },
  location: true,
  _count: { select: { applications: true } },
};

// ─── Listing ──────────────────────────────────────────────────────────────────

/**
 * List jobs with filters.
 * Supports full-text keyword search, category, workMode, location (pincode/city),
 * and geo-radius filtering via lat/lng.
 *
 * @param {{
 *   page?: number, pageSize?: number,
 *   q?: string, category?: string, jobType?: string, workMode?: string,
 *   city?: string, pincode?: string,
 *   lat?: number, lng?: number, radius?: number,
 *   companyId?: string, skills?: string[],
 * }} filters
 */
export async function listJobs(filters = {}) {
  const {
    page = 1, pageSize = 20,
    q, category, jobType, workMode,
    city, pincode, lat, lng,
    radius = DEFAULT_SEARCH_RADIUS_KM,
    companyId, skills,
  } = filters;

  const hasGeo = lat != null && lng != null;
  const hasFilters = q || category || jobType || workMode || city || pincode || hasGeo || companyId || skills?.length;

  const where = {
    isActive: true,
    isApproved: true,
    ...(q && {
      OR: [
        { title:       { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { skills:      { has: q } },
      ],
    }),
    ...(category   && { category }),
    ...(jobType    && { jobType }),
    ...(workMode   && { workMode }),
    ...(companyId  && { companyId }),
    ...(skills?.length && { skills: { hasSome: skills } }),
    ...(city || pincode || hasGeo
      ? {
          location: {
            ...(city    && { city:    { contains: city,    mode: 'insensitive' } }),
            ...(pincode && { pincode: { contains: pincode } }),
            ...(hasGeo  && geoBoxFilter(lat, lng, radius)),
          },
        }
      : {}),
  };

  const cacheKey = hasFilters ? null : CacheKeys.jobsList(page, {});

  const fetch = async () => {
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: JOB_PUBLIC_INCLUDE,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.job.count({ where }),
    ]);
    return { jobs, total };
  };

  if (cacheKey) return remember(cacheKey, CacheTTL.MEDIUM, fetch);
  return fetch();
}

// ─── Single job ────────────────────────────────────────────────────────────────

/**
 * Get a single job by slug or id, incrementing view count.
 */
export async function getJob(slugOrId) {
  const isId = /^c[a-z0-9]{20,}$/.test(slugOrId);
  const where = isId ? { id: slugOrId } : { slug: slugOrId };

  const cacheKey = CacheKeys.jobDetail(slugOrId);

  const job = await remember(cacheKey, CacheTTL.MEDIUM, () =>
    prisma.job.findUnique({
      where,
      include: {
        ...JOB_PUBLIC_INCLUDE,
        company: {
          include: {
            owner: {
              select: { id: true, profile: { select: { firstName: true, avatarUrl: true } } },
            },
          },
        },
      },
    })
  );

  // Increment view count async without blocking the response
  if (job) {
    prisma.job.update({ where: { id: job.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }

  return job;
}

// ─── Create ────────────────────────────────────────────────────────────────────

/**
 * Create a new job posting.
 *
 * @param {string} companyId
 * @param {object} jobData
 * @param {object} locationData
 */
export async function createJob(companyId, jobData, locationData) {
  const slug = await generateUniqueJobSlug(jobData.title);

  const job = await prisma.job.create({
    data: {
      companyId,
      slug,
      title:               jobData.title,
      description:         jobData.description,
      requirements:        jobData.requirements,
      responsibilities:    jobData.responsibilities,
      category:            jobData.category,
      jobType:             jobData.jobType ?? 'FullTime',
      workMode:            jobData.workMode ?? 'OnSite',
      experienceLevel:     jobData.experienceLevel ?? 'Mid',
      skills:              jobData.skills ?? [],
      salaryMin:           jobData.salaryMin,
      salaryMax:           jobData.salaryMax,
      applicationDeadline: jobData.applicationDeadline,
      location: {
        create: {
          address:  locationData.address,
          locality: locationData.locality,
          city:     locationData.city,
          district: locationData.district,
          state:    locationData.state,
          pincode:  locationData.pincode,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
      },
    },
    include: JOB_PUBLIC_INCLUDE,
  });

  await invalidatePattern('jobs:list:*');
  return job;
}

// ─── Update ────────────────────────────────────────────────────────────────────

/**
 * Update a job's details. Owner or admin only (enforce at call site).
 */
export async function updateJob(jobId, jobData, locationData) {
  const safeJob = compact({
    title:               jobData.title,
    description:         jobData.description,
    requirements:        jobData.requirements,
    responsibilities:    jobData.responsibilities,
    category:            jobData.category,
    jobType:             jobData.jobType,
    workMode:            jobData.workMode,
    experienceLevel:     jobData.experienceLevel,
    skills:              jobData.skills,
    salaryMin:           jobData.salaryMin,
    salaryMax:           jobData.salaryMax,
    isActive:            jobData.isActive,
    applicationDeadline: jobData.applicationDeadline,
  });

  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...safeJob,
      ...(locationData && {
        location: {
          update: compact({
            address:   locationData.address,
            locality:  locationData.locality,
            city:      locationData.city,
            district:  locationData.district,
            state:     locationData.state,
            pincode:   locationData.pincode,
            latitude:  locationData.latitude,
            longitude: locationData.longitude,
          }),
        },
      }),
    },
    include: JOB_PUBLIC_INCLUDE,
  });

  await del(CacheKeys.jobDetail(job.slug));
  await del(CacheKeys.jobDetail(job.id));
  await invalidatePattern('jobs:list:*');
  return job;
}

// ─── Delete ────────────────────────────────────────────────────────────────────

/**
 * Soft-delete a job by marking it inactive.
 */
export async function deleteJob(jobId) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { isActive: false },
  });
  await del(CacheKeys.jobDetail(job.slug));
  await del(CacheKeys.jobDetail(job.id));
  await invalidatePattern('jobs:list:*');
  return job;
}

// ─── Admin moderation ─────────────────────────────────────────────────────────

export async function moderateJob(jobId, { isApproved, isFeatured, featuredUntil }) {
  return prisma.job.update({
    where: { id: jobId },
    data: compact({ isApproved, isFeatured, featuredUntil }),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateUniqueJobSlug(title) {
  const base = slugify(title);
  const year = new Date().getFullYear();
  let slug = `${base}-${year}`;
  let attempts = 0;

  while (attempts < 10) {
    const exists = await prisma.job.count({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${year}-${Math.random().toString(36).slice(2, 6)}`;
    attempts++;
  }

  return `${base}-${Date.now()}`;
}
