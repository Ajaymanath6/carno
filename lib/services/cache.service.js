/**
 * cache.service.js — Unified caching layer
 *
 * Uses Redis when available, falls back to a module-level in-memory Map.
 * The API is intentionally small:
 *
 *   get(key)                   → cached value or null
 *   set(key, value, ttlSecs)   → void
 *   del(key)                   → void
 *   remember(key, ttlSecs, fn) → cached value, or calls fn() and caches result
 *   invalidatePattern(pattern) → del all Redis keys matching glob pattern
 */

import { redis, redisAvailable } from '@/lib/redis';

// In-memory fallback store: Map<key, { value: any, expiresAt: number | null }>
const memoryStore = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function memGet(key) {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key, value, ttlSecs) {
  memoryStore.set(key, {
    value,
    expiresAt: ttlSecs ? Date.now() + ttlSecs * 1000 : null,
  });
}

function memDel(key) {
  memoryStore.delete(key);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve a value from cache.
 * @param {string} key
 * @returns {Promise<any | null>}
 */
export async function get(key) {
  if (redisAvailable && redis) {
    try {
      const raw = await redis.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      // Fall through to memory on Redis error
    }
  }
  return memGet(key);
}

/**
 * Store a value in cache.
 * @param {string} key
 * @param {any} value - Must be JSON-serialisable
 * @param {number} [ttlSecs=300] - Expiry in seconds (default 5 min)
 */
export async function set(key, value, ttlSecs = 300) {
  const serialised = JSON.stringify(value);

  if (redisAvailable && redis) {
    try {
      await redis.set(key, serialised, 'EX', ttlSecs);
      return;
    } catch {
      // Fall through to memory on Redis error
    }
  }
  memSet(key, value, ttlSecs);
}

/**
 * Delete a key from cache.
 * @param {string} key
 */
export async function del(key) {
  if (redisAvailable && redis) {
    try {
      await redis.del(key);
    } catch {
      // best-effort
    }
  }
  memDel(key);
}

/**
 * Return cached value, or call `fn`, cache the result, and return it.
 *
 * @param {string} key
 * @param {number} ttlSecs
 * @param {() => Promise<any>} fn
 * @returns {Promise<any>}
 *
 * @example
 *   const jobs = await remember('jobs:list:page1', 60, () => prisma.job.findMany(...));
 */
export async function remember(key, ttlSecs, fn) {
  const cached = await get(key);
  if (cached !== null) return cached;

  const fresh = await fn();
  await set(key, fresh, ttlSecs);
  return fresh;
}

/**
 * Delete all Redis keys matching a glob pattern.
 * Uses SCAN to avoid blocking the server.
 * No-op when using the in-memory fallback.
 *
 * @param {string} pattern - e.g. "jobs:*"
 */
export async function invalidatePattern(pattern) {
  if (!redisAvailable || !redis) return;

  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    console.error('[cache] invalidatePattern error:', err.message);
  }
}

// ─── Named cache helpers for common data ─────────────────────────────────────

export const CacheKeys = {
  jobsList: (page, filters) => `jobs:list:${page}:${JSON.stringify(filters)}`,
  jobDetail: (id) => `jobs:detail:${id}`,
  companiesList: (page) => `companies:list:${page}`,
  companyDetail: (id) => `companies:detail:${id}`,
  pincodeDetail: (pincode) => `pincodes:${pincode}`,
  localitiesByDistrict: (district) => `localities:district:${district}`,
  jobTitles: () => 'job_titles:all',
  colleges: () => 'colleges:all',
  popularSearches: () => 'search:popular',
};

export const CacheTTL = {
  SHORT: 60,       // 1 minute  — volatile lists
  MEDIUM: 300,     // 5 minutes — job / company listings
  LONG: 3600,      // 1 hour    — reference data (pincodes, titles)
  DAY: 86400,      // 24 hours  — rarely-changing reference data
};
