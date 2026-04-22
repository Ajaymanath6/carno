import { ok, error, withErrorHandler } from '@/lib/utils';
import { combinedSearch, searchJobTitles, searchLocalities } from '@/lib/services/search.service';

/**
 * GET /api/search
 * Public — combined fuzzy search across jobs, companies, titles, and localities.
 *
 * Query params:
 *   q          (required) - search query
 *   type       (optional) - limit to: "jobs" | "companies" | "titles" | "localities" | "all" (default)
 *   jobLimit   (optional, default 5)
 *   companyLimit (optional, default 3)
 *   titleLimit  (optional, default 4)
 *   localityLimit (optional, default 4)
 */
export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q) return error('q (search query) is required.', 400);
  if (q.length < 2) return error('Query must be at least 2 characters.', 400);

  const type         = searchParams.get('type') ?? 'all';
  const jobLimit     = parseInt(searchParams.get('jobLimit')      ?? '5',  10);
  const companyLimit = parseInt(searchParams.get('companyLimit')  ?? '3',  10);
  const titleLimit   = parseInt(searchParams.get('titleLimit')    ?? '4',  10);
  const localityLimit= parseInt(searchParams.get('localityLimit') ?? '4',  10);

  // Narrow search for autocomplete dropdowns
  if (type === 'titles') {
    const titles = await searchJobTitles(q, titleLimit);
    return ok({ titles });
  }

  if (type === 'localities') {
    const localities = await searchLocalities(q, localityLimit);
    return ok({ localities });
  }

  const results = await combinedSearch(q, { jobLimit, companyLimit, titleLimit, localityLimit });
  return ok(results);
});
