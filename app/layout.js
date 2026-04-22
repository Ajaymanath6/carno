import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: {
    default: 'mapmyGig — Find Jobs Near You',
    template: '%s | mapmyGig',
  },
  description:
    'mapmyGig is a location-aware jobs marketplace. Browse, search, and apply to jobs on an interactive map.',
  keywords: ['jobs', 'jobs near me', 'local jobs', 'job map', 'mapmyGig', 'nextdoorjobs'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'mapmyGig — Find Jobs Near You',
    description: 'Browse and apply to jobs on an interactive map.',
    type: 'website',
    locale: 'en_IN',
  },
};

// Prevent static pre-rendering of routes that read Clerk env at request time
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  const body = (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Required container for Clerk Smart CAPTCHA bot protection */}
        <div id="clerk-captcha" style={{ display: 'none' }} />
        {children}
      </body>
    </html>
  );

  // Boot without Clerk in local dev when keys are not configured
  if (!publishableKey?.trim() || !secretKey?.trim()) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[mapmyGig] Clerk keys missing. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.'
      );
    }
    return body;
  }

  // If a custom proxy URL is set (e.g. https://yourdomain.com/__clerk), use it.
  // Otherwise derive one from NEXT_PUBLIC_APP_URL so clerk-js is served from our domain.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const proxyUrl =
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL ||
    (baseUrl ? `${baseUrl.replace(/\/$/, '')}/__clerk` : undefined);

  // Allow swapping the Clerk JS bundle via env (useful if Clerk CDN is blocked)
  const clerkJsUrl = process.env.NEXT_PUBLIC_CLERK_JS_URL;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      {...(proxyUrl && { proxyUrl })}
      {...(clerkJsUrl && { clerkJSUrl: clerkJsUrl })}
    >
      {body}
    </ClerkProvider>
  );
}
