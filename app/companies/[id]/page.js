import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JobCard from '@/components/JobCard';
import { getCompany as getCompanyBySlug } from '@/lib/services/company.service';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const co = await getCompanyBySlug(id);
    return { title: co ? `${co.name} — mapmyGig` : 'Company Not Found' };
  } catch {
    return { title: 'Company — mapmyGig' };
  }
}

const FUNDING_LABELS = {
  Bootstrapped: 'Bootstrapped', PreSeed: 'Pre-Seed', Seed: 'Seed',
  SeriesA: 'Series A', SeriesB: 'Series B', SeriesC: 'Series C+',
  PubliclyListed: 'Public', Acquired: 'Acquired',
};

const SIZE_LABELS = {
  Micro: '1–10', Small: '11–50', Medium: '51–200',
  Large: '201–1,000', Enterprise: '1,000+',
};

export default async function CompanyDetailPage({ params }) {
  const { id } = await params;
  const company = await getCompanyBySlug(id).catch(() => null);

  if (!company) return notFound();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="content-container py-8">
        <nav className="text-sm text-gray-400 mb-6">
          <Link href="/companies" className="hover:text-brand-600 transition-colors">Companies</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{company.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="card p-6">
              <div className="flex items-start gap-5">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-16 h-16 rounded-xl object-contain border border-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center shrink-0">
                    <span className="text-brand-700 font-extrabold text-2xl">{company.name[0]}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                    {company.isVerified && (
                      <svg className="w-5 h-5 text-brand-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-gray-500 mt-0.5">
                    {company.industry ?? 'Technology'}
                    {company.city ? ` · ${company.city}` : ''}
                  </p>
                  {company.websiteUrl && (
                    <a
                      href={company.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-600 hover:underline mt-1 inline-block"
                    >
                      {company.websiteUrl.replace(/^https?:\/\//, '')} ↗
                    </a>
                  )}
                </div>
              </div>

              {company.description && (
                <p className="mt-5 text-gray-600 text-sm leading-relaxed">{company.description}</p>
              )}
            </div>

            {/* Open Jobs */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">
                Open Positions
                {company.jobs?.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">({company.jobs.length})</span>
                )}
              </h2>

              {company.jobs?.length > 0 ? (
                <div className="space-y-4">
                  {company.jobs.map((job) => (
                    <JobCard key={job.id} job={{ ...job, company }} />
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center text-gray-400 text-sm">
                  No open positions right now. Check back later.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Company Info</h3>
              <dl className="space-y-3">
                {company.size && (
                  <InfoRow label="Size" value={`${SIZE_LABELS[company.size] ?? company.size} employees`} />
                )}
                {company.fundingSeries && (
                  <InfoRow label="Funding" value={FUNDING_LABELS[company.fundingSeries] ?? company.fundingSeries} />
                )}
                {company.foundedYear && (
                  <InfoRow label="Founded" value={company.foundedYear} />
                )}
                {company.city && (
                  <InfoRow
                    label="HQ"
                    value={[company.city, company.state].filter(Boolean).join(', ')}
                  />
                )}
                {company._count?.jobs != null && (
                  <InfoRow label="Open Jobs" value={company._count.jobs} />
                )}
              </dl>
            </div>

            {/* Social links */}
            {(company.linkedinUrl || company.twitterUrl || company.websiteUrl) && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Links</h3>
                <div className="flex flex-col gap-2">
                  {company.websiteUrl && (
                    <SocialLink href={company.websiteUrl} label="Website" />
                  )}
                  {company.linkedinUrl && (
                    <SocialLink href={company.linkedinUrl} label="LinkedIn" />
                  )}
                  {company.twitterUrl && (
                    <SocialLink href={company.twitterUrl} label="Twitter" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-gray-400">{label}</dt>
      <dd className="text-gray-800 font-medium">{value}</dd>
    </div>
  );
}

function SocialLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      {label}
    </a>
  );
}
