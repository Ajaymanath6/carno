import { ok, created, error, withErrorHandler, parsePagination, buildPaginationMeta } from '@/lib/utils';
import { parseBody, validateMessage } from '@/lib/validations';
import { requireUser } from '@/lib/getCurrentUser';
import { getMessages, sendMessage, getConversation } from '@/lib/services/chat.service';

/**
 * GET /api/chat/messages?conversationId=...
 * Protected — returns paginated messages for a conversation.
 * User must be a participant.
 */
export const GET = withErrorHandler(async (req) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) return error('conversationId is required.', 400);

  // Verifies participation and throws 403 if not a member
  await getConversation(conversationId, user.id);

  const { page, pageSize } = parsePagination(searchParams);
  const { messages, total } = await getMessages(conversationId, user.id, { page, pageSize });

  return ok({ messages, meta: buildPaginationMeta({ total, page, pageSize }) });
});

/**
 * POST /api/chat/messages
 * Protected — send a message to a conversation.
 * User must be a participant.
 * Body: { conversationId, body }
 */
export const POST = withErrorHandler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req);

  if (!body) return error('Request body is required.', 400);

  const validation = validateMessage(body);
  if (!validation.valid) return error('Validation failed.', 422, { errors: validation.errors });

  // Verify the user is a participant before sending
  await getConversation(body.conversationId, user.id);

  const message = await sendMessage({
    conversationId: body.conversationId,
    senderId:       user.id,
    body:           body.body,
  });

  return created(message);
});
