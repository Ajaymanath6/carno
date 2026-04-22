import { getCurrentUser } from '@/lib/getCurrentUser';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';

export const metadata = { title: 'Dashboard — mapmyGig' };

export default async function DashboardPage() {
  const user = await getCurrentUser({ includeProfile: true, includeCompany: true });
  if (!user) redirect('/sign-in');
  if (!user.isOnboarded) redirect('/onboarding');

  const greeting = user.profile?.firstName
    ? `Welcome back, ${user.profile.firstName}!`
    : 'Welcome back!';

  const subtitle =
    user.accountType === 'Employer'
      ? 'Manage your job postings and review applicants.'
      : user.accountType === 'Admin'
      ? 'Platform overview and administration.'
      : 'Discover jobs near you and track your applications.';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="content-container py-8">
        <div className="flex gap-6">
          <DashboardSidebar accountType={user.accountType} />

          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">{greeting}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {user.accountType === 'JobSeeker' && (
                <>
                  <QuickCard label="My Applications" icon="📄" href="/applications" />
                  <QuickCard label="Browse Jobs"     icon="🔍" href="/jobs" />
                  <QuickCard label="My Profile"      icon="👤" href="/profile" />
                </>
              )}
              {user.accountType === 'Employer' && (
                <>
                  <QuickCard label="Post a Job"      icon="➕" href="/jobs" />
                  <QuickCard label="Applications"    icon="📄" href="/applications" />
                  <QuickCard label="Company Profile" icon="🏢"
                    href={user.ownedCompany?.slug ? `/companies/${user.ownedCompany.slug}` : '/profile'}
                  />
                </>
              )}
              {user.accountType === 'Admin' && (
                <>
                  <QuickCard label="Admin Panel"  icon="🛡️" href="/admin" />
                  <QuickCard label="All Jobs"     icon="💼" href="/admin" />
                  <QuickCard label="Users"        icon="👥" href="/admin" />
                </>
              )}
            </div>

            {/* Quick links section */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4 text-sm">Quick Links</h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/jobs"         className="pill-link">Browse Jobs</Link>
                <Link href="/companies"    className="pill-link">Explore Companies</Link>
                <Link href="/applications" className="pill-link">My Applications</Link>
                <Link href="/messages"     className="pill-link">Messages</Link>
                <Link href="/profile"      className="pill-link">Edit Profile</Link>
                {user.accountType === 'Admin' && (
                  <Link href="/admin" className="pill-link">Admin Panel</Link>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function QuickCard({ label, icon, href }) {
  return (
    <Link
      href={href}
      className="card p-5 hover:shadow-md transition-all block group hover:border-brand-300"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">
        {label}
      </p>
    </Link>
  );
}
