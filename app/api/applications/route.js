import { ok, created, error, withErrorHandler, parsePagination, buildPaginationMeta } from '@/lib/utils';
import { parseBody, validateApplication } from '@/lib/validations';
import { requireUser, requireEmployer } from '@/lib/getCurrentUser';
import { applyToJob, getApplicationsByApplicant, getApplicationsByJob } from '@/lib/services/application.service';
import { sendApplicationReceivedEmail, sendEmployerNotificationEmail } from '@/lib/services/email.service';
import { getJob } from '@/lib/services/job.service';

/**
 * GET /api/applications
 * Protected.
 * - JobSeeker: returns their own applications.
 * - Employer: requires ?jobId=... to list applications for a specific job.
 * Query: page, pageSize, status, jobId (employer only)
 */
export const GET = withErrorHandler(async (req) => {
  const user = await requireUser({ includeProfile: true, includeCompany: true });
  const { searchParams } = new URL(req.url);
  const { page, pageSize } = parsePagination(searchParams);
  const status = searchParams.get('status') ?? undefined;

  if (user.accountType === 'JobSeeker') {
    const { applications, total } = await getApplicationsByApplicant(user.id, { page, pageSize, status });
    return ok({ applications, meta: buildPaginationMeta({ total, page, pageSize }) });
  }

  // Employer / Admin: must supply jobId
  const jobId = searchParams.get('jobId');
  if (!jobId) return error('jobId query param is required for employers.', 400);

  // Verify the employer owns the job
  if (user.accountType === 'Employer') {
    const job = await getJob(jobId);
    if (!job) return error('Job not found.', 404);
    if (job.companyId !== user.ownedCompany?.id) return error('You do not own this job.', 403);
  }

  const { applications, total } = await getApplicationsByJob(jobId, { page, pageSize, status });
  return ok({ applications, meta: buildPaginationMeta({ total, page, pageSize }) });
});

/**
 * POST /api/applications
 * Protected — JobSeeker only.
 * Body: { jobId, coverLetter?, resumeUrl? }
 */
export const POST = withErrorHandler(async (req) => {
  const user = await requireUser({ includeProfile: true });

  if (user.accountType !== 'JobSeeker') {
    return error('Only job seekers can apply to jobs.', 403);
  }

  const body = await parseBody(req);
  if (!body) return error('Request body is required.', 400);

  const validation = validateApplication(body);
  if (!validation.valid) return error('Validation failed.', 422, { errors: validation.errors });

  const job = await getJob(body.jobId);
  if (!job || !job.isActive) return error('Job not found or no longer active.', 404);

  const application = await applyToJob(user.id, job.id, {
    coverLetter: body.coverLetter,
    resumeUrl:   body.resumeUrl ?? user.profile?.resumeUrl,
  });

  // Non-blocking email notifications
  const firstName = user.profile?.firstName ?? 'there';
  const applicantName = `${user.profile?.firstName ?? ''} ${user.profile?.lastName ?? ''}`.trim();

  sendApplicationReceivedEmail({
    email:       user.email,
    firstName,
    jobTitle:    job.title,
    companyName: job.company.name,
    applicationId: application.id,
  }).catch(() => {});

  sendEmployerNotificationEmail({
    email:           job.company.owner?.email ?? '',
    jobTitle:        job.title,
    applicantName,
    applicationId:   application.id,
  }).catch(() => {});

  return created(application);
});
