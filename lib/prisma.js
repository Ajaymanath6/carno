import { PrismaClient } from '@prisma/client';

/**
 * Prevent multiple PrismaClient instances during Next.js hot-reload in development.
 * In production a new module is only loaded once, so a module-level singleton is fine.
 * In dev, HMR re-executes modules — we cache the client on `globalThis` so it survives reloads.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
