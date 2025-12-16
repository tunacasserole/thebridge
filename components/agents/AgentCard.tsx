'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AGENT_CONFIGS, type AgentConfig } from '@/lib/agents/configs';
import type { AgentMessage } from '@/types/views';

// Default config for custom agents not found in AGENT_CONFIGS
const DEFAULT_CUSTOM_AGENT_CONFIG: Omit<AgentConfig, 'id' | 'name' | 'systemPrompt'> = {
  description: 'Custom agent',
  model: 'sonnet',
  tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch'],
  mcpServers: [],
  accentColor: '#6366f1', // Indigo
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: string[];
}

interface DragHandleProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

interface AgentCardProps {
  agentId: string;
  position: { row: number; col: number };
  isGeneralAgent: boolean;
  isActive: boolean;
  isFocused: boolean;
  isExpanded: boolean;
  isDragging?: boolean;
  dragHandleProps?: DragHandleProps;
  initialMessages?: AgentMessage[];
  modelOverride?: 'sonnet' | 'opus' | 'haiku'; // Override the agent's default model
  onClose: () => void;
  onFocus: () => void;
  onExpand: () => void;
  onActiveChange: (isActive: boolean) => void;
  onEditPrompt?: () => void;
}

type StatusState = 'idle' | 'thinking' | 'executing' | 'error';

