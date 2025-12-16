/**
 * Context Management Types
 *
 * Core type definitions for the context window management, compression,
 * and retrieval-augmented context system.
 */

import type Anthropic from '@anthropic-ai/sdk';

// Message types for context management
export interface ContextMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  toolsUsed?: string[];
  importance?: number; // 0-1 score for retention priority
  tokens?: number; // Estimated token count
  compressed?: boolean; // Whether this message has been compressed
  summary?: string; // Summary if compressed
}

// Context window configuration
export interface ContextWindowConfig {
  maxTokens: number; // Maximum tokens for context window
  targetTokens: number; // Target to stay under (with buffer)
  preserveMessages: number; // Number of recent messages to always keep
  compressionThreshold: number; // Token count to trigger compression
  retrievalThreshold: number; // Token count to trigger RAG retrieval
}

// Context strategy types
export type ContextStrategy =
  | 'sliding-window'
  | 'summarization'
  | 'retrieval-augmented'
  | 'hybrid';

// Compression result
export interface CompressionResult {
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  summary: string;
  messages: ContextMessage[];
}

// Retrieval result for RAG
export interface RetrievalResult {
  relevantMessages: ContextMessage[];
  relevanceScores: number[];
  totalRetrieved: number;
  estimatedTokens: number;
}

// Context analysis result
export interface ContextAnalysis {
  totalMessages: number;
  estimatedTokens: number;
  needsCompression: boolean;
  needsRetrieval: boolean;
  recommendedStrategy: ContextStrategy;
  preservedMessages: ContextMessage[];
  compressibleMessages: ContextMessage[];
}

// Message importance factors
export interface ImportanceFactors {
  hasError: boolean;
  hasToolUse: boolean;
  isDecision: boolean;
  isCritical: boolean;
  recentness: number; // 0-1, more recent = higher
  userMentioned: boolean;
}

// Context management options
export interface ContextManagementOptions {
  strategy?: ContextStrategy;
  config?: Partial<ContextWindowConfig>;
  enableCompression?: boolean;
  enableRetrieval?: boolean;
  conversationId?: string;
}

// Sliding window result
export interface SlidingWindowResult {
  messages: ContextMessage[];
  tokenCount: number;
  messagesDropped: number;
  messagesSummarized: number;
}

// Claude message conversion
export interface ClaudeMessageContext {
  messages: Anthropic.MessageParam[];
  estimatedTokens: number;
  strategy: ContextStrategy;
}
