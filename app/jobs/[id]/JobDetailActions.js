'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import ApplicationForm from '@/components/ApplicationForm';

/**
 * Handles the Apply button (and dialog) on the job detail page.
 * This is a client component so it can access auth state and show the form.
 * @param {{ job: object }} props
 */
export default function JobDetailActions({ job }) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  function handleApplyClick() {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    setShowForm(true);
  }

  return (
    <>
      <div className="card p-5">
        <button
          type="button"
          onClick={handleApplyClick}
          className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors"
        >
          Apply Now
        </button>
        {!isSignedIn && (
          <p className="text-xs text-gray-400 text-center mt-2">Sign in to apply</p>
        )}
      </div>

      {/* Apply modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Apply for {job.title}</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <ApplicationForm
              jobId={job.id}
              jobTitle={job.title}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
