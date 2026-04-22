import { ok, created, error, withErrorHandler, parsePagination, buildPaginationMeta } from '@/lib/utils';
import { parseBody, validateCompany } from '@/lib/validations';
import { requireUser, requireEmployer } from '@/lib/getCurrentUser';
import { listCompanies, createCompany, generateUniqueSlug } from '@/lib/services/company.service';

/**
 * GET /api/companies
 * Public — paginated company listings.
 * Query: page, pageSize, search, industry, city
 */
export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const { page, pageSize } = parsePagination(searchParams);

  const { companies, total } = await listCompanies({
    page,
    pageSize,
    search:   searchParams.get('search') ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    city:     searchParams.get('city') ?? undefined,
  });

  return ok({ companies, meta: buildPaginationMeta({ total, page, pageSize }) });
});

/**
 * POST /api/companies
 * Protected — Employer only. Creates a company for the current user.
 * Body: { name, description?, industry?, size?, websiteUrl?, city, state, pincode, ... }
 */
export const POST = withErrorHandler(async (req) => {
  const user = await requireEmployer();

  if (user.ownedCompany) {
    return error('You already have a company. Update it instead.', 409);
  }

  const body = await parseBody(req);
  if (!body) return error('Request body is required.', 400);

  const slug = body.slug ?? (await generateUniqueSlug(body.name ?? ''));
  const payload = { ...body, slug };

  const validation = validateCompany(payload);
  if (!validation.valid) return error('Validation failed.', 422, { errors: validation.errors });

  const company = await createCompany(user.id, payload);
  return created(company);
});
