/**
 * lib/socket.js — In-process SSE pub/sub for chat/realtime updates
 *
 * This is intentionally NOT Socket.IO. It uses Server-Sent Events (SSE) with
 * an in-process Map of listeners. Works well for a single-server deployment.
 *
 * For multi-instance deployments (e.g. multiple Vercel instances), replace the
 * listener Map with a Redis pub/sub channel and fan out to local SSE streams.
 *
 * Public API:
 *   subscribeToConversation(conversationId, callback)  → unsubscribe function
 *   broadcastNewMessage(conversationId, message)       → void
 *   subscribeToUserNotifications(userId, callback)     → unsubscribe function
 *   broadcastUserNotification(userId, payload)         → void
 */

// Map<conversationId, Set<(message) => void>>
const conversationListeners = new Map();

// Map<userId, Set<(payload) => void>>
const userNotificationListeners = new Map();

// ─── Conversation pub/sub ─────────────────────────────────────────────────────

/**
 * Register a callback to receive new messages for a conversation.
 * Returns an unsubscribe function — call it when the SSE connection closes.
 *
 * @param {string} conversationId
 * @param {(message: object) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToConversation(conversationId, callback) {
  if (!conversationListeners.has(conversationId)) {
    conversationListeners.set(conversationId, new Set());
  }
  conversationListeners.get(conversationId).add(callback);

  return function unsubscribe() {
    const listeners = conversationListeners.get(conversationId);
    if (!listeners) return;
    listeners.delete(callback);
    if (listeners.size === 0) {
      conversationListeners.delete(conversationId);
    }
  };
}

/**
 * Broadcast a new message to all SSE clients listening on a conversation.
 *
 * @param {string} conversationId
 * @param {object} message
 */
export function broadcastNewMessage(conversationId, message) {
  const listeners = conversationListeners.get(conversationId);
  if (!listeners || listeners.size === 0) return;

  for (const callback of listeners) {
    try {
      callback(message);
    } catch (err) {
      console.error('[socket] broadcastNewMessage callback error:', err.message);
    }
  }
}

// ─── User notification pub/sub ────────────────────────────────────────────────

/**
 * Register a callback to receive real-time notifications for a user.
 * Returns an unsubscribe function.
 *
 * @param {string} userId
 * @param {(payload: object) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToUserNotifications(userId, callback) {
  if (!userNotificationListeners.has(userId)) {
    userNotificationListeners.set(userId, new Set());
  }
  userNotificationListeners.get(userId).add(callback);

  return function unsubscribe() {
    const listeners = userNotificationListeners.get(userId);
    if (!listeners) return;
    listeners.delete(callback);
    if (listeners.size === 0) {
      userNotificationListeners.delete(userId);
    }
  };
}

/**
 * Broadcast a notification payload to all SSE connections for a user.
 *
 * @param {string} userId
 * @param {object} payload
 */
export function broadcastUserNotification(userId, payload) {
  const listeners = userNotificationListeners.get(userId);
  if (!listeners || listeners.size === 0) return;

  for (const callback of listeners) {
    try {
      callback(payload);
    } catch (err) {
      console.error('[socket] broadcastUserNotification callback error:', err.message);
    }
  }
}

// ─── SSE response helpers ──────────────────────────────────────────────────────

/**
 * Formats a data object as an SSE event string.
 *
 * @param {object} data
 * @param {string} [event] - Optional named event type
 * @returns {string}
 */
export function formatSSEEvent(data, event) {
  let output = '';
  if (event) output += `event: ${event}\n`;
  output += `data: ${JSON.stringify(data)}\n\n`;
  return output;
}

/**
 * Returns standard SSE response headers.
 * Use with `new Response(stream, { headers: sseHeaders() })`.
 *
 * @returns {Record<string, string>}
 */
export function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  };
}

// ─── Debug helpers ────────────────────────────────────────────────────────────

/** Returns current listener counts (useful for monitoring). */
export function getListenerStats() {
  return {
    conversations: conversationListeners.size,
    users: userNotificationListeners.size,
  };
}
