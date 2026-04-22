'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { timeAgo } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * ChatWindow — real-time conversation component using SSE.
 * @param {{ conversationId: string }} props
 */
export default function ChatWindow({ conversationId }) {
  const { user: clerkUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Fetch existing messages
  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);
    fetch(`/api/chat/messages?conversationId=${conversationId}`)
      .then((r) => r.json())
      .then(({ data }) => {
        setMessages(data?.messages ?? []);
      })
      .catch(() => setError('Failed to load messages.'))
      .finally(() => setLoading(false));
  }, [conversationId]);

  // Connect SSE for real-time updates
  useEffect(() => {
    if (!conversationId) return;

    const es = new EventSource(`/api/chat/socket?conversationId=${conversationId}`);
    eventSourceRef.current = es;

    es.addEventListener('message', (e) => {
      try {
        const newMsg = JSON.parse(e.data);
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } catch {
        // Ignore malformed events
      }
    });

    es.onerror = () => {
      // SSE will auto-reconnect — no need to surface this to the user
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, body }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        setError(msg ?? 'Failed to send.');
        return;
      }

      const { data: newMsg } = await res.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setDraft('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading conversation…" />;

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === clerkUser?.id || msg.sender?.clerkId === clerkUser?.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <p className="mx-4 mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-100 p-4 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
          disabled={sending}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message, isOwn }) {
  if (message.senderType === 'System') {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {message.body}
        </span>
      </div>
    );
  }

  const name = message.sender?.profile
    ? `${message.sender.profile.firstName ?? ''} ${message.sender.profile.lastName ?? ''}`.trim()
    : 'Unknown';

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {message.sender?.profile?.avatarUrl ? (
        <img
          src={message.sender.profile.avatarUrl}
          alt={name}
          className="w-7 h-7 rounded-full shrink-0 mt-1 object-cover"
        />
      ) : (
        <div className="w-7 h-7 rounded-full shrink-0 mt-1 bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700">
          {name[0] ?? '?'}
        </div>
      )}

      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm ${
            isOwn
              ? 'bg-brand-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          }`}
        >
          {message.body}
        </div>
        <span className="text-xs text-gray-400">{timeAgo(message.createdAt)}</span>
      </div>
    </div>
  );
}
