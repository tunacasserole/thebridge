'use client';

import { useMemo } from 'react';

interface Message {
  content: string;
  role: 'user' | 'assistant';
  toolCalls?: unknown[];
}

interface ConversationTokenCounterProps {
  messages: Message[];
  className?: string;
}

/**
 * Estimates token count for a text string
 * Using a simple approximation: 1 token ≈ 4 characters
 * This is a rough estimate but works well for Claude models
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export default function ConversationTokenCounter({
  messages,
  className = '',
}: ConversationTokenCounterProps) {
  const totalTokens = useMemo(() => {
    return messages.reduce((sum, message) => {
      // Count message content tokens
      const contentTokens = estimateTokens(message.content);

      // Add a small overhead for tool calls (rough estimate)
      const toolTokens = message.toolCalls ? message.toolCalls.length * 10 : 0;

      return sum + contentTokens + toolTokens;
    }, 0);
  }, [messages]);

  // Don't show if there are no messages
  if (messages.length === 0) {
    return null;
  }

  // Format number with commas for readability
  const formattedTokens = totalTokens.toLocaleString();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] ${className}`}
      title="Estimated tokens in this conversation"
    >
      <svg
        className="w-3.5 h-3.5 text-[var(--md-on-surface-variant)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span className="text-xs font-mono text-[var(--md-on-surface-variant)]">
        ~{formattedTokens}
      </span>
      <span className="text-[9px] text-[var(--md-on-surface-variant)] opacity-70">
        tokens
      </span>
    </div>
  );
}
