/**
 * Chat API Integration for Context Management
 *
 * Provides integration helpers for using context management in the chat API.
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { ContextMessage, ContextManagementOptions } from './types';
import { ContextStrategyManager } from './strategies';
import { estimateClaudeMessagesTokens } from './tokenEstimator';

/**
 * Configuration for context management in chat
 */
export interface ChatContextConfig {
  enableContextManagement?: boolean;
  strategy?: 'sliding-window' | 'summarization' | 'retrieval-augmented' | 'hybrid';
  enableCompression?: boolean;
  enableRetrieval?: boolean;
  maxContextTokens?: number;
}

/**
 * Chat Context Manager
 * Integrates context management into the chat flow
 */
export class ChatContextManager {
  private strategyManager: ContextStrategyManager;
  private anthropicClient?: Anthropic;

  constructor(anthropicClient?: Anthropic) {
    this.strategyManager = new ContextStrategyManager();
    this.anthropicClient = anthropicClient;
    if (anthropicClient) {
      this.strategyManager.setAnthropicClient(anthropicClient);
    }
  }

  /**
   * Process conversation history for chat API
   */
  async processConversationHistory(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    config: ChatContextConfig,
    conversationId?: string
  ): Promise<{
    messages: Anthropic.MessageParam[];
    tokensSaved: number;
    strategy: string;
    stats: {
      originalMessages: number;
      processedMessages: number;
      originalTokens: number;
      processedTokens: number;
    };
  }> {
    // If context management is disabled, return as-is
    if (!config.enableContextManagement) {
      const messages: Anthropic.MessageParam[] = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      const tokens = estimateClaudeMessagesTokens(messages);
      return {
        messages,
        tokensSaved: 0,
        strategy: 'none',
        stats: {
          originalMessages: messages.length,
          processedMessages: messages.length,
          originalTokens: tokens,
          processedTokens: tokens,
        },
      };
    }

    // Convert to ContextMessage format
    const contextMessages: ContextMessage[] = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
    }));

    // Prepare options
    const options: ContextManagementOptions = {
      strategy: config.strategy || 'hybrid',
      enableCompression: config.enableCompression ?? true,
      enableRetrieval: config.enableRetrieval ?? false,
      conversationId,
      config: config.maxContextTokens
        ? { targetTokens: config.maxContextTokens }
        : undefined,
    };

    // Calculate original token count
    const originalMessages: Anthropic.MessageParam[] = contextMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    const originalTokens = estimateClaudeMessagesTokens(originalMessages);

    // Apply context management
    const result = await this.strategyManager.prepareContextForClaude(
      contextMessages,
      options
    );

    // Calculate savings
    const tokensSaved = originalTokens - result.estimatedTokens;

    return {
      messages: result.messages,
      tokensSaved: Math.max(0, tokensSaved),
      strategy: result.strategy,
      stats: {
        originalMessages: contextMessages.length,
        processedMessages: result.messages.length,
        originalTokens,
        processedTokens: result.estimatedTokens,
      },
    };
  }

  /**
   * Check if context management should be triggered
   */
  shouldApplyContextManagement(
    messageCount: number,
    estimatedTokens?: number
  ): boolean {
    // Apply if we have many messages
    if (messageCount > 20) return true;

    // Apply if we're using significant tokens
    if (estimatedTokens && estimatedTokens > 50000) return true;

    return false;
  }

  /**
   * Get recommended strategy based on conversation state
   */
  getRecommendedStrategy(
    messageCount: number,
    estimatedTokens: number,
    hasConversationId: boolean
  ): 'sliding-window' | 'summarization' | 'retrieval-augmented' | 'hybrid' {
    // For very large contexts, use hybrid
    if (estimatedTokens > 120000) {
      return 'hybrid';
    }

    // For large contexts with conversation ID, use retrieval
    if (estimatedTokens > 80000 && hasConversationId) {
      return 'retrieval-augmented';
    }

    // For medium contexts, use summarization
    if (estimatedTokens > 50000) {
      return 'summarization';
    }

    // For smaller contexts, simple sliding window
    return 'sliding-window';
  }

  /**
   * Update Anthropic client
   */
  setAnthropicClient(client: Anthropic): void {
    this.anthropicClient = client;
    this.strategyManager.setAnthropicClient(client);
  }
}

/**
 * Create a chat context manager instance
 */
export function createChatContextManager(anthropicClient?: Anthropic): ChatContextManager {
  return new ChatContextManager(anthropicClient);
}
