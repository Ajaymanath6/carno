'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CompanyCard from '@/components/CompanyCard';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

const INDUSTRY_OPTIONS = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
  'Manufacturing', 'Logistics', 'Hospitality', 'Media', 'Other',
];

const SIZE_OPTIONS = [
  { value: 'Micro',      label: '1–10 employees' },
  { value: 'Small',      label: '11–50 employees' },
  { value: 'Medium',     label: '51–200 employees' },
  { value: 'Large',      label: '201–1,000 employees' },
  { value: 'Enterprise', label: '1,000+ employees' },
];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [page, setPage] = useState(1);

  const fetchCompanies = useCallback(async (q, ind, sz, pg) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 20 });
      if (q)   params.set('q', q);
      if (ind) params.set('industry', ind);
      if (sz)  params.set('size', sz);

      const res = await fetch(`/api/companies?${params}`);
      const json = await res.json();
      if (json.data) {
        setCompanies(pg === 1 ? json.data.companies : (prev) => [...prev, ...json.data.companies]);
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
    fetchCompanies(query, industry, size, 1);
  }, [query, industry, size, fetchCompanies]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchCompanies(query, industry, size, next);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="content-container text-center max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Explore Companies</h1>
          <p className="text-sm text-gray-500 mb-6">
            Discover great employers across India. Find the culture that fits you.
          </p>
          <SearchBar
            onSearch={setQuery}
            defaultValue={query}
            placeholder="Search companies by name, industry…"
          />
        </div>
      </section>

      <div className="content-container py-8">
        <div className="flex gap-6">
          {/* Filters */}
          <aside className="w-52 shrink-0 hidden lg:block">
            <div className="card p-5 sticky top-24 space-y-5">
              <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Industry</h4>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-400 outline-none"
                >
                  <option value="">All industries</option>
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Company Size</h4>
                <div className="space-y-2">
                  {SIZE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="size"
                        value={opt.value}
                        checked={size === opt.value}
                        onChange={() => setSize(size === opt.value ? '' : opt.value)}
                        className="text-brand-600"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(industry || size) && (
                <button
                  onClick={() => { setIndustry(''); setSize(''); }}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading && companies.length === 0 ? 'Searching…' : `${meta.total ?? 0} companies`}
              </p>
            </div>

            {loading && companies.length === 0 ? (
              <div className="py-20 flex justify-center">
                <LoadingSpinner size="lg" label="Loading companies…" />
              </div>
            ) : companies.length === 0 ? (
              <EmptyState
                icon="🏢"
                title="No companies found"
                description="Try adjusting your search or filters."
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {companies.map((co) => (
                    <CompanyCard key={co.id} company={co} />
                  ))}
                </div>

                {meta.page < meta.totalPages && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Loading…' : 'Load More'}
                    </button>
                  </div>
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
