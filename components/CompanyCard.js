import Link from 'next/link';

const SIZE_LABELS = {
  Micro: '1–10', Small: '11–50', Medium: '51–200', Large: '201–1k', Enterprise: '1k+',
};

/**
 * @param {{ company: object }} props
 */
export default function CompanyCard({ company }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="card block p-5 hover:shadow-md transition-all group hover:border-brand-300"
    >
      <div className="flex items-start gap-4">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="w-12 h-12 rounded-xl object-contain border border-gray-100 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center shrink-0">
            <span className="text-brand-700 font-bold text-lg">{company.name[0]}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
              {company.name}
            </h3>
            {company.isVerified && (
              <svg className="w-4 h-4 text-brand-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {company.industry ?? 'Technology'}
            {company.city ? ` · ${company.city}` : ''}
          </p>
        </div>

        {company.isFeatured && (
          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Featured
          </span>
        )}
      </div>

      {company.description && (
        <p className="mt-3 text-sm text-gray-500 line-clamp-2">{company.description}</p>
      )}

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
        {company.size && <span>{SIZE_LABELS[company.size] ?? company.size} employees</span>}
        {company.fundingSeries && <span>{company.fundingSeries}</span>}
        {company._count?.jobs != null && (
          <span className="ml-auto text-gray-500 font-medium">
            {company._count.jobs} open job{company._count.jobs !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  );
}
