/**
 * lib/utils.js — Shared utility helpers
 */

import { NextResponse } from 'next/server';
import { EARTH_RADIUS_KM, HTTP } from '@/lib/constants';

// ─── API response helpers ──────────────────────────────────────────────────────

/**
 * Return a successful JSON response.
 * @param {any} data
 * @param {number} [status=200]
 */
export function ok(data, status = HTTP.OK) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Return a created (201) JSON response.
 * @param {any} data
 */
export function created(data) {
  return NextResponse.json({ success: true, data }, { status: HTTP.CREATED });
}

/**
 * Return an error JSON response.
 * @param {string} message
 * @param {number} [status=400]
 * @param {object} [extra] - Additional fields merged into the response body
 */
export function error(message, status = HTTP.BAD_REQUEST, extra = {}) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

/**
 * Wrap a route handler with centralised error handling.
 * Catches thrown objects with a `status` field (from requireUser etc.)
 * and any unexpected errors, and returns an appropriate JSON response.
 *
 * @param {() => Promise<NextResponse>} fn
 * @returns {Promise<NextResponse>}
 *
 * @example
 *   export const GET = withErrorHandler(async (req) => {
 *     const user = await requireUser();
 *     return ok(user);
 *   });
 */
export function withErrorHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) {
        return error(err.message ?? 'Request failed.', err.status);
      }
      console.error('[route] Unhandled error:', err);
      return error('Internal server error.', HTTP.SERVER_ERROR);
    }
  };
}

// ─── Pagination ───────────────────────────────────────────────────────────────

/**
 * Parse pagination params from a URL's searchParams.
 * @param {URLSearchParams} searchParams
 * @param {number} [defaultSize=20]
 * @returns {{ page: number, pageSize: number, skip: number }}
 */
export function parsePagination(searchParams, defaultSize = 20) {
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? String(defaultSize), 10)));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/**
 * Build a pagination metadata object to include in API responses.
 * @param {{ total: number, page: number, pageSize: number }}
 */
export function buildPaginationMeta({ total, page, pageSize }) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: page * pageSize < total,
    hasPrevPage: page > 1,
  };
}

// ─── Geo / distance ───────────────────────────────────────────────────────────

/**
 * Haversine distance between two lat/lng points in kilometres.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number}
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns a Prisma `where` clause fragment to filter records within a radius.
 * Uses a simple bounding-box approximation (fast, index-friendly).
 * Pair with haversineDistance for precise client-side filtering if needed.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {{ latitude: { gte: number, lte: number }, longitude: { gte: number, lte: number } }}
 */
export function geoBoxFilter(lat, lng, radiusKm) {
  const latDelta = radiusKm / 111; // 1 degree lat ≈ 111 km
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    latitude:  { gte: lat - latDelta, lte: lat + latDelta },
    longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
  };
}

// ─── String helpers ───────────────────────────────────────────────────────────

/**
 * Convert a string to a URL-safe slug.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate a string to maxLen characters, appending '…' if truncated.
 * @param {string} str
 * @param {number} maxLen
 */
export function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Format an integer salary value into a human-readable string.
 * @param {number} amount - Annual amount in INR
 * @param {string} [currency='INR']
 */
export function formatSalary(amount, currency = 'INR') {
  if (!amount) return null;
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000)   return `${(amount / 100000).toFixed(1)} L`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

/**
 * Returns a relative time string ("2 hours ago", "3 days ago").
 * @param {Date | string} date
 */
export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60)   return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Object helpers ───────────────────────────────────────────────────────────

/**
 * Pick a subset of keys from an object.
 * @param {object} obj
 * @param {string[]} keys
 */
export function pick(obj, keys) {
  return Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));
}

/**
 * Omit a subset of keys from an object.
 * @param {object} obj
 * @param {string[]} keys
 */
export function omit(obj, keys) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}

/**
 * Remove undefined/null values from an object (useful for Prisma update payloads).
 * @param {object} obj
 */
export function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));
}

// ─── Array helpers ────────────────────────────────────────────────────────────

/** Parse a comma-separated string into a trimmed, non-empty string array. */
export function parseCSV(str) {
  if (!str) return [];
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}
