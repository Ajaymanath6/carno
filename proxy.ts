/**
 * Next.js middleware — must be named middleware.ts (or proxy.ts aliased via matcher).
 * This file is the only TypeScript file in the project; Clerk's middleware helpers
 * require TypeScript for correct type inference with the App Router.
 *
 * Responsibilities:
 *  1. Proxy /__clerk/* requests to Clerk's Frontend API (so a custom domain is not needed)
 *  2. Protect routes — redirect unauthenticated users to /sign-in
 *  3. Redirect authenticated-but-not-onboarded users to /onboarding
 *  4. Redirect root (/) based on auth + onboarding state
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Clerk Frontend API proxy ─────────────────────────────────────────────────
/**
 * Forwards /__clerk/* requests to clerk's FAPI so the app works without a
 * custom Clerk domain (e.g. clerk.yourdomain.com).
 */
function clerkFapiProxy(req: NextRequest): NextResponse | null {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/__clerk')) return null;

  const secretKey = process.env.CLERK_SECRET_KEY ?? '';
  if (!secretKey) return null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  const proxyUrl =
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL ??
    `${baseUrl.replace(/\/$/, '')}/__clerk`;

  const proxyHeaders = new Headers(req.headers);
  proxyHeaders.set('Clerk-Proxy-Url', proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl);
  proxyHeaders.set('Clerk-Secret-Key', secretKey);

  const forwardedFor =
    req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  if (forwardedFor) proxyHeaders.set('X-Forwarded-For', forwardedFor);

  const target = new URL(req.url);
  target.host = 'frontend-api.clerk.dev';
  target.port = '443';
  target.protocol = 'https:';
  target.pathname = target.pathname.replace(/^\/__clerk/, '') || '/';

  return NextResponse.rewrite(target, { request: { headers: proxyHeaders } });
}

// ─── Route matchers ────────────────────────────────────────────────────────────

/** Routes that are always publicly accessible (no auth required). */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/jobs(.*)',
  '/companies(.*)',
  // Public API endpoints
  '/api/jobs(.*)',
  '/api/companies(.*)',
  '/api/search(.*)',
  '/api/job-titles(.*)',
  '/api/localities(.*)',
  '/api/colleges(.*)',
  '/api/pincodes(.*)',
  // Clerk proxy + webhooks
  '/__clerk(.*)',
  '/api/webhooks(.*)',
]);

/** Routes that require admin account type. */
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);

// ─── Middleware ────────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1. Proxy Clerk FAPI traffic first
  const proxyResponse = clerkFapiProxy(req);
  if (proxyResponse) return proxyResponse;

  const { userId, sessionClaims } = await auth();
  const path = req.nextUrl.pathname;

  // 2. Admin route guard — must be authenticated and have admin role
  if (isAdminRoute(req)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    // Role is stored as a public metadata field on the Clerk user
    const role = (sessionClaims?.publicMetadata as Record<string, string> | undefined)?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 3. Protected routes — must be authenticated
  if (!isPublicRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 4. Root redirect logic
  if (path === '/') {
    if (!userId) {
      // Unauthenticated: show the public landing page
      return NextResponse.next();
    }

    // Authenticated: check onboarding state from session claims metadata
    const isOnboarded =
      (sessionClaims?.publicMetadata as Record<string, boolean> | undefined)?.isOnboarded ?? false;

    if (!isOnboarded) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 5. Authenticated users who haven't completed onboarding
  //    are forced back to /onboarding unless they're already there
  //    or accessing an API / auth route.
  if (
    userId &&
    !path.startsWith('/onboarding') &&
    !path.startsWith('/api/') &&
    !path.startsWith('/sign-') &&
    !isPublicRoute(req)
  ) {
    const isOnboarded =
      (sessionClaims?.publicMetadata as Record<string, boolean> | undefined)?.isOnboarded ?? false;

    if (!isOnboarded) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  return NextResponse.next();
});

// ─── Matcher ───────────────────────────────────────────────────────────────────
/**
 * Run middleware on all routes except Next.js internals and static files.
 * The /__clerk path must be included for the FAPI proxy to work.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    '/__clerk(.*)',
  ],
};
