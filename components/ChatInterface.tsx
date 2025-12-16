'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import TokenBudgetDisplay from './TokenBudgetDisplay';
import QueryOptimizer from './QueryOptimizer';
import ResponseModeSelector, { useResponseMode, type ResponseMode } from './ResponseModeSelector';
import TokenUsageFeedback from './TokenUsageFeedback';

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
  preview?: string; // For image previews
}

interface ToolCall {
  name: string;
  input?: Record<string, unknown>;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  total: number;
  cacheHits?: number;
  cacheCreated?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  files?: FileAttachment[];
  tokenUsage?: TokenUsage;
}

interface ChatInterfaceProps {
  enabledTools?: string[];
  onToggleTools?: () => void;
  toolsOpen?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  conversationId?: string | null;
  onConversationCreated?: (id: string) => void;
}

export interface ChatInterfaceHandle {
  setInput: (value: string) => void;
  focusInput: () => void;
  getMessages: () => Message[];
  clearMessages: () => void;
  startNewConversation: () => void;
  getCurrentConversationId: () => string | null;
}

// Export Message type for use by other components
export type { Message };

// localStorage key for input history
const INPUT_HISTORY_KEY = 'thebridge-input-history';
const MAX_HISTORY_SIZE = 50;

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(function ChatInterface({ enabledTools = [], onToggleTools, toolsOpen, onLoadingChange, conversationId, onConversationCreated }, ref) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const [isLoadingInternal, setIsLoadingInternal] = useState(false);
  // Input history for up-arrow navigation
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedCurrentInput, setSavedCurrentInput] = useState('');

  // Token tracking
  const [sessionTokens, setSessionTokens] = useState(0);
  const TOKEN_LIMIT = 200000; // 200K token budget

  // Response mode
  const [responseMode, setResponseMode] = useResponseMode();

  // Query optimization
  const [showQueryOptimizer, setShowQueryOptimizer] = useState(false);

  // Wrapper to notify parent of loading state changes
  const setIsLoading = (loading: boolean) => {
    setIsLoadingInternal(loading);
    onLoadingChange?.(loading);
  };
  const [error, setError] = useState<string | null>(null);
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCall[]>([]);
  const [extendedThinking, setExtendedThinking] = useState(false);
  const [effort, setEffort] = useState<'high' | 'medium' | 'low'>('high');
  const [verbose, setVerbose] = useState(false);
  const [model, setModel] = useState<'sonnet' | 'opus' | 'haiku'>('sonnet');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    setInput: (value: string) => {
      setInput(value);
      // Focus the input after setting value
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    focusInput: () => {
      inputRef.current?.focus();
    },
    getMessages: () => messages,
    clearMessages: () => setMessages([]),
    startNewConversation: () => {
      setCurrentConversationId(null);
      setMessages([]);
    },
    getCurrentConversationId: () => currentConversationId,
  }), [messages, currentConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingToolCalls]);

  // Load input history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(INPUT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setInputHistory(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load input history:', error);
    }
  }, []);

  // Save input to history
  const saveToHistory = (text: string) => {
    if (!text.trim()) return;

    setInputHistory((prev) => {
      // Don't add duplicates at the top
      const filtered = prev.filter((item) => item !== text);
      const updated = [text, ...filtered].slice(0, MAX_HISTORY_SIZE);

      // Save to localStorage
      try {
        localStorage.setItem(INPUT_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save input history:', error);
      }

      return updated;
    });

    // Reset history navigation
    setHistoryIndex(-1);
    setSavedCurrentInput('');
  };

  // Navigate through input history
  const navigateHistory = (direction: 'up' | 'down') => {
    if (inputHistory.length === 0) return;

    if (direction === 'up') {
      if (historyIndex === -1) {
        // Save current input before navigating
        setSavedCurrentInput(input);
        setHistoryIndex(0);
        setInput(inputHistory[0]);
      } else if (historyIndex < inputHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(inputHistory[newIndex]);
      }
    } else {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(inputHistory[newIndex]);
      } else if (historyIndex === 0) {
        // Return to saved current input
        setHistoryIndex(-1);
        setInput(savedCurrentInput);
      }
    }
  };

  // Load conversation when conversationId prop changes
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
      loadConversation(conversationId);
    } else if (!conversationId && currentConversationId) {
      // Reset when conversationId becomes null (new chat)
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [conversationId]);

  // Load conversation messages from database
  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}`);
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = data.messages.map((msg: { id: string; role: 'user' | 'assistant'; content: string; createdAt: string; toolsUsed?: string }) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          toolCalls: msg.toolsUsed ? JSON.parse(msg.toolsUsed).map((name: string) => ({ name })) : undefined,
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // Create a new conversation
  const createConversation = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentConversationId(data.id);
        onConversationCreated?.(data.id);
        return data.id;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
    return null;
  };

  // Close model menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cancel request on Escape key
  const cancelRequest = () => {
    if (abortControllerRef.current && isLoadingInternal) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setStreamingToolCalls([]);
      // Add a message indicating the request was cancelled
      const cancelledMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '*Request cancelled by user*',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, cancelledMessage]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isLoadingInternal) {
        event.preventDefault();
        cancelRequest();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoadingInternal]);

  const modelDisplayNames = {
    sonnet: 'Sonnet 4',
    opus: 'Opus 4',
    haiku: 'Haiku 3.5',
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 500 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 500MB limit`);
        continue;
      }

      try {
        const base64Data = await fileToBase64(file);
        const attachment: FileAttachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data,
        };

        if (file.type.startsWith('image/')) {
          attachment.preview = `data:${file.type};base64,${base64Data}`;
        }

        newFiles.push(attachment);
      } catch (err) {
        console.error('Error processing file:', err);
        setError(`Failed to process file: ${file.name}`);
      }
    }

    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoadingInternal) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || '(files attached)',
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    // Save to input history before clearing
    saveToHistory(input.trim());

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);
    setError(null);
    setStreamingToolCalls([]);

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Create conversation on first message if we don't have one
      let activeConversationId = currentConversationId;
      if (!activeConversationId && messages.length === 0) {
        activeConversationId = await createConversation();
      }

      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        files: msg.files,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          enabledTools,
          extendedThinking,
          effort,
          model,
          verbose,
          files: userMessage.files,
          conversationId: activeConversationId,
          responseProfile: responseMode,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        const responseText = data.fallbackResponse || data.error || 'Something went wrong';
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setError(data.details || null);
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      const collectedToolCalls: ToolCall[] = [];
      let finalContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'tool') {
                const toolCall: ToolCall = { name: data.name };
                if (data.input) {
                  toolCall.input = data.input;
                }
                collectedToolCalls.push(toolCall);
                setStreamingToolCalls([...collectedToolCalls]);
              } else if (data.type === 'text') {
                finalContent = data.content;
              } else if (data.type === 'done') {
                // Use tool calls from API (now includes input), fall back to collected if not present
                // API now always sends full tool call objects with input
                const finalToolCalls: ToolCall[] = data.toolCalls
                  ? data.toolCalls.map((tc: string | ToolCall) =>
                      typeof tc === 'string' ? { name: tc } : { name: tc.name, input: tc.input }
                    )
                  : collectedToolCalls;

                // Track token usage
                if (data.tokenUsage) {
                  setSessionTokens((prev) => prev + data.tokenUsage.total);
                }

                const assistantMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: data.response || finalContent,
                  timestamp: new Date(),
                  toolCalls: finalToolCalls,
                  tokenUsage: data.tokenUsage,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingToolCalls([]);
              } else if (data.type === 'error') {
                setError(data.message);
              }
            } catch (parseError) {
              console.error('Parse error:', parseError);
            }
          }
        }
      }
    } catch (err) {
      // Don't show error for user-initiated cancellation
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request cancelled by user');
        return;
      }
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting. Please check that the server is running and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      setStreamingToolCalls([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'ArrowUp' && !e.shiftKey) {
      // Only navigate history if cursor is at the start or input is empty
      const textarea = e.currentTarget;
      if (textarea.selectionStart === 0 || input === '') {
        e.preventDefault();
        navigateHistory('up');
      }
    } else if (e.key === 'ArrowDown' && !e.shiftKey) {
      // Only navigate history if cursor is at the end or input is empty
      const textarea = e.currentTarget;
      if (textarea.selectionStart === input.length || input === '') {
        e.preventDefault();
        navigateHistory('down');
      }
    }
  };

  // Auto-resize textarea as content grows
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 200; // Maximum height before scrolling
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const hasMessages = messages.length > 0;

  // Format tool name to show MCP server and tool name
  const formatToolName = (name: string): { server: string | null; tool: string } => {
    // Pattern: mcp__servername__toolname
    const mcpMatch = name.match(/^mcp__([^_]+)__(.+)$/);
    if (mcpMatch) {
      return { server: mcpMatch[1], tool: mcpMatch[2] };
    }
    // Not an MCP tool, just return the name
    return { server: null, tool: name };
  };

  const inputFormJSX = (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        {/* File attachments preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="relative group bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] rounded-lg p-2 pr-8 flex items-center gap-2 max-w-xs transition-colors duration-200"
              >
                {file.preview && (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                {!file.preview && (
                  <div className="w-10 h-10 bg-[var(--md-surface-container-high)] rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--md-on-surface)] truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-[var(--md-on-surface-variant)]">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--md-surface-container-high)] hover:bg-[var(--md-surface-container-highest)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <svg className="w-3 h-3 text-[var(--md-on-surface)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input container with drag and drop */}
        <div
          className="relative"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 bg-[var(--md-accent)]/10 border-2 border-[var(--md-accent)] border-dashed rounded-2xl flex items-center justify-center pointer-events-none">
              <div className="text-sm font-medium text-[var(--md-accent)]">
                Drop files here
              </div>
            </div>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            rows={1}
            className="w-full min-h-[56px] max-h-[200px] pl-5 pr-40 py-4 rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] text-base text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)]/50 focus-visible:border-[var(--md-accent)] transition-colors duration-200 resize-none overflow-y-auto"
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoadingInternal}
              className="w-10 h-10 rounded-xl bg-[var(--md-surface-container-high)] hover:bg-[var(--md-surface-container-highest)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
              title="Attach files"
            >
              <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <button
              type="submit"
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoadingInternal}
              className="w-10 h-10 rounded-xl bg-[var(--md-accent)] hover:bg-[var(--md-accent-dark)] disabled:bg-[var(--md-surface-container-high)] disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 text-[var(--md-on-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
          </div>
        </div>
      </form>

      {/* Query Optimizer */}
      {showQueryOptimizer && input.length > 10 && (
        <div className="mt-2">
          <QueryOptimizer
            query={input}
            onApplySuggestion={(optimized) => {
              setInput(optimized);
              setShowQueryOptimizer(false);
            }}
          />
        </div>
      )}

      {/* Tools, Model, Extended Thinking, and Effort Toggles */}
      <div className="mt-2 flex justify-center items-center gap-4 flex-wrap">
        {onToggleTools && (
          <>
            <button
              type="button"
              onClick={onToggleTools}
              className={`text-xs transition-colors duration-200 ${
                toolsOpen
                  ? 'text-[var(--md-accent)] hover:text-[var(--md-accent-dark)]'
                  : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
              }`}
            >
              {toolsOpen ? '✓ Tools' : 'Tools'}
            </button>
            <span className="text-[var(--md-outline-variant)]">|</span>
          </>
        )}
        <ResponseModeSelector value={responseMode} onChange={setResponseMode} />
        <span className="text-[var(--md-outline-variant)]">|</span>
        <div className="relative" ref={modelMenuRef}>
          <button
            type="button"
            onClick={() => setShowModelMenu(!showModelMenu)}
            className={`text-xs transition-colors duration-200 ${
              model !== 'sonnet'
                ? 'text-[var(--md-accent)] hover:text-[var(--md-accent-dark)]'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`}
          >
            {modelDisplayNames[model]}
          </button>
          {showModelMenu && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] rounded-lg shadow-lg py-1 min-w-[120px] z-50 backdrop-blur-sm">
              {(['sonnet', 'opus', 'haiku'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setModel(m);
                    setShowModelMenu(false);
                  }}
                  className={`w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--md-surface-container-high)] transition-colors duration-200 ${
                    model === m ? 'text-[var(--md-accent)]' : 'text-[var(--md-on-surface)]'
                  }`}
                >
                  {modelDisplayNames[m]}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-[var(--md-outline-variant)]">|</span>
        <button
          type="button"
          onClick={() => setExtendedThinking(!extendedThinking)}
          className={`text-xs transition-colors duration-200 ${
            extendedThinking
              ? 'text-[var(--md-accent)] hover:text-[var(--md-accent-dark)]'
              : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
          }`}
        >
          {extendedThinking ? '✓ Extended Thinking' : 'Extended Thinking'}
        </button>
        <span className="text-[var(--md-outline-variant)]">|</span>
        <button
          type="button"
          onClick={() => {
            const levels: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
            const currentIndex = levels.indexOf(effort);
            const nextIndex = (currentIndex + 1) % levels.length;
            setEffort(levels[nextIndex]);
          }}
          className={`text-xs transition-colors duration-200 ${
            effort !== 'high'
              ? 'text-[var(--md-accent)] hover:text-[var(--md-accent-dark)]'
              : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
          }`}
        >
          Effort: {effort}
        </button>
        <span className="text-[var(--md-outline-variant)]">|</span>
        <button
          type="button"
          onClick={() => setVerbose(!verbose)}
          className={`text-xs transition-colors duration-200 ${
            verbose
              ? 'text-[var(--md-accent)] hover:text-[var(--md-accent-dark)]'
              : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
          }`}
          title="Show detailed tool inputs and outputs"
        >
          {verbose ? '✓ Verbose' : 'Verbose'}
        </button>
        <span className="text-[var(--md-outline-variant)]">|</span>
        <button
          type="button"
          onClick={() => setShowQueryOptimizer(!showQueryOptimizer)}
          className={`text-xs transition-colors duration-200 ${
            showQueryOptimizer
              ? 'text-[var(--md-accent)] hover:text-[var(--md-accent-dark)]'
              : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
          }`}
          title="Show query optimization hints"
        >
          {showQueryOptimizer ? '✓ Optimize' : 'Optimize'}
        </button>
      </div>

      {/* Token Budget Display */}
      {sessionTokens > 0 && (
        <div className="mt-2 flex justify-center">
          <TokenBudgetDisplay tokensUsed={sessionTokens} tokenLimit={TOKEN_LIMIT} />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Empty State */}
      {!hasMessages && (
        <div className="flex flex-col flex-1 min-h-0 justify-center items-center px-4">
          {/* Centered content container */}
          <div className="w-full max-w-2xl flex flex-col items-center">
            {/* Greeting - positioned above input with spacing */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3">
                <span className="text-[#fbbf24] text-4xl">✺</span>
                <h2 className="text-4xl font-serif text-[var(--md-on-surface)]">
                  AA-Ron returns!
                </h2>
              </div>
            </div>

            {error && (
              <div className="py-2 mb-4 w-full bg-[var(--md-warning-container)] border border-[var(--md-warning)] rounded-lg">
                <p className="text-xs text-[var(--md-on-warning-container)] px-4">
                  {error}
                </p>
              </div>
            )}

            {/* Input form */}
            <div className="w-full">
              {inputFormJSX}
            </div>
          </div>
        </div>
      )}

      {/* Messages State */}
      {hasMessages && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Scrollable messages area */}
          <div className="flex-1 overflow-y-auto px-4 pt-6 min-h-0">
            {error && (
              <div className="py-2 mb-4 bg-[var(--md-warning-container)] border border-[var(--md-warning)] rounded-lg">
                <p className="text-xs text-[var(--md-on-warning-container)] px-4">
                  {error}
                </p>
              </div>
            )}

            <div className="w-full space-y-4 pb-4 max-w-2xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 transition-colors duration-200 ${
                      message.role === 'user'
                        ? 'max-w-[80%] bg-[var(--md-accent)] text-[var(--md-on-accent)]'
                        : 'w-full bg-[var(--md-surface-container)] text-[var(--md-on-surface)]'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--md-accent)] to-[var(--md-error)] flex items-center justify-center">
                          <span className="text-[10px] text-[var(--md-on-accent)] font-bold">B</span>
                        </div>
                        <span className="text-xs font-medium text-[var(--md-on-surface-variant)]">
                          TheBridge
                        </span>
                      </div>
                    )}

                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <details className="mb-3 group" open={verbose}>
                        <summary className="cursor-pointer text-xs text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] flex items-center gap-1.5 transition-colors duration-200">
                          <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                          <span className="font-medium">{message.toolCalls.length} tool{message.toolCalls.length > 1 ? 's' : ''} used</span>
                        </summary>
                        <div className={`mt-2 pl-4 ${verbose ? 'space-y-2' : 'flex flex-wrap gap-1.5'}`}>
                          {message.toolCalls.map((toolCall, idx) => {
                            const { server, tool } = formatToolName(toolCall.name);

                            if (verbose && toolCall.input) {
                              // Verbose mode: show tool name and input
                              return (
                                <div
                                  key={idx}
                                  className="rounded-lg bg-[var(--md-surface-container-high)] overflow-hidden"
                                >
                                  <div className="px-3 py-1.5 bg-[var(--md-surface-container-highest)] border-b border-[var(--md-outline-variant)] flex items-center gap-1.5">
                                    {server && (
                                      <span className="text-[10px] font-mono text-[var(--md-accent)]">
                                        {server}
                                      </span>
                                    )}
                                    {server && <span className="text-[10px] text-[var(--md-outline)]">/</span>}
                                    <span className="text-[10px] font-mono font-medium text-[var(--md-on-surface)]">
                                      {tool}
                                    </span>
                                  </div>
                                  <pre className="px-3 py-2 text-xs font-mono text-[var(--md-on-surface-variant)] overflow-x-auto max-h-72 overflow-y-auto whitespace-pre-wrap break-all">
                                    {JSON.stringify(toolCall.input, null, 2)}
                                  </pre>
                                </div>
                              );
                            }

                            // Compact mode: show server and tool name
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono bg-[var(--md-surface-container-high)]"
                              >
                                {server && (
                                  <span className="text-[var(--md-accent)]">{server}</span>
                                )}
                                {server && <span className="text-[var(--md-outline)]">/</span>}
                                <span className="text-[var(--md-on-surface-variant)]">{tool}</span>
                              </span>
                            );
                          })}
                        </div>
                      </details>
                    )}

                    {message.files && message.files.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {message.files.map((file, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-[var(--md-accent-dark)]/20'
                                : 'bg-[var(--md-surface-container-high)]'
                            }`}
                          >
                            {file.preview ? (
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded flex items-center justify-center ${
                                message.role === 'user'
                                  ? 'bg-[var(--md-accent-dark)]/30'
                                  : 'bg-[var(--md-surface-container-highest)]'
                              }`}>
                                <svg className={`w-6 h-6 ${message.role === 'user' ? 'text-[var(--md-on-accent)]' : 'text-[var(--md-on-surface-variant)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className={`text-xs font-medium truncate max-w-[120px] ${
                                message.role === 'user' ? 'text-[var(--md-on-accent)]' : 'text-[var(--md-on-surface)]'
                              }`}>
                                {file.name}
                              </div>
                              <div className={`text-xs ${
                                message.role === 'user' ? 'text-[var(--md-on-accent)]/70' : 'text-[var(--md-on-surface-variant)]'
                              }`}>
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none
                      prose-p:my-2 prose-p:leading-relaxed prose-p:text-[var(--md-on-surface)]
                      prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-[var(--md-on-surface)]
                      prose-h1:text-lg prose-h1:border-b prose-h1:border-[var(--md-outline-variant)] prose-h1:pb-2
                      prose-h2:text-base prose-h2:mt-4
                      prose-h3:text-sm prose-h3:mt-3
                      prose-ul:my-2 prose-ul:space-y-1 prose-ul:pl-0
                      prose-ol:my-2 prose-ol:space-y-1 prose-ol:pl-0
                      prose-li:my-0.5 prose-li:leading-relaxed prose-li:marker:text-[var(--md-accent)]
                      prose-strong:text-[var(--md-on-surface)] prose-strong:font-semibold
                      prose-em:text-[var(--md-on-surface-variant)]
                      prose-code:bg-[var(--md-surface-container-high)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-[var(--md-surface-container-highest)] prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-3
                      prose-table:text-xs prose-table:border-collapse prose-table:my-3
                      prose-th:bg-[var(--md-surface-container)] prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium prose-th:border prose-th:border-[var(--md-outline-variant)]
                      prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-[var(--md-outline-variant)]
                      prose-hr:my-4 prose-hr:border-[var(--md-outline-variant)]
                      prose-blockquote:border-l-2 prose-blockquote:border-[var(--md-accent)] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[var(--md-on-surface-variant)]
                      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                    ">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>

                    {/* Token Usage Feedback for Assistant Messages */}
                    {message.role === 'assistant' && message.tokenUsage && (
                      <div className="mt-3">
                        <TokenUsageFeedback
                          usage={message.tokenUsage}
                          onOptimizeClick={() => setShowQueryOptimizer(true)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoadingInternal && (
                <div className="flex justify-start">
                  <div className="w-full bg-[var(--md-surface-container)] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--md-accent)] to-[var(--md-error)] flex items-center justify-center">
                        <span className="text-[10px] text-[var(--md-on-accent)] font-bold">B</span>
                      </div>
                      <span className="text-xs font-medium text-[var(--md-on-surface-variant)]">
                        TheBridge
                      </span>
                      <div className="flex gap-1 ml-auto items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--md-accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--md-accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--md-accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
                        <button
                          onClick={cancelRequest}
                          className="ml-2 p-1 rounded-md hover:bg-[var(--md-surface-container-high)] transition-colors duration-200 group"
                          title="Cancel request (Esc)"
                        >
                          <svg className="w-4 h-4 text-[var(--md-on-surface-variant)] group-hover:text-[var(--md-error)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {streamingToolCalls.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs text-[var(--md-on-surface-variant)] font-medium">
                          Executing tools ({streamingToolCalls.length})
                        </div>
                        <div className={`flex flex-col gap-2 ${verbose ? 'max-h-[500px]' : 'max-h-48'} overflow-y-auto`}>
                          {streamingToolCalls.map((toolCall, idx) => {
                            const { server, tool } = formatToolName(toolCall.name);
                            const isLatest = idx === streamingToolCalls.length - 1;

                            if (verbose && toolCall.input) {
                              // Verbose streaming: show tool with input
                              return (
                                <div
                                  key={idx}
                                  className="rounded-lg bg-[var(--md-surface-container-high)] overflow-hidden"
                                >
                                  <div className={`px-2 py-1 flex items-center gap-1.5 ${
                                    isLatest
                                      ? 'bg-[var(--md-success)]/10'
                                      : 'bg-[var(--md-surface-container-highest)]'
                                  }`}>
                                    {isLatest ? (
                                      <svg className="w-3 h-3 animate-spin flex-shrink-0 text-[var(--md-success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                        <path d="M12 2a10 10 0 0 1 10 10" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3 h-3 flex-shrink-0 text-[var(--md-success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                    {server && (
                                      <span className={`text-[10px] font-mono ${
                                        isLatest ? 'text-[var(--md-accent)]' : 'text-[var(--md-accent)]'
                                      }`}>
                                        {server}
                                      </span>
                                    )}
                                    {server && <span className="text-[10px] text-[var(--md-outline)]">/</span>}
                                    <span className={`text-[10px] font-mono font-medium ${
                                      isLatest ? 'text-[var(--md-success)]' : 'text-[var(--md-on-surface)]'
                                    }`}>
                                      {tool}
                                    </span>
                                  </div>
                                  <pre className="px-3 py-2 text-xs font-mono text-[var(--md-on-surface-variant)] overflow-x-auto max-h-72 overflow-y-auto whitespace-pre-wrap break-all">
                                    {JSON.stringify(toolCall.input, null, 2)}
                                  </pre>
                                </div>
                              );
                            }

                            // Compact streaming
                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-1.5 text-xs font-mono ${
                                  isLatest
                                    ? 'text-[var(--md-success)]'
                                    : 'text-[var(--md-on-surface-variant)]'
                                }`}
                              >
                                {isLatest ? (
                                  <svg className="w-3 h-3 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 flex-shrink-0 text-[var(--md-success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                                {server && (
                                  <span className="text-[var(--md-accent)]">{server}</span>
                                )}
                                {server && <span className="text-[var(--md-outline)]">/</span>}
                                <span className="truncate">{tool}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--md-on-surface-variant)]">
                        Thinking...
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Fixed input area at bottom */}
          <div className="flex-shrink-0 pt-4 pb-4 px-4 bg-[var(--md-surface)] border-t border-[var(--md-outline-variant)]">
            <div className="w-full max-w-2xl mx-auto">
              {inputFormJSX}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatInterface;
