'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @param {{ placeholder?: string, defaultValue?: string, onSearch?: (q: string) => void }} props
 */
export default function SearchBar({ placeholder = 'Search jobs, companies, skills…', defaultValue = '', onSearch }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions(null);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const { data } = await res.json();
          setSuggestions(data);
          setOpen(true);
        }
      } catch {
        // ignore network errors in search suggestions
      }
    }, 300);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setOpen(false);
    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/jobs?q=${encodeURIComponent(query)}`);
    }
  }

  function selectSuggestion(item, type) {
    setOpen(false);
    if (type === 'job') router.push(`/jobs/${item.slug}`);
    else if (type === 'company') router.push(`/companies/${item.slug}`);
    else if (type === 'title') {
      setQuery(item.title);
      if (onSearch) onSearch(item.title);
      else router.push(`/jobs?q=${encodeURIComponent(item.title)}`);
    } else if (type === 'locality') {
      setQuery(item.localityName);
      if (onSearch) onSearch(item.localityName);
      else router.push(`/jobs?pincode=${encodeURIComponent(item.pincode)}`);
    }
  }

  const hasResults =
    suggestions &&
    (suggestions.jobs?.length > 0 ||
      suggestions.companies?.length > 0 ||
      suggestions.titles?.length > 0 ||
      suggestions.localities?.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => hasResults && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none transition shadow-sm"
        />
        <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {open && hasResults && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
          {suggestions.jobs?.length > 0 && (
            <SuggestionGroup label="Jobs">
              {suggestions.jobs.map((job) => (
                <SuggestionItem
                  key={job.id}
                  primary={job.title}
                  secondary={job.company?.name}
                  onClick={() => selectSuggestion(job, 'job')}
                />
              ))}
            </SuggestionGroup>
          )}
          {suggestions.companies?.length > 0 && (
            <SuggestionGroup label="Companies">
              {suggestions.companies.map((co) => (
                <SuggestionItem
                  key={co.id}
                  primary={co.name}
                  secondary={co.industry}
                  onClick={() => selectSuggestion(co, 'company')}
                />
              ))}
            </SuggestionGroup>
          )}
          {suggestions.titles?.length > 0 && (
            <SuggestionGroup label="Job Titles">
              {suggestions.titles.map((t) => (
                <SuggestionItem
                  key={t.id}
                  primary={t.title}
                  onClick={() => selectSuggestion(t, 'title')}
                />
              ))}
            </SuggestionGroup>
          )}
          {suggestions.localities?.length > 0 && (
            <SuggestionGroup label="Locations">
              {suggestions.localities.map((l) => (
                <SuggestionItem
                  key={l.id}
                  primary={l.localityName}
                  secondary={`${l.district}, ${l.state} · ${l.pincode}`}
                  onClick={() => selectSuggestion(l, 'locality')}
                />
              ))}
            </SuggestionGroup>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionGroup({ label, children }) {
  return (
    <div>
      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
        {label}
      </div>
      {children}
    </div>
  );
}

function SuggestionItem({ primary, secondary, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 text-left transition-colors"
    >
      <div>
        <p className="text-sm font-medium text-gray-900">{primary}</p>
        {secondary && <p className="text-xs text-gray-500">{secondary}</p>}
      </div>
    </button>
  );
}
