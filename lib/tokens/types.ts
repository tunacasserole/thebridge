/**
 * @fileoverview Token Usage Types
 *
 * @description
 * Type definitions for tracking token usage across TheBridge chat API.
 * Used to measure and optimize token consumption.
 */

/**
 * Breakdown of tokens by component
 */
export interface TokenBreakdown {
  systemPrompt: number;
  conversationHistory: number;
  userMessage: number;
  toolDefinitions: number;
  toolResults: number;
  assistantResponse: number;
  total: number;
}

/**
 * Token usage for a single API request
 */
export interface TokenUsage {
  requestId: string;
  timestamp: Date;
  model: string;

  // Input tokens
  inputTokens: number;
  inputBreakdown: TokenBreakdown;

  // Output tokens
  outputTokens: number;

  // Total
  totalTokens: number;

  // Context
  agentId?: string;
  conversationId?: string;
  userId?: string;

  // Performance
  responseTimeMs: number;
  toolCalls: number;
  iterations: number;
}

/**
 * Aggregated token statistics
 */
export interface TokenStats {
  period: 'hour' | 'day' | 'week' | 'month';
  totalRequests: number;
  totalTokens: number;
  averageTokensPerRequest: number;

  // Breakdown by component
  systemPromptTokens: number;
  conversationTokens: number;
  toolDefinitionTokens: number;
  toolResultTokens: number;

  // Percentages
  systemPromptPercentage: number;
  conversationPercentage: number;
  toolDefinitionPercentage: number;
  toolResultPercentage: number;

  // Cost (assuming $3/MTok input, $15/MTok output for Claude Sonnet)
  estimatedCostUSD: number;
}

/**
 * Token estimation for planning
 */
export interface TokenEstimate {
  component: string;
  estimatedTokens: number;
  confidence: 'low' | 'medium' | 'high';
  notes?: string;
}
