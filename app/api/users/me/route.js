import { ok, error, withErrorHandler } from '@/lib/utils';
import { requireUser } from '@/lib/getCurrentUser';

export const GET = withErrorHandler(async () => {
  const user = await requireUser({ includeProfile: true, includeCompany: true });
  return ok(user);
});
