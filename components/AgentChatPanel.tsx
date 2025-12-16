'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AGENT_CONFIGS } from '@/lib/agents/configs';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: string[];
}

interface AgentChatPanelProps {
  agentId: string;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onActiveChange?: (isActive: boolean) => void;
}

export default function AgentChatPanel({
  agentId,
  onClose,
  isMinimized,
  onToggleMinimize,
  onActiveChange,
}: AgentChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const agentConfig = AGENT_CONFIGS[agentId];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens or unminimizes
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // Notify parent of loading state changes
  useEffect(() => {
    onActiveChange?.(isLoading);
  }, [isLoading, onActiveChange]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentTool(null);

    // Build conversation history for API
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          sessionId,
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
  }, [input, isLoading, messages, agentId, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!agentConfig) {
    return null;
  }

  return (
    <div
      className={`
        flex flex-col bg-[var(--md-surface-container)] rounded-lg shadow-lg overflow-hidden
        border border-[var(--md-outline-variant)]
        transition-all duration-200 ease-out
        ${isMinimized ? 'h-12' : 'h-[400px]'}
      `}
      style={{
        borderTopColor: agentConfig.accentColor,
        borderTopWidth: '2px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0 cursor-pointer select-none"
        style={{
          background: `linear-gradient(to right, color-mix(in srgb, ${agentConfig.accentColor} 15%, transparent), transparent)`,
        }}
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              isLoading ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: isLoading ? agentConfig.accentColor : 'var(--md-success)',
              boxShadow: isLoading
                ? `0 0 8px ${agentConfig.accentColor}`
                : undefined,
            }}
          />
          <span className="text-sm font-medium text-[var(--md-on-surface)]">
            {agentConfig.name}
          </span>
          {currentTool && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `color-mix(in srgb, ${agentConfig.accentColor} 20%, transparent)`,
                color: agentConfig.accentColor,
              }}
            >
              {currentTool}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Minimize button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
            className="p-1 rounded hover:bg-[var(--md-surface-container-high)] transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-4 h-4 text-[var(--md-on-surface-variant)] transition-transform ${
                isMinimized ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
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

      {/* Chat content - hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
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

          {/* Input */}
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
        </>
      )}
    </div>
  );
}
