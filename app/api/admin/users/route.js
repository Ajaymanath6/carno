import { ok, withErrorHandler, parsePagination, buildPaginationMeta } from '@/lib/utils';
import { requireAdmin } from '@/lib/getCurrentUser';
import { listUsers } from '@/lib/services/user.service';

/**
 * GET /api/admin/users
 * Admin only — paginated list of all users.
 * Query: page, pageSize, search, accountType
 */
export const GET = withErrorHandler(async (req) => {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const { page, pageSize } = parsePagination(searchParams);

  const { users, total } = await listUsers({
    page,
    pageSize,
    search:      searchParams.get('search')      ?? undefined,
    accountType: searchParams.get('accountType') ?? undefined,
  });

  return ok({ users, meta: buildPaginationMeta({ total, page, pageSize }) });
});
