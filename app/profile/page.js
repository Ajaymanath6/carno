'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', bio: '',
    headline: '', city: '', state: '', pincode: '',
    githubUrl: '', linkedinUrl: '', portfolioUrl: '',
    skills: '',
  });

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return;
        setUser(data);
        const p = data.profile ?? {};
        setForm({
          firstName:    p.firstName    ?? '',
          lastName:     p.lastName     ?? '',
          phone:        p.phone        ?? '',
          bio:          p.bio          ?? '',
          headline:     p.headline     ?? '',
          city:         p.city         ?? '',
          state:        p.state        ?? '',
          pincode:      p.pincode      ?? '',
          githubUrl:    p.githubUrl    ?? '',
          linkedinUrl:  p.linkedinUrl  ?? '',
          portfolioUrl: p.portfolioUrl ?? '',
          skills:       (p.skills ?? []).join(', '),
        });
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const payload = {
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to save.');
        return;
      }
      setSuccess('Profile updated successfully.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading profile…" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="content-container py-8">
        <div className="flex gap-6">
          <DashboardSidebar accountType={user?.accountType} />

          <main className="flex-1 min-w-0 max-w-2xl">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-500 mt-0.5">Keep your profile up to date to attract the best opportunities.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic info */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Personal Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-base">First Name</label>
                    <input name="firstName" value={form.firstName} onChange={handleChange} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="label-base">Last Name</label>
                    <input name="lastName" value={form.lastName} onChange={handleChange} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="label-base">Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} type="tel" className="input-base w-full" />
                  </div>
                  <div>
                    <label className="label-base">Headline</label>
                    <input name="headline" value={form.headline} onChange={handleChange} placeholder="e.g. Full Stack Developer" className="input-base w-full" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="label-base">Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    maxLength={1000}
                    placeholder="Tell employers about yourself…"
                    className="input-base w-full resize-none"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Location</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label-base">City</label>
                    <input name="city" value={form.city} onChange={handleChange} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="label-base">State</label>
                    <input name="state" value={form.state} onChange={handleChange} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="label-base">Pincode</label>
                    <input name="pincode" value={form.pincode} onChange={handleChange} maxLength={6} className="input-base w-full" />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Skills</h2>
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="React, Node.js, Python, AWS (comma-separated)"
                  className="input-base w-full"
                />
                <p className="text-xs text-gray-400 mt-1">Separate skills with commas</p>
              </div>

              {/* Links */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Links</h2>
                <div className="space-y-3">
                  <div>
                    <label className="label-base">LinkedIn URL</label>
                    <input name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} type="url" placeholder="https://linkedin.com/in/…" className="input-base w-full" />
                  </div>
                  <div>
                    <label className="label-base">GitHub URL</label>
                    <input name="githubUrl" value={form.githubUrl} onChange={handleChange} type="url" placeholder="https://github.com/…" className="input-base w-full" />
                  </div>
                  <div>
                    <label className="label-base">Portfolio / Website</label>
                    <input name="portfolioUrl" value={form.portfolioUrl} onChange={handleChange} type="url" placeholder="https://yourportfolio.com" className="input-base w-full" />
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  {success}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
