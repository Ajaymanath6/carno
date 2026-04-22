import { ok, error, withErrorHandler } from '@/lib/utils';
import { parseBody } from '@/lib/validations';
import { requireUser, requireEmployer } from '@/lib/getCurrentUser';
import { getJob, updateJob, deleteJob } from '@/lib/services/job.service';

/**
 * GET /api/jobs/[id]
 * Public — returns a single job by slug or id.
 */
export const GET = withErrorHandler(async (_req, { params }) => {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return error('Job not found.', 404);
  return ok(job);
});

/**
 * PATCH /api/jobs/[id]
 * Protected — Employer (must own the job's company) or Admin.
 * Body: partial job fields + optional location object
 */
export const PATCH = withErrorHandler(async (req, { params }) => {
  const { id } = await params;
  const user = await requireEmployer();

  const job = await getJob(id);
  if (!job) return error('Job not found.', 404);

  // Verify ownership — admin can bypass
  if (user.accountType !== 'Admin' && job.company.ownerId !== user.ownedCompany?.ownerId) {
    // Re-check via company relation
    if (job.companyId !== user.ownedCompany?.id) {
      return error('You do not own this job.', 403);
    }
  }

  const body = await parseBody(req);
  if (!body) return error('Request body is required.', 400);

  const { location, ...jobData } = body;
  const updated = await updateJob(job.id, jobData, location);
  return ok(updated);
});

/**
 * DELETE /api/jobs/[id]
 * Protected — Employer (owner) or Admin. Soft-deletes (sets isActive = false).
 */
export const DELETE = withErrorHandler(async (_req, { params }) => {
  const { id } = await params;
  const user = await requireEmployer();

  const job = await getJob(id);
  if (!job) return error('Job not found.', 404);

  if (user.accountType !== 'Admin' && job.companyId !== user.ownedCompany?.id) {
    return error('You do not own this job.', 403);
  }

  await deleteJob(job.id);
  return ok({ message: 'Job deleted.' });
});
