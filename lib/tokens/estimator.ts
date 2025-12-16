/**
 * Token Estimation Utilities
 *
 * Provides token counting and estimation for Anthropic Claude models.
 * Uses tiktoken-compatible encoding for accurate token estimation.
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Estimate tokens for a text string
 * Claude uses a similar tokenization to GPT-4, averaging ~4 chars per token
 * This is a rough estimate - for exact counts, use Anthropic's token counting API
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Conservative estimate: ~3.5 characters per token
  // Claude tends to be slightly more efficient than GPT models
  const charsPerToken = 3.5;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Estimate tokens for an array of messages
 */
export function estimateMessagesTokens(
  messages: Anthropic.MessageParam[]
): number {
  let total = 0;

  for (const message of messages) {
    // Handle different content types
    if (typeof message.content === 'string') {
      total += estimateTokens(message.content);
    } else if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === 'text') {
          total += estimateTokens(block.text);
        } else if (block.type === 'image') {
          // Images use a fixed token cost based on resolution
          // Approximate: 1000-2000 tokens per image depending on size
          total += 1500;
        } else if (block.type === 'tool_use') {
          // Tool use includes name + input JSON
          total += estimateTokens(block.name);
          total += estimateTokens(JSON.stringify(block.input));
        } else if (block.type === 'tool_result') {
          // Tool results include the result content
          total += estimateTokens(
            typeof block.content === 'string'
              ? block.content
              : JSON.stringify(block.content)
          );
        }
      }
    }

    // Add overhead for message formatting (role, etc.)
    total += 4;
  }

  return total;
}

/**
 * Estimate tokens for system prompt
 */
export function estimateSystemTokens(systemPrompt: string | string[]): number {
  if (Array.isArray(systemPrompt)) {
    return systemPrompt.reduce((sum, prompt) => sum + estimateTokens(prompt), 0);
  }
  return estimateTokens(systemPrompt);
}

/**
 * Estimate tokens for tool definitions
 */
export function estimateToolsTokens(tools: Anthropic.Tool[]): number {
  let total = 0;

  for (const tool of tools) {
    // Tool name and description
    total += estimateTokens(tool.name);
    total += estimateTokens(tool.description || '');

    // Tool input schema (JSON)
    total += estimateTokens(JSON.stringify(tool.input_schema));

    // Overhead per tool
    total += 10;
  }

  return total;
}

/**
 * Estimate total tokens for a complete API request
 */
export interface TokenEstimate {
  systemTokens: number;
  messagesTokens: number;
  toolsTokens: number;
  totalInputTokens: number;
  maxOutputTokens: number;
  totalMaxTokens: number;
}

export function estimateRequestTokens(params: {
  system?: string | string[];
  messages: Anthropic.MessageParam[];
  tools?: Anthropic.Tool[];
  maxTokens?: number;
}): TokenEstimate {
  const systemTokens = params.system
    ? estimateSystemTokens(params.system)
    : 0;

  const messagesTokens = estimateMessagesTokens(params.messages);

  const toolsTokens = params.tools
    ? estimateToolsTokens(params.tools)
    : 0;

  const totalInputTokens = systemTokens + messagesTokens + toolsTokens;
  const maxOutputTokens = params.maxTokens || 8192;
  const totalMaxTokens = totalInputTokens + maxOutputTokens;

  return {
    systemTokens,
    messagesTokens,
    toolsTokens,
    totalInputTokens,
    maxOutputTokens,
    totalMaxTokens,
  };
}

/**
 * Token cost estimation based on Anthropic pricing
 * Prices as of Dec 2024 (per million tokens)
 */
export const TOKEN_PRICING = {
  'claude-sonnet-4-20250514': {
    input: 3.00,   // $3 per MTok
    output: 15.00, // $15 per MTok
  },
  'claude-opus-4-20250514': {
    input: 15.00,  // $15 per MTok
    output: 75.00, // $75 per MTok
  },
  'claude-3-5-haiku-latest': {
    input: 0.80,   // $0.80 per MTok
    output: 4.00,  // $4 per MTok
  },
  'claude-3-5-sonnet-latest': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-opus-latest': {
    input: 15.00,
    output: 75.00,
  },
} as const;

/**
 * Calculate estimated cost for token usage
 */
export function estimateCost(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
}): number {
  const pricing = TOKEN_PRICING[params.model as keyof typeof TOKEN_PRICING];
  if (!pricing) {
    // Default to Sonnet pricing if model not found
    return (params.inputTokens * 3.00 + params.outputTokens * 15.00) / 1_000_000;
  }

  const inputCost = (params.inputTokens * pricing.input) / 1_000_000;
  const outputCost = (params.outputTokens * pricing.output) / 1_000_000;

  return inputCost + outputCost;
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  } else if (tokens < 1_000_000) {
    return `${(tokens / 1000).toFixed(1)}K tokens`;
  } else {
    return `${(tokens / 1_000_000).toFixed(2)}M tokens`;
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(3)}m`; // Show in millicents for tiny amounts
  }
  return `$${cost.toFixed(4)}`;
}
