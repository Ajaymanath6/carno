import { prisma } from '@/lib/prisma';
import { compact, slugify } from '@/lib/utils';
import { remember, del, invalidatePattern, CacheKeys, CacheTTL } from '@/lib/services/cache.service';

const COMPANY_PUBLIC_SELECT = {
  id: true, name: true, slug: true, description: true, logoUrl: true,
  websiteUrl: true, industry: true, size: true, fundingSeries: true,
  city: true, state: true, pincode: true, latitude: true, longitude: true,
  isVerified: true, isFeatured: true, createdAt: true,
  _count: { select: { jobs: true } },
};

/**
 * List companies with optional filters and pagination.
 * Results are cached per page number.
 */
export async function listCompanies({ page = 1, pageSize = 20, search, industry, city } = {}) {
  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(industry && { industry: { contains: industry, mode: 'insensitive' } }),
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
  };

  const hasFilters = search || industry || city;
  const cacheKey = hasFilters ? null : CacheKeys.companiesList(page);

  const fetch = async () => {
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: COMPANY_PUBLIC_SELECT,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.company.count({ where }),
    ]);
    return { companies, total };
  };

  if (cacheKey) return remember(cacheKey, CacheTTL.MEDIUM, fetch);
  return fetch();
}

/**
 * Get a single company by slug or id.
 * Includes recent active jobs.
 */
export async function getCompany(slugOrId) {
  const isId = /^c[a-z0-9]{20,}$/.test(slugOrId);
  const where = isId ? { id: slugOrId } : { slug: slugOrId };

  const cacheKey = CacheKeys.companyDetail(slugOrId);

  return remember(cacheKey, CacheTTL.MEDIUM, async () =>
    prisma.company.findUnique({
      where,
      include: {
        owner: {
          select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
        jobs: {
          where: { isActive: true, isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { location: true },
        },
      },
    })
  );
}

/**
 * Create a new company for an employer user.
 * Automatically generates a slug if not provided.
 *
 * @param {string} ownerId
 * @param {object} data
 */
export async function createCompany(ownerId, data) {
  const slug = data.slug ?? (await generateUniqueSlug(data.name));

  const company = await prisma.company.create({
    data: {
      ownerId,
      slug,
      name:         data.name,
      description:  data.description,
      logoUrl:      data.logoUrl,
      websiteUrl:   data.websiteUrl,
      linkedinUrl:  data.linkedinUrl,
      industry:     data.industry,
      size:         data.size ?? 'Small',
      fundingSeries: data.fundingSeries,
      city:         data.city,
      state:        data.state,
      pincode:      data.pincode,
      latitude:     data.latitude,
      longitude:    data.longitude,
    },
  });

  await invalidatePattern('companies:*');
  return company;
}

/**
 * Update a company. Only the owner (or admin) should call this.
 *
 * @param {string} companyId
 * @param {object} data
 */
export async function updateCompany(companyId, data) {
  const safeData = compact({
    name:          data.name,
    description:   data.description,
    logoUrl:       data.logoUrl,
    websiteUrl:    data.websiteUrl,
    linkedinUrl:   data.linkedinUrl,
    twitterUrl:    data.twitterUrl,
    industry:      data.industry,
    size:          data.size,
    fundingSeries: data.fundingSeries,
    city:          data.city,
    state:         data.state,
    pincode:       data.pincode,
    latitude:      data.latitude,
    longitude:     data.longitude,
  });

  const company = await prisma.company.update({
    where: { id: companyId },
    data: safeData,
  });

  await del(CacheKeys.companyDetail(company.slug));
  await del(CacheKeys.companyDetail(company.id));
  await invalidatePattern('companies:list:*');
  return company;
}

/**
 * Generate a unique slug from a company name,
 * appending a random suffix if the base slug is taken.
 */
export async function generateUniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let attempts = 0;

  while (attempts < 10) {
    const exists = await prisma.company.count({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    attempts++;
  }

  return `${base}-${Date.now()}`;
}
