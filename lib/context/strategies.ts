/**
 * Context Management Strategies
 *
 * Implements different strategies for managing conversation context:
 * - Sliding Window: Keep recent messages only
 * - Summarization: Compress old messages
 * - Retrieval-Augmented: Fetch relevant context on demand
 * - Hybrid: Combine all approaches
 */

import type Anthropic from '@anthropic-ai/sdk';
import type {
  ContextMessage,
  ContextStrategy,
  ContextManagementOptions,
  ClaudeMessageContext,
} from './types';
import { ContextWindowManager } from './windowManager';
import { ContextCompressor } from './compressor';
import { ContextRetriever } from './retriever';
import {
  estimateTotalTokens,
  estimateClaudeMessagesTokens,
  addTokenEstimates,
} from './tokenEstimator';

/**
 * Context Strategy Manager
 * Orchestrates different context management strategies
 */
export class ContextStrategyManager {
  private windowManager: ContextWindowManager;
  private compressor: ContextCompressor;
  private retriever: ContextRetriever;

  constructor(
    windowManager?: ContextWindowManager,
    compressor?: ContextCompressor,
    retriever?: ContextRetriever
  ) {
    this.windowManager = windowManager || new ContextWindowManager();
    this.compressor = compressor || new ContextCompressor();
    this.retriever = retriever || new ContextRetriever();
  }

  /**
   * Apply the specified context strategy
   */
  async applyStrategy(
    messages: ContextMessage[],
    options: ContextManagementOptions = {}
  ): Promise<ContextMessage[]> {
    const {
      strategy = 'sliding-window',
      enableCompression = true,
      enableRetrieval = false,
      conversationId,
    } = options;

    // Update managers if custom config provided
    if (options.config) {
      this.windowManager.updateConfig(options.config);
    }

    switch (strategy) {
      case 'sliding-window':
        return this.applySlidingWindow(messages);

      case 'summarization':
        return enableCompression
          ? await this.applySummarization(messages)
          : this.applySlidingWindow(messages);

      case 'retrieval-augmented':
        return enableRetrieval && conversationId
          ? await this.applyRetrievalAugmented(messages, conversationId)
          : this.applySlidingWindow(messages);

      case 'hybrid':
        return await this.applyHybrid(messages, options);

      default:
        return this.applySlidingWindow(messages);
    }
  }

  /**
   * Sliding Window Strategy
   * Keep only recent messages
   */
  private applySlidingWindow(messages: ContextMessage[]): ContextMessage[] {
    const config = this.windowManager.getConfig();
    const result = this.windowManager.truncateToFit(messages, config.targetTokens, true);
    return result.messages;
  }

  /**
   * Summarization Strategy
   * Compress older messages while keeping recent ones
   */
  private async applySummarization(messages: ContextMessage[]): Promise<ContextMessage[]> {
    const analysis = this.windowManager.analyzeContext(messages);

    // If we're under the compression threshold, no need to compress
    if (!analysis.needsCompression) {
      return messages;
    }

    // Compress older messages
    const compressionResult = await this.compressor.compressMessages(
      analysis.compressibleMessages
    );

    // Combine compressed messages with preserved recent ones
    return [...compressionResult.messages, ...analysis.preservedMessages];
  }

  /**
   * Retrieval-Augmented Strategy
   * Fetch only relevant context from database
   */
  private async applyRetrievalAugmented(
    messages: ContextMessage[],
    conversationId: string
  ): Promise<ContextMessage[]> {
    // Get the most recent message as the query
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return messages;

    const config = this.windowManager.getConfig();

    // Always keep recent messages
    const recentCount = Math.min(config.preserveMessages, messages.length);
    const recentMessages = messages.slice(-recentCount);
    const recentTokens = estimateTotalTokens(recentMessages);

    // Retrieve relevant older context
    const retrievalResult = await this.retriever.retrieveRelevantContext({
      conversationId,
      query: latestMessage.content,
      maxMessages: 15,
      minRelevanceScore: 0.4,
      maxTokens: config.targetTokens - recentTokens,
    });

    // Combine retrieved context with recent messages
    // Remove duplicates based on content
    const allMessages = [...retrievalResult.relevantMessages, ...recentMessages];
    const uniqueMessages = this.deduplicateMessages(allMessages);

    return uniqueMessages;
  }

