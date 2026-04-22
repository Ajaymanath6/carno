/**
 * chat.service.js — Conversation and messaging business logic
 *
 * Works alongside lib/socket.js which handles the SSE pub/sub layer.
 * This service is responsible for all DB operations.
 */

import { prisma } from '@/lib/prisma';
import { broadcastNewMessage } from '@/lib/socket';

// ─── Conversations ────────────────────────────────────────────────────────────

/**
 * Get all conversations for a user, ordered by most recent message.
 *
 * @param {string} userId
 * @param {{ page?: number, pageSize?: number }} options
 */
export async function getConversationsForUser(userId, { page = 1, pageSize = 20 } = {}) {
  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        isArchived: false,
        participants: { some: { userId } },
      },
      include: {
        application: {
          include: {
            job: {
              select: {
                id: true, title: true, slug: true,
                company: { select: { name: true, logoUrl: true } },
              },
            },
            applicant: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true, senderType: true },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.conversation.count({
      where: {
        isArchived: false,
        participants: { some: { userId } },
      },
    }),
  ]);

  return { conversations, total };
}

/**
 * Get a single conversation by id, verifying the user is a participant.
 *
 * @param {string} conversationId
 * @param {string} userId
 */
export async function getConversation(conversationId, userId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: true,
      application: {
        include: {
          job: { select: { id: true, title: true, slug: true } },
          applicant: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  if (!conversation) throw { status: 404, message: 'Conversation not found.' };

  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) throw { status: 403, message: 'You are not a participant in this conversation.' };

  return conversation;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * Get paginated messages for a conversation.
 * Marks them as read for the given user.
 *
 * @param {string} conversationId
 * @param {string} userId - Reader's id (for read-status update)
 * @param {{ page?: number, pageSize?: number }} options
 */
export async function getMessages(conversationId, userId, { page = 1, pageSize = 50 } = {}) {
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  // Update last-read timestamp for this participant
  await prisma.conversationParticipant
    .update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    })
    .catch(() => {}); // participant row may not exist (employer added post-application)

  return { messages, total };
}

/**
 * Send a message in a conversation.
 * Broadcasts via SSE and updates the conversation's lastMessageAt.
 *
 * @param {{ conversationId: string, senderId: string, body: string }} params
 */
export async function sendMessage({ conversationId, senderId, body }) {
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderType: 'User',
        body:       body.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data:  { lastMessageAt: new Date() },
    }),
  ]);

  // Broadcast to all SSE listeners for this conversation
  broadcastNewMessage(conversationId, message);

  return message;
}

// ─── Ensure employer is a participant ─────────────────────────────────────────

/**
 * Add a user as a participant in a conversation if not already present.
 * Called when an employer first replies to an application.
 *
 * @param {string} conversationId
 * @param {string} userId
 */
export async function ensureParticipant(conversationId, userId) {
  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    update: {},
    create: { conversationId, userId },
  });
}
