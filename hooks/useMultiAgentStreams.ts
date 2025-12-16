'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: string[];
}

export interface AgentStreamState {
  agentId: string;
  status: 'idle' | 'connecting' | 'streaming' | 'error';
  messages: Message[];
  currentTool: string | null;
  error: string | null;
  sessionId: string | null;
}

export interface AgentStreamActions {
  send: (message: string) => Promise<void>;
  cancel: () => void;
  clear: () => void;
}

interface PendingUpdate {
  agentId: string;
  updater: (prev: AgentStreamState) => AgentStreamState;
}

const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
const MAX_RETRIES = 3;
const BATCH_DELAY_MS = 30;

export default function useMultiAgentStreams(agentIds: string[]) {
  const [streams, setStreams] = useState<Map<string, AgentStreamState>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const retryCountsRef = useRef<Map<string, number>>(new Map());
  const pendingUpdatesRef = useRef<PendingUpdate[]>([]);
  const batchTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize streams for new agent IDs
  useEffect(() => {
    setStreams((prevStreams) => {
      const newStreams = new Map(prevStreams);

      // Add new agents
      for (const agentId of agentIds) {
        if (!newStreams.has(agentId)) {
          newStreams.set(agentId, {
            agentId,
            status: 'idle',
            messages: [],
            currentTool: null,
            error: null,
            sessionId: null,
          });
        }
      }

      // Remove agents no longer in the list
      const agentIdSet = new Set(agentIds);
      for (const agentId of newStreams.keys()) {
        if (!agentIdSet.has(agentId)) {
          // Cancel and cleanup
          const controller = abortControllersRef.current.get(agentId);
          controller?.abort();
          abortControllersRef.current.delete(agentId);
          retryCountsRef.current.delete(agentId);
          newStreams.delete(agentId);
        }
      }

      return newStreams;
    });
  }, [agentIds]);

  // Batch state updates to avoid re-render storms
  const scheduleUpdate = useCallback((agentId: string, updater: (prev: AgentStreamState) => AgentStreamState) => {
    pendingUpdatesRef.current.push({ agentId, updater });

    // Clear existing timeout/animation frame
    if (batchTimeoutRef.current !== null) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Use requestAnimationFrame for smoother updates, with timeout fallback
    animationFrameRef.current = requestAnimationFrame(() => {
      batchTimeoutRef.current = window.setTimeout(() => {
        const updates = pendingUpdatesRef.current;
        pendingUpdatesRef.current = [];

        if (updates.length === 0) return;

        setStreams((prevStreams) => {
          const newStreams = new Map(prevStreams);

          for (const { agentId, updater } of updates) {
            const current = newStreams.get(agentId);
            if (current) {
              newStreams.set(agentId, updater(current));
            }
          }

          return newStreams;
        });

        batchTimeoutRef.current = null;
        animationFrameRef.current = null;
      }, BATCH_DELAY_MS);
    });
  }, []);

  // Send message to a specific agent
  const sendToAgent = useCallback(
    async (agentId: string, message: string) => {
      const currentStream = streams.get(agentId);
      if (!currentStream) {
        console.error(`Agent ${agentId} not found in streams`);
        return;
      }

      if (currentStream.status === 'streaming' || currentStream.status === 'connecting') {
        console.warn(`Agent ${agentId} is already processing a message`);
        return;
      }

      if (!message.trim()) {
        return;
      }

      // Create user message
      const userMessage: Message = {
        id: `user-${agentId}-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      // Update state: add user message and set to connecting
      scheduleUpdate(agentId, (prev) => ({
        ...prev,
        status: 'connecting',
        messages: [...prev.messages, userMessage],
        currentTool: null,
        error: null,
      }));

      // Create new abort controller for this request
      const controller = new AbortController();
      abortControllersRef.current.set(agentId, controller);

      // Build conversation history
      const conversationHistory = currentStream.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const attemptRequest = async (retryCount = 0): Promise<void> => {
        try {
          const response = await fetch(`/api/agents/${agentId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userMessage.content,
              conversationHistory,
              sessionId: currentStream.sessionId,
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response stream');

          const decoder = new TextDecoder();
          let assistantContent = '';
          const toolCalls: string[] = [];

          // Create placeholder assistant message
          const assistantMessage: Message = {
            id: `assistant-${agentId}-${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            toolCalls: [],
          };

          // Update state: add assistant message and set to streaming
          scheduleUpdate(agentId, (prev) => ({
            ...prev,
            status: 'streaming',
            messages: [...prev.messages, assistantMessage],
          }));

          // Reset retry count on successful connection
          retryCountsRef.current.set(agentId, 0);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

            for (const line of lines) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                  case 'session':
                    scheduleUpdate(agentId, (prev) => ({
                      ...prev,
                      sessionId: data.sessionId,
                    }));
                    break;

                  case 'status':
                    // Optional status updates
                    break;

                  case 'tool':
                    toolCalls.push(data.name);
                    scheduleUpdate(agentId, (prev) => ({
                      ...prev,
                      currentTool: data.name,
                      messages: prev.messages.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, toolCalls: [...toolCalls] }
                          : msg
                      ),
                    }));
                    break;

                  case 'text':
                    assistantContent += data.content;
                    scheduleUpdate(agentId, (prev) => ({
                      ...prev,
                      messages: prev.messages.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: assistantContent }
                          : msg
                      ),
                    }));
                    break;

                  case 'done':
                    scheduleUpdate(agentId, (prev) => ({
                      ...prev,
                      status: 'idle',
                      currentTool: null,
                      sessionId: data.sessionId || prev.sessionId,
                    }));
                    break;

                  case 'error':
                    scheduleUpdate(agentId, (prev) => ({
                      ...prev,
                      status: 'error',
                      error: data.message,
                      currentTool: null,
                      messages: prev.messages.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: `Error: ${data.message}` }
                          : msg
                      ),
                    }));
                    break;
                }
              } catch (e) {
                console.error(`[Agent ${agentId}] Failed to parse SSE data:`, e);
              }
            }
          }
        } catch (error) {
          // Handle abort (user cancellation)
          if (error instanceof Error && error.name === 'AbortError') {
            scheduleUpdate(agentId, (prev) => ({
              ...prev,
              status: 'idle',
              currentTool: null,
            }));
            return;
          }

          // Retry logic with exponential backoff
          const currentRetryCount = retryCount;
          if (currentRetryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[currentRetryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            console.warn(
              `[Agent ${agentId}] Request failed, retrying in ${delay}ms (attempt ${currentRetryCount + 1}/${MAX_RETRIES})`
            );

            retryCountsRef.current.set(agentId, currentRetryCount + 1);

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, delay));

            // Retry
            return attemptRequest(currentRetryCount + 1);
          }

          // Max retries exceeded
          console.error(`[Agent ${agentId}] Error after ${MAX_RETRIES} retries:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

          scheduleUpdate(agentId, (prev) => ({
            ...prev,
            status: 'error',
            error: errorMessage,
            currentTool: null,
            messages: [
              ...prev.messages,
              {
                id: `error-${agentId}-${Date.now()}`,
                role: 'assistant',
                content: `Error: ${errorMessage}`,
                timestamp: new Date(),
              },
            ],
          }));
        } finally {
          abortControllersRef.current.delete(agentId);
        }
      };

      // Start the request
      await attemptRequest();
    },
    [streams, scheduleUpdate]
  );

  // Cancel a specific agent's stream
  const cancelAgent = useCallback((agentId: string) => {
    const controller = abortControllersRef.current.get(agentId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(agentId);
    }

    scheduleUpdate(agentId, (prev) => ({
      ...prev,
      status: 'idle',
      currentTool: null,
    }));
  }, [scheduleUpdate]);

  // Build actions map for each agent
  const actions = new Map<string, AgentStreamActions>();
  for (const agentId of agentIds) {
    actions.set(agentId, {
      send: (message: string) => sendToAgent(agentId, message),
      cancel: () => cancelAgent(agentId),
      clear: () => {
        scheduleUpdate(agentId, (prev) => ({
          ...prev,
          messages: [],
          error: null,
          currentTool: null,
        }));
      },
    });
  }

  // Cleanup on unmount
  useEffect(() => {
    // Capture refs at effect creation time to avoid stale closure issues
    const abortControllers = abortControllersRef.current;
    const retryCounts = retryCountsRef.current;
    const batchTimeout = batchTimeoutRef;
    const animationFrame = animationFrameRef;

    return () => {
      // Cancel all ongoing streams
      for (const controller of abortControllers.values()) {
        controller.abort();
      }
      abortControllers.clear();
      retryCounts.clear();

      // Clear pending updates
      if (batchTimeout.current !== null) {
        clearTimeout(batchTimeout.current);
      }
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return {
    streams,
    actions,
    sendToAgent,
    cancelAgent,
  };
}
