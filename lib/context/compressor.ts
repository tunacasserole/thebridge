/**
 * Context Compressor
 *
 * Implements message summarization and compression strategies to reduce
 * token usage while preserving essential information.
 */

import type Anthropic from '@anthropic-ai/sdk';
import type {
  ContextMessage,
  CompressionResult,
} from './types';
import {
  estimateMessageTokens,
  estimateTotalTokens,
  calculateCompressionRatio,
  addTokenEstimates,
} from './tokenEstimator';

/**
 * Compression strategies
 */
export type CompressionStrategy = 'simple' | 'ai-summarization' | 'hybrid';

/**
 * Compression options
 */
export interface CompressionOptions {
  strategy?: CompressionStrategy;
  targetRatio?: number; // Target compression ratio (0-1)
  preserveErrors?: boolean;
  preserveDecisions?: boolean;
  anthropicClient?: Anthropic; // For AI summarization
}

/**
 * Context Compressor class
 */
export class ContextCompressor {
  private options: CompressionOptions;

  constructor(options: CompressionOptions = {}) {
    this.options = {
      strategy: 'simple',
      targetRatio: 0.5, // 50% compression by default
      preserveErrors: true,
      preserveDecisions: true,
      ...options,
    };
  }

  /**
   * Compress a batch of messages
   */
  async compressMessages(messages: ContextMessage[]): Promise<CompressionResult> {
    const messagesWithTokens = addTokenEstimates(messages);
    const originalTokens = estimateTotalTokens(messagesWithTokens);

    let compressedMessages: ContextMessage[];
    let summary: string;

    switch (this.options.strategy) {
      case 'ai-summarization':
        ({ compressedMessages, summary } = await this.aiSummarization(messagesWithTokens));
        break;
      case 'hybrid':
        ({ compressedMessages, summary } = await this.hybridCompression(messagesWithTokens));
        break;
      case 'simple':
      default:
        ({ compressedMessages, summary } = this.simpleCompression(messagesWithTokens));
        break;
    }

    const compressedTokens = estimateTotalTokens(compressedMessages);
    const ratio = calculateCompressionRatio(originalTokens, compressedTokens);

    return {
      originalTokens,
      compressedTokens,
      compressionRatio: ratio,
      summary,
      messages: compressedMessages,
    };
  }

  /**
   * Simple compression: Extract key information without AI
   */
  private simpleCompression(
    messages: ContextMessage[]
  ): { compressedMessages: ContextMessage[]; summary: string } {
    const keyPoints: string[] = [];
    const preservedMessages: ContextMessage[] = [];

    for (const msg of messages) {
      // Preserve messages with errors or critical keywords
      if (this.shouldPreserve(msg)) {
        preservedMessages.push(msg);
        continue;
      }

      // Extract key information from other messages
      const keyInfo = this.extractKeyInformation(msg);
      if (keyInfo) {
        keyPoints.push(keyInfo);
      }
    }

    // Create summary message
    const summaryContent = this.createSummary(keyPoints);
    const summaryMessage: ContextMessage = {
      role: 'assistant',
      content: summaryContent,
      timestamp: new Date(),
      compressed: true,
      summary: summaryContent,
      importance: 0.8, // High importance for summaries
    };

    const compressedMessages = [summaryMessage, ...preservedMessages];

    return {
      compressedMessages,
      summary: summaryContent,
    };
  }

