import { prisma } from '@/lib/prisma';
import { broadcastUserNotification } from '@/lib/socket';

const APPLICATION_INCLUDE = {
  job: {
    include: {
      company: { select: { id: true, name: true, slug: true, logoUrl: true } },
      location: true,
    },
  },
  applicant: {
    select: {
      id: true, email: true,
      profile: { select: { firstName: true, lastName: true, avatarUrl: true, resumeUrl: true } },
    },
  },
};

// ─── Submit ────────────────────────────────────────────────────────────────────

/**
 * Submit a job application.
 * Throws if the user has already applied to this job.
 *
 * @param {string} applicantId
 * @param {string} jobId
 * @param {{ coverLetter?: string, resumeUrl?: string }} data
 */
export async function applyToJob(applicantId, jobId, data = {}) {
  const existing = await prisma.application.findUnique({
    where: { jobId_applicantId: { jobId, applicantId } },
  });

  if (existing) {
    throw { status: 409, message: 'You have already applied to this job.' };
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      applicantId,
      coverLetter: data.coverLetter,
      resumeUrl:   data.resumeUrl,
      status:      'Applied',
    },
    include: APPLICATION_INCLUDE,
  });

  // Bootstrap a conversation thread for this application
  await prisma.conversation.create({
    data: {
      applicationId: application.id,
      subject: `Application: ${application.job.title}`,
      lastMessageAt: new Date(),
      participants: {
        create: [{ userId: applicantId }],
      },
    },
  });

  return application;
}

// ─── List ──────────────────────────────────────────────────────────────────────

/**
 * Get all applications submitted by a job seeker.
 */
export async function getApplicationsByApplicant(applicantId, { page = 1, pageSize = 20, status } = {}) {
  const where = {
    applicantId,
    ...(status && { status }),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: APPLICATION_INCLUDE,
      orderBy: { appliedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.application.count({ where }),
  ]);

  return { applications, total };
}

/**
 * Get all applications for a specific job (employer view).
 */
export async function getApplicationsByJob(jobId, { page = 1, pageSize = 20, status } = {}) {
  const where = {
    jobId,
    ...(status && { status }),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: APPLICATION_INCLUDE,
      orderBy: { appliedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.application.count({ where }),
  ]);

  return { applications, total };
}

// ─── Status update ────────────────────────────────────────────────────────────

/**
 * Update the status of an application (employer action).
 * Broadcasts a notification to the applicant via SSE.
 *
 * @param {string} applicationId
 * @param {string} newStatus
 * @param {string} [recruiterNote]
 */
export async function updateApplicationStatus(applicationId, newStatus, recruiterNote) {
  const application = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: newStatus,
      ...(recruiterNote !== undefined && { recruiterNote }),
    },
    include: APPLICATION_INCLUDE,
  });

  // Notify the applicant in real-time
  broadcastUserNotification(application.applicantId, {
    type: 'APPLICATION_STATUS_UPDATE',
    applicationId: application.id,
    jobTitle: application.job.title,
    newStatus,
  });

  return application;
}

// ─── Withdraw ─────────────────────────────────────────────────────────────────

/**
 * Withdraw an application (applicant action).
 */
export async function withdrawApplication(applicationId, applicantId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) throw { status: 404, message: 'Application not found.' };
  if (application.applicantId !== applicantId) throw { status: 403, message: 'Forbidden.' };
  if (application.status === 'Withdrawn') throw { status: 409, message: 'Already withdrawn.' };

  return prisma.application.update({
    where: { id: applicationId },
    data: { status: 'Withdrawn' },
  });
}
