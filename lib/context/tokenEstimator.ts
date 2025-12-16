/**
 * Token Estimation Utilities
 *
 * Provides approximate token counting for messages.
 * Uses a simple heuristic: ~4 characters per token (Claude's typical ratio).
 * For production, consider using tiktoken or anthropic's official tokenizer.
 */

import type { ContextMessage } from './types';
import type Anthropic from '@anthropic-ai/sdk';

// Average characters per token for Claude models
const CHARS_PER_TOKEN = 4;

/**
 * Estimate token count for a string
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Simple heuristic: ~4 chars per token
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate token count for a context message
 */
export function estimateMessageTokens(message: ContextMessage): number {
  if (message.tokens) return message.tokens;

  let tokens = estimateTokens(message.content);

  // Add overhead for role and structure
  tokens += 4;

  // Add overhead for tool use
  if (message.toolsUsed && message.toolsUsed.length > 0) {
    tokens += message.toolsUsed.length * 10; // Rough estimate for tool metadata
  }

  return tokens;
}

/**
 * Estimate total tokens for an array of messages
 */
export function estimateTotalTokens(messages: ContextMessage[]): number {
  return messages.reduce((total, msg) => total + estimateMessageTokens(msg), 0);
}

/**
 * Estimate tokens for Claude MessageParam
 */
export function estimateClaudeMessageTokens(message: Anthropic.MessageParam): number {
  let tokens = 4; // Base overhead

  if (typeof message.content === 'string') {
    tokens += estimateTokens(message.content);
  } else if (Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.type === 'text') {
        tokens += estimateTokens(block.text);
      } else if (block.type === 'image') {
        // Images are ~1000-2000 tokens depending on size
        tokens += 1500;
      } else if (block.type === 'tool_use') {
        tokens += estimateTokens(JSON.stringify(block.input || {})) + 20;
      } else if (block.type === 'tool_result') {
        tokens += estimateTokens(
          typeof block.content === 'string' ? block.content : JSON.stringify(block.content)
        ) + 20;
      }
    }
  }

  return tokens;
}

/**
 * Estimate total tokens for Claude messages array
 */
export function estimateClaudeMessagesTokens(messages: Anthropic.MessageParam[]): number {
  return messages.reduce((total, msg) => total + estimateClaudeMessageTokens(msg), 0);
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(originalTokens: number, compressedTokens: number): number {
  if (originalTokens === 0) return 0;
  return (originalTokens - compressedTokens) / originalTokens;
}

/**
 * Add token estimates to messages
 */
export function addTokenEstimates(messages: ContextMessage[]): ContextMessage[] {
  return messages.map(msg => ({
    ...msg,
    tokens: msg.tokens || estimateMessageTokens(msg),
  }));
}
