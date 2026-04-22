import { ok, withErrorHandler, parsePagination, buildPaginationMeta } from '@/lib/utils';
import { requireAdmin } from '@/lib/getCurrentUser';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/jobs
 * Admin only — paginated list of all jobs (active + inactive, approved + pending).
 * Query: page, pageSize, search, isApproved, isActive, companyId
 */
export const GET = withErrorHandler(async (req) => {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const { page, pageSize } = parsePagination(searchParams);

  const search    = searchParams.get('search')    ?? undefined;
  const isApproved = searchParams.get('isApproved');
  const isActive   = searchParams.get('isActive');
  const companyId  = searchParams.get('companyId') ?? undefined;

  const where = {
    ...(search && {
      OR: [
        { title:        { contains: search, mode: 'insensitive' } },
        { description:  { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(isApproved !== null && isApproved !== undefined && { isApproved: isApproved === 'true' }),
    ...(isActive   !== null && isActive   !== undefined && { isActive:   isActive   === 'true' }),
    ...(companyId && { companyId }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company:  { select: { name: true, slug: true } },
        location: { select: { city: true, state: true } },
        _count:   { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * pageSize,
      take:  pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return ok({ jobs, meta: buildPaginationMeta({ total, page, pageSize }) });
});
