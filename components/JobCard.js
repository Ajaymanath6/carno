import Link from 'next/link';
import { formatSalary, timeAgo } from '@/lib/utils';

const WORK_MODE_BADGE = {
  Remote: 'bg-green-50 text-green-700 border-green-200',
  Hybrid: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  OnSite: 'bg-blue-50 text-blue-700 border-blue-200',
};

const JOB_TYPE_LABELS = {
  FullTime: 'Full Time', PartTime: 'Part Time', Contract: 'Contract',
  Internship: 'Internship', Freelance: 'Freelance', Temporary: 'Temporary',
};

/**
 * @param {{ job: object, compact?: boolean }} props
 */
export default function JobCard({ job, compact = false }) {
  const salaryText =
    job.salaryMin && job.salaryMax
      ? `${formatSalary(job.salaryMin)} – ${formatSalary(job.salaryMax)}/yr`
      : job.salaryMin
      ? `From ${formatSalary(job.salaryMin)}/yr`
      : null;

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="card block p-5 hover:shadow-md transition-all group hover:border-brand-300"
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Company logo */}
        {job.company?.logoUrl ? (
          <img
            src={job.company.logoUrl}
            alt={job.company.name}
            className="w-10 h-10 rounded-lg object-contain border border-gray-100 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-gray-400 font-semibold text-sm">
              {job.company?.name?.[0] ?? '?'}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
            {job.title}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {job.company?.name}
            {job.location?.city ? ` · ${job.location.city}` : ''}
          </p>
        </div>

        {/* Featured badge */}
        {job.isFeatured && (
          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Featured
          </span>
        )}
      </div>

      {!compact && (
        <>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${WORK_MODE_BADGE[job.workMode] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {job.workMode === 'OnSite' ? 'On-Site' : job.workMode}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
              {JOB_TYPE_LABELS[job.jobType] ?? job.jobType}
            </span>
            {job.experienceLevel && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                {job.experienceLevel}
              </span>
            )}
          </div>

          {/* Skills preview */}
          {job.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {job.skills.slice(0, 4).map((skill) => (
                <span key={skill} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 && (
                <span className="text-xs text-gray-400">+{job.skills.length - 4} more</span>
              )}
            </div>
          )}
        </>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {salaryText && <span className="text-gray-600 font-medium">{salaryText}</span>}
          <span>{timeAgo(job.createdAt)}</span>
        </div>
        {job._count?.applications != null && (
          <span className="text-xs text-gray-400">
            {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  );
}
