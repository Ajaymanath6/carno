import { ok, created, error, withErrorHandler, parsePagination, buildPaginationMeta } from '@/lib/utils';
import { parseBody, validateJob, validateJobLocation } from '@/lib/validations';
import { requireUser, requireEmployer } from '@/lib/getCurrentUser';
import { listJobs, createJob } from '@/lib/services/job.service';

/**
 * GET /api/jobs
 * Public endpoint — returns paginated, filterable job listings.
 *
 * Query params:
 *   page, pageSize, q, category, jobType, workMode,
 *   city, pincode, lat, lng, radius, companyId, skills
 */
export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const { page, pageSize, skip: _skip } = parsePagination(searchParams);

  const filters = {
    page,
    pageSize,
    q:          searchParams.get('q') ?? undefined,
    category:   searchParams.get('category') ?? undefined,
    jobType:    searchParams.get('jobType') ?? undefined,
    workMode:   searchParams.get('workMode') ?? undefined,
    city:       searchParams.get('city') ?? undefined,
    pincode:    searchParams.get('pincode') ?? undefined,
    companyId:  searchParams.get('companyId') ?? undefined,
    lat:        searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : undefined,
    lng:        searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : undefined,
    radius:     searchParams.get('radius') ? parseFloat(searchParams.get('radius')) : undefined,
    skills:     searchParams.get('skills') ? searchParams.get('skills').split(',').map((s) => s.trim()) : undefined,
  };

  const { jobs, total } = await listJobs(filters);

  return ok({ jobs, meta: buildPaginationMeta({ total, page, pageSize }) });
});

/**
 * POST /api/jobs
 * Protected — Employer only.
 * Body: { title, description, requirements, responsibilities, category, jobType,
 *         workMode, experienceLevel, skills[], salaryMin, salaryMax,
 *         applicationDeadline, location: { city, state, pincode, locality, lat, lng } }
 */
export const POST = withErrorHandler(async (req) => {
  const user = await requireEmployer();
  if (!user.ownedCompany) return error('You must have a company profile to post jobs.', 403);

  const body = await parseBody(req);
  if (!body) return error('Request body is required.', 400);

  const { location, ...jobData } = body;

  const jobValidation = validateJob(jobData);
  if (!jobValidation.valid) return error('Validation failed.', 422, { errors: jobValidation.errors });

  const locationValidation = validateJobLocation(location ?? {});
  if (!locationValidation.valid) return error('Location validation failed.', 422, { errors: locationValidation.errors });

  const job = await createJob(user.ownedCompany.id, jobData, location);
  return created(job);
});
