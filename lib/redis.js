/**
 * lib/redis.js — ioredis client singleton
 *
 * Returns a connected Redis client when REDIS_URL is configured.
 * Exports a `redis` instance and a `redisAvailable` boolean so callers
 * can branch without try/catch boilerplate.
 *
 * The client is cached on `globalThis` to survive Next.js hot-reloads in dev.
 */

import Redis from 'ioredis';

const globalForRedis = globalThis;

let redis = null;
let redisAvailable = false;

if (process.env.REDIS_URL) {
  redis =
    globalForRedis.redis ??
    new Redis(process.env.REDIS_URL, {
      // Fail fast — do not queue commands while reconnecting
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: false,
    });

  redis.on('connect', () => {
    redisAvailable = true;
  });

  redis.on('ready', () => {
    redisAvailable = true;
  });

  redis.on('error', (err) => {
    redisAvailable = false;
    console.error('[redis] Connection error:', err.message);
  });

  redis.on('close', () => {
    redisAvailable = false;
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
  }
}

export { redis, redisAvailable };
