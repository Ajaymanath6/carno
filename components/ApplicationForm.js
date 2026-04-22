'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @param {{ jobId: string, jobTitle: string, onSuccess?: () => void }} props
 */
export default function ApplicationForm({ jobId, jobTitle, onSuccess }) {
  const router = useRouter();
  const [form, setForm] = useState({ coverLetter: '', resumeUrl: '', noticePeriod: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, ...form }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Failed to submit application.');
        return;
      }

      setSuccess(true);
      onSuccess?.();
      // Redirect to applications page after short delay
      setTimeout(() => router.push('/applications'), 1500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Application Submitted!</h3>
        <p className="text-sm text-gray-500">Redirecting to your applications…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-base">Resume URL <span className="text-red-500">*</span></label>
        <input
          name="resumeUrl"
          type="url"
          required
          value={form.resumeUrl}
          onChange={handleChange}
          placeholder="https://drive.google.com/…"
          className="input-base w-full"
        />
        <p className="text-xs text-gray-400 mt-1">Link to your resume (Google Drive, Dropbox, etc.)</p>
      </div>

      <div>
        <label className="label-base">Cover Letter</label>
        <textarea
          name="coverLetter"
          value={form.coverLetter}
          onChange={handleChange}
          rows={5}
          maxLength={2000}
          placeholder={`Tell ${jobTitle ? `the hiring team at ${jobTitle}` : 'the employer'} why you're a great fit…`}
          className="input-base w-full resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{form.coverLetter.length}/2000 characters</p>
      </div>

      <div>
        <label className="label-base">Notice Period</label>
        <select
          name="noticePeriod"
          value={form.noticePeriod}
          onChange={handleChange}
          className="input-base w-full"
        >
          <option value="">Select notice period</option>
          <option value="Immediate">Immediate</option>
          <option value="15 days">15 days</option>
          <option value="30 days">30 days</option>
          <option value="45 days">45 days</option>
          <option value="60 days">60 days</option>
          <option value="90 days">90 days</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !form.resumeUrl}
          className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </form>
  );
}
