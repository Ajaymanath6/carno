'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { timeAgo } from '@/lib/utils';

const STAT_DEFINITIONS = [
  { key: 'totalUsers',        label: 'Total Users',       icon: '👥' },
  { key: 'totalJobs',         label: 'Total Jobs',         icon: '💼' },
  { key: 'totalCompanies',    label: 'Companies',          icon: '🏢' },
  { key: 'totalApplications', label: 'Applications',       icon: '📄' },
  { key: 'activeJobs',        label: 'Active Jobs',        icon: '✅' },
  { key: 'pendingApprovals',  label: 'Pending Approvals',  icon: '⏳' },
];

export default function AdminPage() {
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('overview'); // 'overview' | 'users' | 'jobs'
  const [moderating, setModerating] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/admin/users?limit=20').then((r) => r.json()),
      fetch('/api/admin/jobs?limit=20').then((r) => r.json()),
    ])
      .then(([statsRes, usersRes, jobsRes]) => {
        setStats(statsRes.data ?? {});
        setUsers(usersRes.data?.users ?? []);
        setJobs(jobsRes.data?.jobs ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleModerate(jobId, action) {
    setModerating(jobId);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, isApproved: action === 'approve', isFeatured: action === 'feature' ? true : j.isFeatured }
              : j
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModerating(null);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading admin panel…" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="content-container py-8">
        <div className="flex gap-6">
          <DashboardSidebar accountType="Admin" />

          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500 mt-0.5">Platform overview and moderation</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'users',    label: `Users (${users.length})` },
                { id: 'jobs',     label: `Jobs (${jobs.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {STAT_DEFINITIONS.map(({ key, label, icon }) => (
                    <div key={key} className="card p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{icon}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.[key] ?? '—'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 text-sm">Quick Actions</h2>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setTab('jobs')}
                      className="text-sm px-4 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
                    >
                      Review Pending Jobs
                    </button>
                    <button
                      onClick={() => setTab('users')}
                      className="text-sm px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
                    >
                      Manage Users
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users tab */}
            {tab === 'users' && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 text-sm">Users</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3">
                            <div>
                              <p className="font-medium text-gray-900">
                                {u.profile?.firstName
                                  ? `${u.profile.firstName} ${u.profile.lastName ?? ''}`.trim()
                                  : u.email}
                              </p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <RoleBadge role={u.accountType} />
                          </td>
                          <td className="px-5 py-3 text-gray-500">{timeAgo(u.createdAt)}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                              u.isActive
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {u.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Jobs tab */}
            {tab === 'jobs' && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 text-sm">Jobs</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Posted</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3">
                            <Link
                              href={`/jobs/${job.slug}`}
                              className="font-medium text-gray-900 hover:text-brand-600 transition-colors"
                            >
                              {job.title}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-gray-500">{job.company?.name ?? '—'}</td>
                          <td className="px-5 py-3 text-gray-500">{timeAgo(job.createdAt)}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1.5 flex-wrap">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                job.isActive
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {job.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {!job.isApproved && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Pending
                                </span>
                              )}
                              {job.isFeatured && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                  Featured
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              {!job.isApproved && (
                                <button
                                  onClick={() => handleModerate(job.id, 'approve')}
                                  disabled={moderating === job.id}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-colors font-medium"
                                >
                                  Approve
                                </button>
                              )}
                              {!job.isFeatured && (
                                <button
                                  onClick={() => handleModerate(job.id, 'feature')}
                                  disabled={moderating === job.id}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-colors font-medium"
                                >
                                  Feature
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    Admin:     'bg-red-50 text-red-700 border-red-200',
    Employer:  'bg-purple-50 text-purple-700 border-purple-200',
    JobSeeker: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[role] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {role}
    </span>
  );
}
