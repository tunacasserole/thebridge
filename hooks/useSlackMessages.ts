// React Hook for Slack Channel Messages

import { useState, useEffect, useCallback } from 'react';
import type { SlackMessage, SlackUser } from '@/lib/slack';

interface EnrichedSlackMessage extends SlackMessage {
  userInfo?: SlackUser;
}

interface UseSlackMessagesResult {
  messages: EnrichedSlackMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSlackMessages(channelId: string | null): UseSlackMessagesResult {
  const [messages, setMessages] = useState<EnrichedSlackMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!channelId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/slack/messages?channel=${encodeURIComponent(channelId)}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch messages');
      }

      setMessages(result.messages || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Slack messages fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  // Fetch when channel changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
  };
}
