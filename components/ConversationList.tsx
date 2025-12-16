'use client';

import { useState, useEffect } from 'react';

interface ConversationSummary {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationList({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onClose,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations when panel opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else if (response.status === 401) {
        setError('Please sign in to view conversations');
      } else {
        setError('Failed to load conversations');
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentConversationId === id) {
          onNewConversation();
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed left-0 top-0 bottom-0 w-80 bg-[var(--md-surface-container)] border-r border-[var(--md-outline-variant)] z-50 flex flex-col shadow-xl transition-transform"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--md-outline-variant)]">
          <h2 className="text-lg font-semibold text-[var(--md-on-surface)]">
            Conversations
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors"
          >
            <svg
              className="w-5 h-5 text-[var(--md-on-surface-variant)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* New Conversation Button */}
        <div className="px-3 py-2">
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--md-accent)] hover:bg-[var(--md-accent-dark)] text-[var(--md-on-accent)] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="font-medium">New Conversation</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[var(--md-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="px-4 py-3 bg-[var(--md-error-container)] text-[var(--md-on-error-container)] rounded-lg text-sm">
              {error}
            </div>
          )}

          {!isLoading && !error && conversations.length === 0 && (
            <div className="text-center py-8 text-[var(--md-on-surface-variant)]">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          )}

          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
                className={`
                  group relative px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                  ${
                    currentConversationId === conv.id
                      ? 'bg-[var(--md-accent)]/10 text-[var(--md-accent)]'
                      : 'hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-[var(--md-on-surface-variant)] truncate mt-0.5">
                      {conv.preview || 'No messages'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-[var(--md-on-surface-variant)]">
                      {formatDate(conv.updatedAt)}
                    </span>
                    <span className="text-[10px] text-[var(--md-on-surface-variant)] bg-[var(--md-surface-container-high)] px-1.5 py-0.5 rounded">
                      {conv.messageCount} msg{conv.messageCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(conv.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[var(--md-error-container)] transition-all"
                  title="Delete conversation"
                >
                  <svg
                    className="w-4 h-4 text-[var(--md-error)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