  /**
   * Hybrid Strategy
   * Combine all approaches based on context analysis
   */
  private async applyHybrid(
    messages: ContextMessage[],
    options: ContextManagementOptions
  ): Promise<ContextMessage[]> {
    const analysis = this.windowManager.analyzeContext(messages);

    // If we're well under limits, return as-is
    if (analysis.estimatedTokens < this.windowManager.getConfig().compressionThreshold) {
      return messages;
    }

    let processedMessages = messages;

    // Step 1: If retrieval is enabled and we have a conversation ID, use RAG
    if (options.enableRetrieval && options.conversationId) {
      processedMessages = await this.applyRetrievalAugmented(
        processedMessages,
        options.conversationId
      );
    }

    // Step 2: If still over threshold, apply compression
    const currentTokens = estimateTotalTokens(processedMessages);
    if (currentTokens > this.windowManager.getConfig().compressionThreshold) {
      if (options.enableCompression) {
        processedMessages = await this.applySummarization(processedMessages);
      }
    }

    // Step 3: Final sliding window as safety net
    const finalTokens = estimateTotalTokens(processedMessages);
    if (finalTokens > this.windowManager.getConfig().targetTokens) {
      const result = this.windowManager.truncateToFit(
        processedMessages,
        this.windowManager.getConfig().targetTokens
      );
      processedMessages = result.messages;
    }

    return processedMessages;
  }

  /**
   * Convert ContextMessages to Claude MessageParams
   */
  convertToClaudeMessages(messages: ContextMessage[]): Anthropic.MessageParam[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Prepare messages with context management applied
   */
  async prepareContextForClaude(
    messages: ContextMessage[],
    options: ContextManagementOptions = {}
  ): Promise<ClaudeMessageContext> {
    // Add token estimates
    const messagesWithTokens = addTokenEstimates(messages);

    // Determine and apply appropriate strategy
    const analysis = this.windowManager.analyzeContext(messagesWithTokens);
    const strategy = options.strategy || analysis.recommendedStrategy;

    // Apply the strategy
    const processedMessages = await this.applyStrategy(messagesWithTokens, {
      ...options,
      strategy,
    });

    // Convert to Claude format
    const claudeMessages = this.convertToClaudeMessages(processedMessages);
    const estimatedTokens = estimateClaudeMessagesTokens(claudeMessages);

    return {
      messages: claudeMessages,
      estimatedTokens,
      strategy,
    };
  }

  /**
   * Remove duplicate messages
   */
  private deduplicateMessages(messages: ContextMessage[]): ContextMessage[] {
    const seen = new Set<string>();
    const unique: ContextMessage[] = [];

    for (const msg of messages) {
      // Create a hash from role + first 100 chars of content
      const hash = `${msg.role}:${msg.content.substring(0, 100)}`;

      if (!seen.has(hash)) {
        seen.add(hash);
        unique.push(msg);
      }
    }

    return unique;
  }

  /**
   * Get context statistics
   */
  getContextStats(messages: ContextMessage[]): {
    totalMessages: number;
    totalTokens: number;
    avgTokensPerMessage: number;
    strategy: ContextStrategy;
  } {
    const messagesWithTokens = addTokenEstimates(messages);
    const totalTokens = estimateTotalTokens(messagesWithTokens);
    const analysis = this.windowManager.analyzeContext(messagesWithTokens);

    return {
      totalMessages: messages.length,
      totalTokens,
      avgTokensPerMessage: messages.length > 0 ? totalTokens / messages.length : 0,
      strategy: analysis.recommendedStrategy,
    };
  }

  /**
   * Set Anthropic client for AI-based compression
   */
  setAnthropicClient(client: Anthropic): void {
    this.compressor.updateOptions({ anthropicClient: client });
  }
}

/**
 * Create a context strategy manager instance
 */
export function createStrategyManager(
  options: {
    windowManager?: ContextWindowManager;
    compressor?: ContextCompressor;
    retriever?: ContextRetriever;
  } = {}
): ContextStrategyManager {
  return new ContextStrategyManager(
    options.windowManager,
    options.compressor,
    options.retriever
  );
}

/**
 * Quick helper to apply a strategy to messages
 */
export async function applyContextStrategy(
  messages: ContextMessage[],
  strategy: ContextStrategy = 'sliding-window',
  options: Omit<ContextManagementOptions, 'strategy'> = {}
): Promise<ContextMessage[]> {
  const manager = createStrategyManager();
  return manager.applyStrategy(messages, { ...options, strategy });
}
