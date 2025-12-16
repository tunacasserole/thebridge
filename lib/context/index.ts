/**
 * Context Management System
 *
 * Comprehensive context window management, compression, and retrieval
 * for token-efficient conversation handling.
 *
 * @module lib/context
 */

// Core types
export type {
  ContextMessage,
  ContextWindowConfig,
  ContextStrategy,
  CompressionResult,
  RetrievalResult,
  ContextAnalysis,
  ImportanceFactors,
  ContextManagementOptions,
  SlidingWindowResult,
  ClaudeMessageContext,
} from './types';

// Token estimation utilities
export {
  estimateTokens,
  estimateMessageTokens,
  estimateTotalTokens,
  estimateClaudeMessageTokens,
  estimateClaudeMessagesTokens,
  calculateCompressionRatio,
  addTokenEstimates,
} from './tokenEstimator';

// Window Manager
export {
  ContextWindowManager,
  createWindowManager,
  DEFAULT_CONFIG,
} from './windowManager';

// Compressor
export {
  ContextCompressor,
  createCompressor,
  type CompressionStrategy,
  type CompressionOptions,
} from './compressor';

// Retriever
export {
  ContextRetriever,
  createRetriever,
  type RetrievalOptions,
} from './retriever';

// Strategy Manager
export {
  ContextStrategyManager,
  createStrategyManager,
  applyContextStrategy,
} from './strategies';

/**
 * Quick start helper for common use case
 *
 * @example
 * ```typescript
 * import { createContextManager } from '@/lib/context';
 *
 * const manager = createContextManager();
 * const optimizedContext = await manager.prepareContextForClaude(messages, {
 *   strategy: 'hybrid',
 *   enableCompression: true,
 *   enableRetrieval: true,
 *   conversationId: 'abc123',
 * });
 * ```
 */
export function createContextManager() {
  return createStrategyManager();
}
