'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';

const NAV_LINKS = [
  { href: '/jobs',      label: 'Jobs' },
  { href: '/companies', label: 'Companies' },
];

const AUTH_LINKS = [
  { href: '/dashboard',    label: 'Dashboard' },
  { href: '/applications', label: 'Applications' },
  { href: '/messages',     label: 'Messages' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  const linkClass = (href) =>
    `text-sm font-medium transition-colors ${
      isActive(href) ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="content-container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">mG</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">mapmyGig</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
            {isSignedIn &&
              AUTH_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                  {l.label}
                </Link>
              ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm font-semibold px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden py-3 border-t border-gray-100 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2 py-2 rounded-lg text-sm font-medium ${
                  isActive(l.href) ? 'bg-brand-50 text-brand-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {isSignedIn &&
              AUTH_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-2 py-2 rounded-lg text-sm font-medium ${
                    isActive(l.href) ? 'bg-brand-50 text-brand-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
          </nav>
        )}
      </div>
    </header>
  );
}
