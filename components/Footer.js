import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="content-container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">mG</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">mapmyGig</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              Find jobs near you on an interactive map. Connect with local employers across India.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              For Job Seekers
            </h4>
            <ul className="space-y-2">
              {[
                { href: '/jobs',      label: 'Browse Jobs' },
                { href: '/companies', label: 'Companies' },
                { href: '/sign-up',   label: 'Create Account' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              For Employers
            </h4>
            <ul className="space-y-2">
              {[
                { href: '/sign-up',   label: 'Post a Job' },
                { href: '/dashboard', label: 'Employer Dashboard' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'About' },
                { href: '/', label: 'Privacy Policy' },
                { href: '/', label: 'Terms of Service' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} mapmyGig. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">Made with ♥ in India</p>
        </div>
      </div>
    </footer>
  );
}
