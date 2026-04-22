'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import ChatWindow from '@/components/ChatWindow';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { timeAgo } from '@/lib/utils';

export default function MessagesPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/users/me').then((r) => r.json()),
      fetch('/api/chat/conversations').then((r) => r.json()),
    ])
      .then(([userRes, convRes]) => {
        setUser(userRes.data);
        const convs = convRes.data?.conversations ?? [];
        setConversations(convs);
        if (convs.length > 0) setActiveConvId(convs[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  function getConvTitle(conv) {
    const appTitle = conv.application?.job?.title;
    const company  = conv.application?.job?.company?.name;
    if (appTitle && company) return `${appTitle} at ${company}`;
    if (appTitle) return appTitle;
    return `Conversation #${conv.id.slice(-6)}`;
  }

  function getConvSubtitle(conv) {
    const lastMsg = conv.messages?.[0];
    if (!lastMsg) return 'No messages yet';
    const body = lastMsg.body?.length > 60 ? `${lastMsg.body.slice(0, 57)}…` : lastMsg.body;
    return body ?? '';
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading messages…" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="content-container py-8">
        <div className="flex gap-6">
          <DashboardSidebar accountType={user?.accountType} />

          <main className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>

            {conversations.length === 0 ? (
              <EmptyState
                icon="💬"
                title="No conversations"
                description="When you apply to jobs or employers reach out, conversations will appear here."
              />
            ) : (
              <div className="flex gap-0 h-[calc(100vh-220px)] min-h-[500px] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                {/* Conversation list */}
                <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => setActiveConvId(conv.id)}
                        className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors ${
                          activeConvId === conv.id
                            ? 'bg-brand-50 border-l-2 border-l-brand-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Company logo */}
                        <div className="flex items-start gap-3">
                          {conv.application?.job?.company?.logoUrl ? (
                            <img
                              src={conv.application.job.company.logoUrl}
                              alt=""
                              className="w-8 h-8 rounded-lg object-contain border border-gray-100 shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-gray-400 text-xs font-semibold">
                                {conv.application?.job?.company?.name?.[0] ?? '?'}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {getConvTitle(conv)}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {getConvSubtitle(conv)}
                            </p>
                          </div>
                        </div>
                        {conv.messages?.[0] && (
                          <p className="text-xs text-gray-300 mt-1.5 text-right">
                            {timeAgo(conv.messages[0].createdAt)}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat pane */}
                <div className="flex-1 flex flex-col min-w-0">
                  {activeConvId ? (
                    <>
                      {/* Chat header */}
                      <div className="px-5 py-3.5 border-b border-gray-100 bg-white">
                        <p className="font-semibold text-gray-900 text-sm">
                          {activeConv ? getConvTitle(activeConv) : ''}
                        </p>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <ChatWindow conversationId={activeConvId} />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                      Select a conversation to start chatting
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
