import { ok, withErrorHandler, parsePagination, buildPaginationMeta } from '@/lib/utils';
import { requireUser } from '@/lib/getCurrentUser';
import { getPaymentHistory } from '@/lib/services/payment.service';

/**
 * GET /api/payments/history
 * Protected — returns paginated payment history for the current user.
 */
export const GET = withErrorHandler(async (req) => {
  const user = await requireUser({ includeProfile: false });
  const { searchParams } = new URL(req.url);
  const { page, pageSize } = parsePagination(searchParams);

  const { payments, total } = await getPaymentHistory(user.id, { page, pageSize });
  return ok({ payments, meta: buildPaginationMeta({ total, page, pageSize }) });
});
