import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getJob as getJobBySlug } from '@/lib/services/job.service';
import { formatSalary, timeAgo } from '@/lib/utils';
import JobDetailActions from './JobDetailActions';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const job = await getJobBySlug(id);
    return {
      title: job ? `${job.title} at ${job.company?.name} — mapmyGig` : 'Job Not Found',
      description: job?.description?.slice(0, 160) ?? '',
    };
  } catch {
    return { title: 'Job — mapmyGig' };
  }
}

export default async function JobDetailPage({ params }) {
  const { id } = await params;
  const job = await getJobBySlug(id).catch(() => null);

  if (!job) return notFound();

  const salaryText =
    job.salaryMin && job.salaryMax
      ? `${formatSalary(job.salaryMin)} – ${formatSalary(job.salaryMax)} per year`
      : job.salaryMin
      ? `From ${formatSalary(job.salaryMin)} per year`
      : 'Not disclosed';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="content-container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-400 mb-6">
            <Link href="/jobs" className="hover:text-brand-600 transition-colors">Jobs</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-600">{job.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header card */}
              <div className="card p-6">
                <div className="flex items-start gap-4">
                  {job.company?.logoUrl ? (
                    <img
                      src={job.company.logoUrl}
                      alt={job.company.name}
                      className="w-14 h-14 rounded-xl object-contain border border-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-gray-400 font-bold text-xl">{job.company?.name?.[0] ?? '?'}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                      {job.isFeatured && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Featured
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/companies/${job.company?.slug}`}
                      className="text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors"
                    >
                      {job.company?.name}
                    </Link>
                    <p className="text-sm text-gray-400 mt-1">Posted {timeAgo(job.createdAt)}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    job.workMode === 'OnSite' ? 'On-Site' : job.workMode,
                    job.jobType?.replace(/([A-Z])/g, ' $1').trim(),
                    job.experienceLevel,
                    job.location?.city,
                  ].filter(Boolean).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Job Description</h2>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                  {job.description}
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Requirements</h2>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                    {job.requirements}
                  </div>
                </div>
              )}

              {/* Skills */}
              {job.skills?.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-3">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span key={skill} className="text-sm px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Apply + Save — client component */}
              <JobDetailActions job={job} />

              {/* Quick details */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm">Job Details</h3>
                <dl className="space-y-3">
                  <DetailRow label="Salary" value={salaryText} />
                  <DetailRow label="Location" value={[job.location?.city, job.location?.state].filter(Boolean).join(', ') || 'Not specified'} />
                  <DetailRow label="Work Mode" value={job.workMode === 'OnSite' ? 'On-Site' : job.workMode} />
                  <DetailRow label="Job Type" value={job.jobType?.replace(/([A-Z])/g, ' $1').trim()} />
                  {job.vacancies && <DetailRow label="Openings" value={job.vacancies} />}
                  {job.applicationDeadline && (
                    <DetailRow
                      label="Apply By"
                      value={new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    />
                  )}
                </dl>
              </div>

              {/* About company */}
              {job.company && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">About the Company</h3>
                  {job.company.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-3">{job.company.description}</p>
                  )}
                  <Link
                    href={`/companies/${job.company.slug}`}
                    className="text-sm text-brand-600 font-medium hover:text-brand-800 transition-colors"
                  >
                    View Company Profile →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-gray-400">{label}</dt>
      <dd className="text-gray-800 font-medium text-right ml-4">{value}</dd>
    </div>
  );
}
