'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const SEEKER_LINKS = [
  { href: '/dashboard',    label: 'Overview',     icon: HomeIcon },
  { href: '/jobs',         label: 'Browse Jobs',  icon: BriefcaseIcon },
  { href: '/applications', label: 'My Applications', icon: DocumentIcon },
  { href: '/messages',     label: 'Messages',     icon: ChatIcon },
  { href: '/profile',      label: 'Profile',      icon: UserIcon },
];

const EMPLOYER_LINKS = [
  { href: '/dashboard',    label: 'Overview',     icon: HomeIcon },
  { href: '/dashboard/jobs', label: 'My Jobs',    icon: BriefcaseIcon },
  { href: '/applications', label: 'Applications', icon: DocumentIcon },
  { href: '/messages',     label: 'Messages',     icon: ChatIcon },
  { href: '/profile',      label: 'Profile',      icon: UserIcon },
  { href: '/companies',    label: 'Company',      icon: BuildingIcon },
];

const ADMIN_LINKS = [
  { href: '/dashboard',     label: 'Overview',   icon: HomeIcon },
  { href: '/admin',         label: 'Admin Panel', icon: ShieldIcon },
  { href: '/jobs',          label: 'Jobs',        icon: BriefcaseIcon },
  { href: '/companies',     label: 'Companies',   icon: BuildingIcon },
  { href: '/applications',  label: 'Applications', icon: DocumentIcon },
  { href: '/messages',      label: 'Messages',    icon: ChatIcon },
];

/**
 * @param {{ accountType?: string }} props
 */
export default function DashboardSidebar({ accountType }) {
  const pathname = usePathname();

  const links =
    accountType === 'Admin'    ? ADMIN_LINKS    :
    accountType === 'Employer' ? EMPLOYER_LINKS :
                                 SEEKER_LINKS;

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <nav className="space-y-1 sticky top-18">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// Inline SVG icon helpers

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
    </svg>
  );
}

function BriefcaseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function DocumentIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function BuildingIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
