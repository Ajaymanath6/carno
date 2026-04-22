'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JobCard from '@/components/JobCard';
import JobFilters from '@/components/JobFilters';
import SearchBar from '@/components/SearchBar';
import MapView from '@/components/MapView';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

const DEFAULT_FILTERS = {
  category: '', workMode: undefined, jobType: undefined,
  experienceLevel: undefined, city: '', pincode: '', q: '',
};

export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    q:        searchParams.get('q')        ?? '',
    category: searchParams.get('category') ?? '',
    city:     searchParams.get('city')     ?? '',
    pincode:  searchParams.get('pincode')  ?? '',
  }));

  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'map'
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(async (filterState, pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filterState).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      params.set('page', pageNum);
      params.set('limit', '20');

      const res = await fetch(`/api/jobs?${params}`);
      const json = await res.json();
      if (json.data) {
        setJobs(pageNum === 1 ? json.data.jobs : (prev) => [...prev, ...json.data.jobs]);
        setMeta(json.data.meta ?? {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchJobs(filters, 1);
  }, [filters, fetchJobs]);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value ?? '' }));
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleSearch(q) {
    setFilters((prev) => ({ ...prev, q }));
  }

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchJobs(filters, next);
  }

  const mapJobs = jobs.filter((j) => j.location?.latitude && j.location?.longitude);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-30">
        <div className="content-container py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xl">
              <SearchBar
                defaultValue={filters.q}
                onSearch={handleSearch}
                placeholder="Search jobs, skills, companies…"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg border text-sm transition-colors ${
                  view === 'list' ? 'bg-brand-50 border-brand-300 text-brand-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setView('map')}
                className={`p-2 rounded-lg border text-sm transition-colors ${
                  view === 'map' ? 'bg-brand-50 border-brand-300 text-brand-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
                title="Map view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="content-container py-6">
        <div className="flex gap-6">
          {/* Filters sidebar */}
          <div className="w-56 shrink-0 hidden lg:block">
            <div className="card p-5 sticky top-32">
              <JobFilters
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? 'Searching…' : `${meta.total ?? 0} jobs found`}
              </p>
            </div>

            {view === 'map' ? (
              <div className="rounded-xl overflow-hidden border border-gray-200 h-[70vh]">
                {loading ? (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <LoadingSpinner label="Loading map jobs…" />
                  </div>
                ) : (
                  <MapView jobs={mapJobs} className="h-full" />
                )}
              </div>
            ) : (
              <>
                {loading && jobs.length === 0 ? (
                  <div className="py-20 flex justify-center">
                    <LoadingSpinner size="lg" label="Finding jobs…" />
                  </div>
                ) : jobs.length === 0 ? (
                  <EmptyState
                    icon="🔍"
                    title="No jobs found"
                    description="Try adjusting your filters or search query."
                    action={
                      <button
                        onClick={handleReset}
                        className="text-sm px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
                      >
                        Clear Filters
                      </button>
                    }
                  />
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
                      {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>

                    {meta.page < meta.totalPages && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={handleLoadMore}
                          disabled={loading}
                          className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {loading ? 'Loading…' : 'Load More Jobs'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
