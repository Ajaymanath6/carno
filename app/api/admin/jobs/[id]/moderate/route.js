import { ok, error, withErrorHandler } from '@/lib/utils';
import { parseBody } from '@/lib/validations';
import { requireAdmin } from '@/lib/getCurrentUser';
import { moderateJob } from '@/lib/services/job.service';

/**
 * PATCH /api/admin/jobs/[id]/moderate
 * Admin only — approve, reject, or feature a job listing.
 *
 * Body: {
 *   isApproved?:   boolean,
 *   isFeatured?:   boolean,
 *   featuredUntil?: string (ISO date),
 * }
 */
export const PATCH = withErrorHandler(async (req, { params }) => {
  await requireAdmin();

  const { id } = await params;
  const body = await parseBody(req);
  if (!body) return error('Request body is required.', 400);

  const { isApproved, isFeatured, featuredUntil } = body;

  if (isApproved === undefined && isFeatured === undefined) {
    return error('At least one of isApproved or isFeatured must be provided.', 400);
  }

  const job = await moderateJob(id, {
    isApproved,
    isFeatured,
    featuredUntil: featuredUntil ? new Date(featuredUntil) : undefined,
  });

  return ok(job);
});
