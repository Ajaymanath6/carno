import { ok, error, withErrorHandler } from '@/lib/utils';
import { parseBody } from '@/lib/validations';
import { requireUser } from '@/lib/getCurrentUser';
import { updateProfile } from '@/lib/services/user.service';

export const PATCH = withErrorHandler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req);

  if (!body) return error('Request body is required.', 400);

  const profile = await updateProfile(user.id, body);
  return ok(profile);
});
