'use client';

import { JOB_CATEGORIES, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from '@/lib/constants';

/**
 * @param {{ filters: object, onChange: (key, value) => void, onReset: () => void }} props
 */
export default function JobFilters({ filters, onChange, onReset }) {
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== '' && v !== undefined && v !== null
  );

  return (
    <aside className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterSection label="Category">
        <select
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          value={filters.category ?? ''}
          onChange={(e) => onChange('category', e.target.value || undefined)}
        >
          <option value="">All categories</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </FilterSection>

      <FilterSection label="Work Mode">
        <div className="space-y-2">
          {WORK_MODES.map((m) => (
            <label key={m.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="workMode"
                value={m.value}
                checked={filters.workMode === m.value}
                onChange={() => onChange('workMode', filters.workMode === m.value ? undefined : m.value)}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{m.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Job Type">
        <div className="space-y-2">
          {JOB_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="jobType"
                value={t.value}
                checked={filters.jobType === t.value}
                onChange={() => onChange('jobType', filters.jobType === t.value ? undefined : t.value)}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Experience Level">
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((l) => (
            <label key={l.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="experienceLevel"
                value={l.value}
                checked={filters.experienceLevel === l.value}
                onChange={() => onChange('experienceLevel', filters.experienceLevel === l.value ? undefined : l.value)}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{l.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Location">
        <input
          type="text"
          placeholder="City"
          value={filters.city ?? ''}
          onChange={(e) => onChange('city', e.target.value || undefined)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        />
        <input
          type="text"
          placeholder="Pincode"
          maxLength={6}
          value={filters.pincode ?? ''}
          onChange={(e) => onChange('pincode', e.target.value || undefined)}
          className="w-full mt-2 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        />
      </FilterSection>
    </aside>
  );
}

function FilterSection({ label, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</h4>
      {children}
    </div>
  );
}
