import { ok, error, withErrorHandler } from '@/lib/utils';
import { parseBody } from '@/lib/validations';
import { processOnboarding } from '@/lib/services/onboarding.service';

export const POST = withErrorHandler(async (req) => {
  const body = await parseBody(req);

  if (!body) return error('Request body is required.', 400);

  const { accountType, personal, company } = body;

  if (!accountType) return error('accountType is required.', 400);
  if (!personal)    return error('personal details are required.', 400);

  const result = await processOnboarding({ accountType, personal, company });
  return ok(result, 201);
});
