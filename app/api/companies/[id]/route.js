import { ok, error, withErrorHandler } from '@/lib/utils';
import { parseBody } from '@/lib/validations';
import { requireEmployer } from '@/lib/getCurrentUser';
import { getCompany, updateCompany } from '@/lib/services/company.service';

/**
 * GET /api/companies/[id]
 * Public — returns a single company by slug or id, with recent jobs.
 */
export const GET = withErrorHandler(async (_req, { params }) => {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) return error('Company not found.', 404);
  return ok(company);
});

/**
 * PATCH /api/companies/[id]
 * Protected — Owner or Admin only.
 */
export const PATCH = withErrorHandler(async (req, { params }) => {
  const { id } = await params;
  const user = await requireEmployer();

  const company = await getCompany(id);
  if (!company) return error('Company not found.', 404);

  if (user.accountType !== 'Admin' && company.ownerId !== user.id) {
    return error('You do not own this company.', 403);
  }

  const body = await parseBody(req);
  if (!body) return error('Request body is required.', 400);

  const updated = await updateCompany(company.id, body);
  return ok(updated);
});
