/**
 * search.service.js — Fuzzy search using fuse.js
 *
 * Provides combined search across jobs, companies, job titles, and localities.
 * The search index is built from DB records and cached.
 */

import Fuse from 'fuse.js';
import { prisma } from '@/lib/prisma';
import { remember, CacheTTL } from '@/lib/services/cache.service';

// ─── Index builders ───────────────────────────────────────────────────────────

async function getJobSearchData() {
  return remember('search:jobs:index', CacheTTL.MEDIUM, async () =>
    prisma.job.findMany({
      where: { isActive: true, isApproved: true },
      select: {
        id: true, title: true, slug: true, category: true,
        skills: true, workMode: true, jobType: true,
        company: { select: { name: true, city: true, logoUrl: true } },
        location: { select: { city: true, state: true, pincode: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    })
  );
}

async function getCompanySearchData() {
  return remember('search:companies:index', CacheTTL.MEDIUM, async () =>
    prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, slug: true, industry: true,
        city: true, description: true, logoUrl: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    })
  );
}

async function getJobTitleSearchData() {
  return remember('search:job_titles:index', CacheTTL.LONG, async () =>
    prisma.jobTitle.findMany({
      select: { id: true, title: true, category: true },
    })
  );
}

async function getLocalitySearchData() {
  return remember('search:localities:index', CacheTTL.LONG, async () =>
    prisma.pincode.findMany({
      select: { id: true, pincode: true, localityName: true, district: true, state: true },
      orderBy: { localityName: 'asc' },
      take: 5000,
    })
  );
}

// ─── Fuse configs ─────────────────────────────────────────────────────────────

const JOB_FUSE_OPTIONS = {
  keys: [
    { name: 'title',          weight: 0.4 },
    { name: 'company.name',   weight: 0.2 },
    { name: 'skills',         weight: 0.2 },
    { name: 'location.city',  weight: 0.1 },
    { name: 'category',       weight: 0.1 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 2,
};

const COMPANY_FUSE_OPTIONS = {
  keys: [
    { name: 'name',        weight: 0.5 },
    { name: 'industry',    weight: 0.3 },
    { name: 'city',        weight: 0.2 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 2,
};

const TITLE_FUSE_OPTIONS = {
  keys: [{ name: 'title', weight: 1 }],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

const LOCALITY_FUSE_OPTIONS = {
  keys: [
    { name: 'localityName', weight: 0.5 },
    { name: 'district',     weight: 0.3 },
    { name: 'pincode',      weight: 0.2 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

// ─── Public search functions ───────────────────────────────────────────────────

/**
 * Search jobs using fuzzy matching.
 * @param {string} query
 * @param {number} [limit=10]
 * @returns {Promise<Array<{ item: object, score: number }>>}
 */
export async function searchJobs(query, limit = 10) {
  if (!query?.trim()) return [];
  const data = await getJobSearchData();
  const fuse = new Fuse(data, JOB_FUSE_OPTIONS);
  return fuse.search(query, { limit }).map((r) => ({ ...r.item, _score: r.score }));
}

/**
 * Search companies using fuzzy matching.
 */
export async function searchCompanies(query, limit = 10) {
  if (!query?.trim()) return [];
  const data = await getCompanySearchData();
  const fuse = new Fuse(data, COMPANY_FUSE_OPTIONS);
  return fuse.search(query, { limit }).map((r) => ({ ...r.item, _score: r.score }));
}

/**
 * Search job titles (for autocomplete).
 */
export async function searchJobTitles(query, limit = 8) {
  if (!query?.trim()) return [];
  const data = await getJobTitleSearchData();
  const fuse = new Fuse(data, TITLE_FUSE_OPTIONS);
  return fuse.search(query, { limit }).map((r) => r.item);
}

/**
 * Search localities/pincodes (for location autocomplete).
 */
export async function searchLocalities(query, limit = 8) {
  if (!query?.trim()) return [];
  const data = await getLocalitySearchData();
  const fuse = new Fuse(data, LOCALITY_FUSE_OPTIONS);
  return fuse.search(query, { limit }).map((r) => r.item);
}

/**
 * Combined search across jobs, companies, titles, and localities.
 * Returns a unified results object.
 *
 * @param {string} query
 * @param {{ jobLimit?: number, companyLimit?: number, titleLimit?: number, localityLimit?: number }} [options]
 */
export async function combinedSearch(query, options = {}) {
  const { jobLimit = 5, companyLimit = 3, titleLimit = 4, localityLimit = 4 } = options;

  if (!query?.trim()) {
    return { jobs: [], companies: [], titles: [], localities: [] };
  }

  const [jobs, companies, titles, localities] = await Promise.all([
    searchJobs(query, jobLimit),
    searchCompanies(query, companyLimit),
    searchJobTitles(query, titleLimit),
    searchLocalities(query, localityLimit),
  ]);

  return { jobs, companies, titles, localities };
}
