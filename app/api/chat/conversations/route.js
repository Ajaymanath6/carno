import { ok, error, withErrorHandler, parsePagination, buildPaginationMeta } from '@/lib/utils';
import { requireUser } from '@/lib/getCurrentUser';
import { getConversationsForUser, ensureParticipant } from '@/lib/services/chat.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chat/conversations
 * Protected — returns paginated conversations for the current user.
 */
export const GET = withErrorHandler(async (req) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const { page, pageSize } = parsePagination(searchParams);

  const { conversations, total } = await getConversationsForUser(user.id, { page, pageSize });
  return ok({ conversations, meta: buildPaginationMeta({ total, page, pageSize }) });
});

/**
 * POST /api/chat/conversations
 * Protected — Employer joining a conversation for an application.
 * Body: { applicationId }
 *
 * The conversation is created automatically when a job seeker applies.
 * This endpoint allows the employer to "join" (be added as a participant)
 * so they can reply.
 */
export const POST = withErrorHandler(async (req) => {
  const user = await requireUser({ includeCompany: true });

  const body = await req.json().catch(() => null);
  if (!body?.applicationId) return error('applicationId is required.', 400);

  // Find the conversation tied to this application
  const conversation = await prisma.conversation.findUnique({
    where: { applicationId: body.applicationId },
    include: { application: { include: { job: { select: { companyId: true } } } } },
  });

  if (!conversation) return error('Conversation not found.', 404);

  // Only the employer who owns the job (or admin) can join
  if (
    user.accountType !== 'Admin' &&
    conversation.application.job.companyId !== user.ownedCompany?.id
  ) {
    return error('Forbidden.', 403);
  }

  await ensureParticipant(conversation.id, user.id);
  return ok({ conversationId: conversation.id });
});