export default function AgentCard({
  agentId,
  position,
  isGeneralAgent,
  isActive,
  isFocused,
  isExpanded,
  isDragging = false,
  dragHandleProps,
  initialMessages = [],
  modelOverride,
  onClose,
  onFocus,
  onExpand,
  onActiveChange,
  onEditPrompt,
}: AgentCardProps) {

  // Convert initial AgentMessage[] to Message[] format
  const convertedInitialMessages = useMemo(() => {
    return initialMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      toolCalls: undefined,
    }));
  }, [initialMessages, agentId]);

  const [messages, setMessages] = useState<Message[]>(convertedInitialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<StatusState>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevLoadingRef = useRef(isLoading);
  const onActiveChangeRef = useRef(onActiveChange);
  const hasInitializedRef = useRef(false);

  // Keep callback ref updated without triggering effects
  onActiveChangeRef.current = onActiveChange;

  // Get agent config, falling back to defaults for custom agents
  const agentConfig = AGENT_CONFIGS[agentId] || {
    ...DEFAULT_CUSTOM_AGENT_CONFIG,
    id: agentId,
    name: agentId.charAt(0).toUpperCase() + agentId.slice(1).replace(/-/g, ' '),
    systemPrompt: '',
  };

  // Track if we need to continue a conversation (last message was from user with no response)
  const needsContinuationRef = useRef(false);

  // Sync messages state when initialMessages is provided (handles the case where
  // the component is mounted before the messages are available in the grid state)
  useEffect(() => {
    // Only sync if we haven't initialized yet and there are messages to load
    if (!hasInitializedRef.current && convertedInitialMessages.length > 0) {
      setMessages(convertedInitialMessages);
      hasInitializedRef.current = true;

      // Check if the last message was from the user - we need to get a response
      const lastMessage = convertedInitialMessages[convertedInitialMessages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        needsContinuationRef.current = true;
      }
    }
  }, [convertedInitialMessages, agentId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when card is focused
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  // Notify parent of loading state changes - use ref to avoid infinite loop
  useEffect(() => {
    if (prevLoadingRef.current !== isLoading) {
      prevLoadingRef.current = isLoading;
      onActiveChangeRef.current(isLoading);
    }
  }, [isLoading]);

  // Update status state based on activity
  useEffect(() => {
    if (isLoading) {
      setStatusState(currentTool ? 'executing' : 'thinking');
    } else {
      setStatusState('idle');
    }
  }, [isLoading, currentTool]);

  // Core function to send a message to the API and handle streaming response
  const sendToApi = useCallback(async (messageContent: string, history: Message[], addUserMessage = true) => {
    if (isLoading) return;

    let currentMessages = history;

    if (addUserMessage) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      currentMessages = [...history, userMessage];
    }

    setInput('');
    setIsLoading(true);
    setCurrentTool(null);

    // Build conversation history for API
    const conversationHistory = currentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory,
          sessionId,
          ...(modelOverride && { model: modelOverride }),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const toolCalls: string[] = [];

      // Create placeholder message for streaming
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        toolCalls: [],
      };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.type) {
              case 'session':
                setSessionId(data.sessionId);
                break;

              case 'text':
                assistantContent += data.content;
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: assistantContent }
                    : msg
                ));
                break;

              case 'tool':
                toolCalls.push(data.name);
                setCurrentTool(data.name);
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? { ...msg, toolCalls: [...toolCalls] }
                    : msg
                ));
                break;

              case 'done':
                setCurrentTool(null);
                // Update session ID if returned
                if (data.sessionId) {
                  setSessionId(data.sessionId);
                }
                break;

              case 'error':
                setStatusState('error');
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: `Error: ${data.message}` }
                    : msg
                ));
                break;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStatusState('error');
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentTool(null);
    }
  }, [isLoading, agentId, sessionId]);

  // Wrapper for sending new user messages
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    sendToApi(input.trim(), messages, true);
  }, [input, messages, sendToApi]);

  // Continue conversation if the last message was from the user (transferred from main chat)
  useEffect(() => {
    if (needsContinuationRef.current && messages.length > 0 && !isLoading) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        needsContinuationRef.current = false;
        // Don't add user message again, just get a response
        sendToApi(lastMessage.content, messages, false);
      }
    }
  }, [messages, isLoading, agentId, sendToApi]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Status dot colors
  const getStatusColor = () => {
    switch (statusState) {
      case 'idle':
        return '#10b981'; // Green
      case 'thinking':
        return '#3b82f6'; // Blue
      case 'executing':
        return '#f59e0b'; // Amber
      case 'error':
        return '#ef4444'; // Red
      default:
        return '#10b981';
    }
  };

  const shouldPulse = statusState === 'thinking' || statusState === 'executing';

  return (
    <div
      data-agent-id={agentId}
      data-position={`${position.row}-${position.col}`}
      data-dragging={isDragging}
      className={`
        flex flex-col bg-[var(--md-surface-container)] rounded-lg shadow-lg overflow-hidden
        border-2 border-[var(--md-outline-variant)]
        transition-all duration-200 ease-out
        h-full
        ${isFocused ? 'ring-2 ring-offset-2' : ''}
        ${isActive ? 'animate-pulse-border' : ''}
        ${isExpanded ? 'col-span-full' : ''}
        ${isDragging ? 'opacity-50 scale-95 cursor-grabbing' : ''}
      `}
      style={{
        borderTopColor: agentConfig.accentColor,
        boxShadow: isFocused
          ? `0 0 20px ${agentConfig.accentColor}40, 0 4px 6px -1px rgb(0 0 0 / 0.1)`
          : undefined,
        // @ts-expect-error CSS custom property
        '--tw-ring-color': agentConfig.accentColor,
      }}
      onClick={onFocus}
    >
      {/* Compact Header - Drag Handle */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 flex-shrink-0 select-none
          ${dragHandleProps ? 'cursor-grab active:cursor-grabbing' : 'cursor-move'}
        `}
        style={{
          background: `linear-gradient(to right, color-mix(in srgb, ${agentConfig.accentColor} 15%, transparent), transparent)`,
        }}
        {...dragHandleProps}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Drag handle indicator */}
          {dragHandleProps && (
            <svg
              className="w-4 h-4 text-[var(--md-on-surface-variant)] opacity-50 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          )}
          {/* Status indicator */}
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
              shouldPulse ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: getStatusColor(),
              boxShadow: shouldPulse
                ? `0 0 8px ${getStatusColor()}`
                : undefined,
            }}
          />
          <span className="text-sm font-medium text-[var(--md-on-surface)] truncate">
            {agentConfig.name}
          </span>
          {/* Current tool badge */}
          {currentTool && (
            <span
              className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 truncate max-w-[100px]"
              style={{
                backgroundColor: `color-mix(in srgb, ${agentConfig.accentColor} 20%, transparent)`,
                color: agentConfig.accentColor,
              }}
              title={currentTool}
            >
              {currentTool}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Edit prompt button */}
          {onEditPrompt && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditPrompt();
              }}
              className="p-1 rounded hover:bg-[var(--md-surface-container-high)] transition-colors"
              title="Edit prompt"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-[var(--md-on-surface-variant)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {/* Expand button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1 rounded hover:bg-[var(--md-surface-container-high)] transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-[var(--md-on-surface-variant)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isExpanded ? (
                <path d="M4 14h6m0 0v6m0-6l-7 7M20 10h-6m0 0V4m0 6l7-7" />
              ) : (
                <path d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
              )}
            </svg>
          </button>
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded hover:bg-[var(--md-error-container)] hover:text-[var(--md-error)] transition-colors"
            title="Close"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--md-on-surface-variant)]">
              {agentConfig.description}
            </p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-2 opacity-60">
              Start a conversation...
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] rounded-lg px-3 py-2 text-sm
                  ${msg.role === 'user'
                    ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                    : 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]'
                  }
                `}
                style={msg.role === 'user' ? { backgroundColor: agentConfig.accentColor } : {}}
              >
                {/* Tool calls indicator */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {msg.toolCalls.map((tool, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
                {/* Message content */}
                <div className="whitespace-pre-wrap break-words">
                  {msg.content || (
                    <span className="opacity-50 italic">Thinking...</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Always-Visible Input Area */}
      <div className="flex-shrink-0 p-2 border-t border-[var(--md-outline-variant)]">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-lg px-3 py-2 text-sm
              bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]
              placeholder:text-[var(--md-on-surface-variant)]
              focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              // @ts-expect-error CSS custom property
              '--tw-ring-color': agentConfig.accentColor,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 rounded-lg text-white font-medium text-sm
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: agentConfig.accentColor }}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