  /**
   * AI-based summarization using Claude
   */
  private async aiSummarization(
    messages: ContextMessage[]
  ): Promise<{ compressedMessages: ContextMessage[]; summary: string }> {
    // If no Anthropic client, fall back to simple compression
    if (!this.options.anthropicClient) {
      return this.simpleCompression(messages);
    }

    try {
      // Prepare conversation for summarization
      const conversationText = messages
        .map(m => `[${m.role}]: ${m.content}`)
        .join('\n\n');

      // Request summarization from Claude
      const response = await this.options.anthropicClient.messages.create({
        model: 'claude-3-5-haiku-latest', // Use fast, cheap model for summarization
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Please provide a concise summary of the following conversation, preserving:
- Key decisions made
- Important errors or issues mentioned
- Critical context needed for future messages
- Tool usage and results

Conversation:
${conversationText}

Provide a summary in 2-4 paragraphs.`,
          },
        ],
      });

      // Extract summary text
      const summaryText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      // Create summary message
      const summaryMessage: ContextMessage = {
        role: 'assistant',
        content: `[Conversation Summary]\n${summaryText}`,
        timestamp: new Date(),
        compressed: true,
        summary: summaryText,
        importance: 0.9,
      };

      // Preserve critical messages
      const criticalMessages = messages.filter(m => this.shouldPreserve(m));

      return {
        compressedMessages: [summaryMessage, ...criticalMessages],
        summary: summaryText,
      };
    } catch (error) {
      console.error('[Compressor] AI summarization failed, falling back to simple:', error);
      return this.simpleCompression(messages);
    }
  }

  /**
   * Hybrid compression: Combine simple and AI approaches
   */
  private async hybridCompression(
    messages: ContextMessage[]
  ): Promise<{ compressedMessages: ContextMessage[]; summary: string }> {
    // First, apply simple compression to extract critical messages
    const { compressedMessages: simpleCompressed } = this.simpleCompression(messages);

    // Then, if we have an AI client and still have many messages, use AI to further compress
    if (this.options.anthropicClient && simpleCompressed.length > 5) {
      const { compressedMessages: aiCompressed, summary } = await this.aiSummarization(
        simpleCompressed
      );
      return { compressedMessages: aiCompressed, summary };
    }

    return {
      compressedMessages: simpleCompressed,
      summary: simpleCompressed.find(m => m.compressed)?.summary || '',
    };
  }

  /**
   * Determine if a message should be preserved without compression
   */
  private shouldPreserve(message: ContextMessage): boolean {
    const content = message.content.toLowerCase();

    // Preserve errors
    if (this.options.preserveErrors) {
      if (content.includes('error') || content.includes('failed') || content.includes('exception')) {
        return true;
      }
    }

    // Preserve decisions
    if (this.options.preserveDecisions) {
      if (
        content.includes('decision') ||
        content.includes('important') ||
        content.includes('critical')
      ) {
        return true;
      }
    }

    // Preserve messages with tool usage
    if (message.toolsUsed && message.toolsUsed.length > 0) {
      return true;
    }

    // Preserve short messages (already concise)
    if (message.content.length < 200) {
      return true;
    }

    return false;
  }

  /**
   * Extract key information from a message
   */
  private extractKeyInformation(message: ContextMessage): string | null {
    const content = message.content;

    // Look for common patterns of important information
    const patterns = [
      /(?:decided|concluded|determined) that (.+)/i,
      /(?:issue|problem|error)(?::|is) (.+)/i,
      /(?:solution|fix|resolved)(?::|is) (.+)/i,
      /(?:important|note|remember)(?::|:) (.+)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return `${message.role}: ${match[1].substring(0, 150)}`;
      }
    }

    // If message is very long, take first 100 chars
    if (content.length > 500) {
      return `${message.role}: ${content.substring(0, 100)}...`;
    }

    return null;
  }

  /**
   * Create a summary from key points
   */
  private createSummary(keyPoints: string[]): string {
    if (keyPoints.length === 0) {
      return '[Previous conversation - no critical details]';
    }

    return `[Previous Conversation Summary]\n${keyPoints.join('\n')}`;
  }

  /**
   * Compress tool results to essential information
   */
  compressToolResults(toolResult: string, maxLength: number = 500): string {
    if (toolResult.length <= maxLength) {
      return toolResult;
    }

    try {
      // Try to parse as JSON and extract key fields
      const parsed = JSON.parse(toolResult);

      if (Array.isArray(parsed)) {
        return `[Array with ${parsed.length} items] ${JSON.stringify(parsed[0])}${
          parsed.length > 1 ? ' ...' : ''
        }`;
      }

      // For objects, keep only first few fields
      const keys = Object.keys(parsed);
      const compressed: Record<string, unknown> = {};
      for (let i = 0; i < Math.min(3, keys.length); i++) {
        compressed[keys[i]] = parsed[keys[i]];
      }
      if (keys.length > 3) {
        compressed['...'] = `${keys.length - 3} more fields`;
      }

      return JSON.stringify(compressed);
    } catch {
      // Not JSON, just truncate
      return toolResult.substring(0, maxLength) + '...';
    }
  }

  /**
   * Remove redundant information from context
   */
  removeRedundancy(messages: ContextMessage[]): ContextMessage[] {
    const seen = new Set<string>();
    const uniqueMessages: ContextMessage[] = [];

    for (const msg of messages) {
      // Create a simple hash of the message content
      const contentHash = this.hashContent(msg.content);

      // Skip if we've seen very similar content
      if (!seen.has(contentHash)) {
        seen.add(contentHash);
        uniqueMessages.push(msg);
      }
    }

    return uniqueMessages;
  }

  /**
   * Simple content hashing for duplicate detection
   */
  private hashContent(content: string): string {
    // Normalize and create simple hash
    const normalized = content.toLowerCase().trim().replace(/\s+/g, ' ');
    // Take first 100 chars as hash (simple approach)
    return normalized.substring(0, 100);
  }

  /**
   * Update compression options
   */
  updateOptions(options: Partial<CompressionOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * Create a context compressor instance
 */
export function createCompressor(options?: CompressionOptions): ContextCompressor {
  return new ContextCompressor(options);
}
