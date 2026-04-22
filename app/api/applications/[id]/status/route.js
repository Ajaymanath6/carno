import { ok, error, withErrorHandler } from '@/lib/utils';
import { parseBody } from '@/lib/validations';
import { requireEmployer } from '@/lib/getCurrentUser';
import { updateApplicationStatus } from '@/lib/services/application.service';
import { sendApplicationStatusEmail } from '@/lib/services/email.service';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = ['Shortlisted', 'Interviewing', 'OfferExtended', 'Hired', 'Rejected'];

/**
 * PATCH /api/applications/[id]/status
 * Protected — Employer (must own the job) or Admin.
 * Body: { status: ApplicationStatus, recruiterNote?: string }
 */
export const PATCH = withErrorHandler(async (req, { params }) => {
  const { id } = await params;
  const user = await requireEmployer();

  const body = await parseBody(req);
  if (!body) return error('Request body is required.', 400);

  const { status, recruiterNote } = body;
  if (!status) return error('status is required.', 400);
  if (!VALID_STATUSES.includes(status)) {
    return error(`Invalid status. Valid values: ${VALID_STATUSES.join(', ')}.`, 400);
  }

  // Verify the employer owns the job this application belongs to
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      job: { select: { companyId: true, title: true } },
      applicant: {
        select: {
          email: true,
          profile: { select: { firstName: true } },
        },
      },
    },
  });

  if (!application) return error('Application not found.', 404);

  if (user.accountType !== 'Admin' && application.job.companyId !== user.ownedCompany?.id) {
    return error('You do not own this job.', 403);
  }

  const updated = await updateApplicationStatus(id, status, recruiterNote);

  // Non-blocking email to applicant
  sendApplicationStatusEmail({
    email:     application.applicant.email,
    firstName: application.applicant.profile?.firstName ?? 'there',
    jobTitle:  application.job.title,
    newStatus: status,
  }).catch(() => {});

  return ok(updated);
});
