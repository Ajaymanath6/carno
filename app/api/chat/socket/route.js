import { getClerkId } from '@/lib/getCurrentUser';
import { subscribeToConversation, formatSSEEvent, sseHeaders } from '@/lib/socket';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chat/socket?conversationId=...
 *
 * Server-Sent Events endpoint for real-time chat updates.
 * The client opens an EventSource connection; the server pushes new messages
 * as they arrive via broadcastNewMessage() in chat.service.js.
 *
 * Connection lifecycle:
 *  1. Client connects with a valid conversationId
 *  2. Server verifies the user is a participant
 *  3. Server subscribes to the in-process pub/sub channel
 *  4. New messages are streamed as SSE "message" events
 *  5. Server sends a keepalive comment every 25 seconds to prevent timeouts
 *  6. When the client disconnects, the listener is removed
 */
export async function GET(req) {
  const clerkId = await getClerkId();
  if (!clerkId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return new Response('conversationId query param is required', { status: 400 });
  }

  // Verify the user is a participant in this conversation
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response('User not found', { status: 401 });

  const isParticipant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  });

  if (!isParticipant) {
    return new Response('Forbidden', { status: 403 });
  }

  // Build a ReadableStream that pushes events to the client
  const stream = new ReadableStream({
    start(controller) {
      // Send an initial "connected" event so the client knows the stream is live
      controller.enqueue(
        new TextEncoder().encode(formatSSEEvent({ connected: true, conversationId }, 'connected'))
      );

      // Subscribe to new messages for this conversation
      const unsubscribe = subscribeToConversation(conversationId, (message) => {
        try {
          controller.enqueue(
            new TextEncoder().encode(formatSSEEvent(message, 'message'))
          );
        } catch {
          // Controller may be closed if client disconnected
        }
      });

      // Keepalive — send a comment every 25 seconds to prevent proxy timeouts
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepaliveInterval);
        }
      }, 25000);

      // Cleanup when the connection closes
      req.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(keepaliveInterval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
