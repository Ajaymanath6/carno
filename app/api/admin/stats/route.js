import { ok, withErrorHandler } from '@/lib/utils';
import { requireAdmin } from '@/lib/getCurrentUser';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/stats
 * Admin only — returns platform-wide aggregate statistics.
 */
export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const [
    totalUsers,
    totalJobSeekers,
    totalEmployers,
    totalCompanies,
    totalJobs,
    activeJobs,
    totalApplications,
    totalPayments,
    revenueResult,
    recentUsers,
    recentJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { accountType: 'JobSeeker' } }),
    prisma.user.count({ where: { accountType: 'Employer' } }),
    prisma.company.count({ where: { isActive: true } }),
    prisma.job.count(),
    prisma.job.count({ where: { isActive: true, isApproved: true } }),
    prisma.application.count(),
    prisma.payment.count({ where: { status: 'Captured' } }),
    prisma.payment.aggregate({
      where: { status: 'Captured' },
      _sum: { amountPaise: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, email: true, accountType: true, createdAt: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.job.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, title: true, slug: true, createdAt: true,
        company: { select: { name: true } },
        _count: { select: { applications: true } },
      },
    }),
  ]);

  return ok({
    users: {
      total: totalUsers,
      jobSeekers: totalJobSeekers,
      employers: totalEmployers,
    },
    companies:    { total: totalCompanies },
    jobs:         { total: totalJobs, active: activeJobs },
    applications: { total: totalApplications },
    payments: {
      total:        totalPayments,
      revenueINR:   Math.floor((revenueResult._sum.amountPaise ?? 0) / 100),
    },
    recent: { users: recentUsers, jobs: recentJobs },
  });
});
