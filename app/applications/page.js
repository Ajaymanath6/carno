'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { timeAgo } from '@/lib/utils';

const STATUS_STYLES = {
  Applied:    'bg-blue-50 text-blue-700 border-blue-200',
  Reviewing:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  Shortlisted:'bg-purple-50 text-purple-700 border-purple-200',
  Interview:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  Offered:    'bg-green-50 text-green-700 border-green-200',
  Rejected:   'bg-red-50 text-red-700 border-red-200',
  Withdrawn:  'bg-gray-50 text-gray-600 border-gray-200',
  Hired:      'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const EMPLOYER_STATUS_OPTIONS = ['Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Rejected', 'Hired'];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/users/me').then((r) => r.json()),
      fetch('/api/applications').then((r) => r.json()),
    ])
      .then(([userRes, appsRes]) => {
        setUser(userRes.data);
        setApplications(appsRes.data?.applications ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(appId, newStatus) {
    setUpdatingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  const isEmployer = user?.accountType === 'Employer' || user?.accountType === 'Admin';

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading applications…" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="content-container py-8">
        <div className="flex gap-6">
          <DashboardSidebar accountType={user?.accountType} />

          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">
                {isEmployer ? 'Job Applications' : 'My Applications'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {applications.length} application{applications.length !== 1 ? 's' : ''}
              </p>
            </div>

            {applications.length === 0 ? (
              <EmptyState
                icon="📄"
                title="No applications yet"
                description={
                  isEmployer
                    ? 'Applications to your job listings will appear here.'
                    : "You haven't applied to any jobs yet."
                }
                action={
                  !isEmployer && (
                    <Link
                      href="/jobs"
                      className="text-sm px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
                    >
                      Browse Jobs
                    </Link>
                  )
                }
              />
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {app.job?.company?.logoUrl ? (
                          <img
                            src={app.job.company.logoUrl}
                            alt={app.job.company.name}
                            className="w-10 h-10 rounded-lg object-contain border border-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <span className="text-gray-400 font-semibold text-sm">
                              {app.job?.company?.name?.[0] ?? '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/jobs/${app.job?.slug}`}
                            className="font-semibold text-gray-900 hover:text-brand-600 transition-colors"
                          >
                            {app.job?.title ?? 'Unknown Job'}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {app.job?.company?.name ?? ''}
                            {app.job?.location?.city ? ` · ${app.job.location.city}` : ''}
                          </p>
                          {isEmployer && app.applicant?.profile && (
                            <p className="text-sm text-brand-600 mt-0.5">
                              {app.applicant.profile.firstName} {app.applicant.profile.lastName}
                              <span className="text-gray-400 ml-1">({app.applicant.email})</span>
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Applied {timeAgo(app.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isEmployer ? (
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            disabled={updatingId === app.id}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none disabled:opacity-50 ${STATUS_STYLES[app.status] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}
                          >
                            {EMPLOYER_STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${STATUS_STYLES[app.status] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                            {app.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {app.coverLetter && (
                      <details className="mt-3">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                          View cover letter
                        </summary>
                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                          {app.coverLetter}
                        </p>
                      </details>
                    )}

                    {app.resumeUrl && (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-brand-600 hover:text-brand-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Resume
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
