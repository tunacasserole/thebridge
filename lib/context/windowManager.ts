/**
 * Context Window Manager
 *
 * Manages the context window for conversations, implementing:
 * - Smart truncation of conversation history
 * - Priority-based message retention
 * - Sliding window strategies
 * - Context overflow prevention
 */

import type {
  ContextMessage,
  ContextWindowConfig,
  ContextAnalysis,
  ImportanceFactors,
  SlidingWindowResult,
} from './types';
import {
  estimateMessageTokens,
  estimateTotalTokens,
  addTokenEstimates,
} from './tokenEstimator';

/**
 * Default context window configuration
 */
export const DEFAULT_CONFIG: ContextWindowConfig = {
  maxTokens: 180000, // Claude's context window (200k with buffer)
  targetTokens: 150000, // Target to stay well under limit
  preserveMessages: 10, // Always keep last 10 messages
  compressionThreshold: 120000, // Compress when over 120k tokens
  retrievalThreshold: 100000, // Use retrieval when over 100k tokens
};

/**
 * Context Window Manager class
 */
export class ContextWindowManager {
  private config: ContextWindowConfig;

  constructor(config?: Partial<ContextWindowConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze context to determine what needs to be done
   */
  analyzeContext(messages: ContextMessage[]): ContextAnalysis {
    // Add token estimates if not present
    const messagesWithTokens = addTokenEstimates(messages);
    const estimatedTokens = estimateTotalTokens(messagesWithTokens);

    // Separate messages into preserved and compressible
    const recentCount = Math.min(this.config.preserveMessages, messages.length);
    const preservedMessages = messagesWithTokens.slice(-recentCount);
    const compressibleMessages = messagesWithTokens.slice(0, -recentCount);

    // Determine what actions are needed
    const needsCompression = estimatedTokens > this.config.compressionThreshold;
    const needsRetrieval = estimatedTokens > this.config.retrievalThreshold;

    // Recommend strategy based on context size
    let recommendedStrategy: 'sliding-window' | 'summarization' | 'retrieval-augmented' | 'hybrid';
    if (estimatedTokens > this.config.maxTokens * 0.9) {
      recommendedStrategy = 'hybrid'; // Use everything
    } else if (needsRetrieval) {
      recommendedStrategy = 'retrieval-augmented';
    } else if (needsCompression) {
      recommendedStrategy = 'summarization';
    } else {
      recommendedStrategy = 'sliding-window';
    }

    return {
      totalMessages: messages.length,
      estimatedTokens,
      needsCompression,
      needsRetrieval,
      recommendedStrategy,
      preservedMessages,
      compressibleMessages,
    };
  }

  /**
   * Calculate importance score for a message
   */
  calculateImportance(message: ContextMessage, index: number, total: number): number {
    const factors: ImportanceFactors = {
      hasError: message.content.toLowerCase().includes('error') ||
                message.content.toLowerCase().includes('failed'),
      hasToolUse: (message.toolsUsed?.length || 0) > 0,
      isDecision: message.content.toLowerCase().includes('decision') ||
                  message.content.toLowerCase().includes('important'),
      isCritical: message.content.toLowerCase().includes('critical') ||
                  message.content.toLowerCase().includes('urgent'),
      recentness: index / total, // 0 to 1, more recent = higher
      userMentioned: message.content.toLowerCase().includes('@user') ||
                     message.content.toLowerCase().includes('remember'),
    };

    // Calculate weighted importance score (0-1)
    let score = 0;

    // Base recency score (40% weight)
    score += factors.recentness * 0.4;

    // Critical indicators (60% weight distributed)
    if (factors.hasError) score += 0.15;
    if (factors.hasToolUse) score += 0.15;
    if (factors.isDecision) score += 0.1;
    if (factors.isCritical) score += 0.15;
    if (factors.userMentioned) score += 0.05;

    return Math.min(1, score);
  }

  /**
   * Apply sliding window strategy
   * Keeps most recent messages and drops oldest ones
   */
  applySlidingWindow(
    messages: ContextMessage[],
    targetTokens: number = this.config.targetTokens
  ): SlidingWindowResult {
    const messagesWithTokens = addTokenEstimates(messages);
    let currentTokens = 0;
    const selectedMessages: ContextMessage[] = [];
    let messagesDropped = 0;

    // Start from most recent and work backwards
    for (let i = messagesWithTokens.length - 1; i >= 0; i--) {
      const msg = messagesWithTokens[i];
      const msgTokens = msg.tokens || estimateMessageTokens(msg);

      if (currentTokens + msgTokens <= targetTokens) {
        selectedMessages.unshift(msg);
        currentTokens += msgTokens;
      } else {
        messagesDropped++;
      }
    }

    return {
      messages: selectedMessages,
      tokenCount: currentTokens,
      messagesDropped,
      messagesSummarized: 0,
    };
  }

  /**
   * Apply priority-based retention
   * Keeps messages based on importance scores
   */
  applyPriorityRetention(
    messages: ContextMessage[],
    targetTokens: number = this.config.targetTokens
  ): SlidingWindowResult {
    const messagesWithTokens = addTokenEstimates(messages);
    const total = messages.length;

    // Calculate importance for each message
    const messagesWithImportance = messagesWithTokens.map((msg, idx) => ({
      ...msg,
      importance: msg.importance || this.calculateImportance(msg, idx, total),
    }));

    // Always preserve most recent messages
    const recentCount = Math.min(this.config.preserveMessages, messages.length);
    const preservedMessages = messagesWithImportance.slice(-recentCount);
    const preservedTokens = estimateTotalTokens(preservedMessages);

    // Sort older messages by importance (descending)
    const olderMessages = messagesWithImportance.slice(0, -recentCount);
    olderMessages.sort((a, b) => (b.importance || 0) - (a.importance || 0));

    // Add older messages until we hit token limit
    const selectedOlderMessages: ContextMessage[] = [];
    let currentTokens = preservedTokens;

    for (const msg of olderMessages) {
      const msgTokens = msg.tokens || estimateMessageTokens(msg);
      if (currentTokens + msgTokens <= targetTokens) {
        selectedOlderMessages.push(msg);
        currentTokens += msgTokens;
      }
    }

    // Combine and sort by original order
    const allSelected = [...selectedOlderMessages, ...preservedMessages];
    const originalIndices = new Map(
      messagesWithImportance.map((msg, idx) => [msg, idx])
    );
    allSelected.sort((a, b) => (originalIndices.get(a) || 0) - (originalIndices.get(b) || 0));

    return {
      messages: allSelected,
      tokenCount: currentTokens,
      messagesDropped: messages.length - allSelected.length,
      messagesSummarized: 0,
    };
  }

  /**
   * Truncate messages to fit within token budget
   */
  truncateToFit(
    messages: ContextMessage[],
    targetTokens: number = this.config.targetTokens,
    usePriority: boolean = true
  ): SlidingWindowResult {
    const currentTokens = estimateTotalTokens(messages);

    // If we're already under budget, return as-is
    if (currentTokens <= targetTokens) {
      return {
        messages,
        tokenCount: currentTokens,
        messagesDropped: 0,
        messagesSummarized: 0,
      };
    }

    // Apply appropriate strategy
    if (usePriority) {
      return this.applyPriorityRetention(messages, targetTokens);
    } else {
      return this.applySlidingWindow(messages, targetTokens);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ContextWindowConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ContextWindowConfig {
    return { ...this.config };
  }
}

/**
 * Create a default context window manager instance
 */
export function createWindowManager(config?: Partial<ContextWindowConfig>): ContextWindowManager {
  return new ContextWindowManager(config);
}
