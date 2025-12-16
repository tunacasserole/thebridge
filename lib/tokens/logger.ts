/**
 * @fileoverview Token Usage Logger
 *
 * @description
 * Logs token usage to console and potentially to external logging services.
 * Provides structured logging for token consumption analysis.
 */

import type { TokenUsage, TokenBreakdown } from './types';
import { formatTokenCount, calculatePercentage } from './counter';

/**
 * Log token usage for a request
 *
 * @param usage - Token usage data
 */
export function logTokenUsage(usage: TokenUsage): void {
  const { inputBreakdown, totalTokens, model, agentId, iterations, toolCalls } = usage;

  console.log('[Tokens] Request completed:', {
    requestId: usage.requestId,
    model,
    agentId: agentId || 'main',
    totalTokens: formatTokenCount(totalTokens),
    inputTokens: formatTokenCount(usage.inputTokens),
    outputTokens: formatTokenCount(usage.outputTokens),
    iterations,
    toolCalls,
    breakdown: formatBreakdown(inputBreakdown),
    responseTimeMs: usage.responseTimeMs,
  });
}

/**
 * Log token breakdown as percentages
 *
 * @param breakdown - Token breakdown
 * @returns Formatted breakdown string
 */
function formatBreakdown(breakdown: TokenBreakdown): string {
  const total = breakdown.total;

  return [
    `sys: ${calculatePercentage(breakdown.systemPrompt, total)}%`,
    `conv: ${calculatePercentage(breakdown.conversationHistory, total)}%`,
    `msg: ${calculatePercentage(breakdown.userMessage, total)}%`,
    `tools: ${calculatePercentage(breakdown.toolDefinitions, total)}%`,
    `results: ${calculatePercentage(breakdown.toolResults, total)}%`,
  ].join(', ');
}

/**
 * Log warning if token usage is high
 *
 * @param usage - Token usage data
 * @param threshold - Warning threshold (default: 100K tokens)
 */
export function warnHighTokenUsage(usage: TokenUsage, threshold: number = 100_000): void {
  if (usage.totalTokens > threshold) {
    console.warn('[Tokens] High token usage detected:', {
      requestId: usage.requestId,
      totalTokens: formatTokenCount(usage.totalTokens),
      threshold: formatTokenCount(threshold),
      topConsumers: getTopConsumers(usage.inputBreakdown),
    });
  }
}

/**
 * Get top token consumers from breakdown
 *
 * @param breakdown - Token breakdown
 * @returns Array of top consumers with percentages
 */
function getTopConsumers(breakdown: TokenBreakdown): Array<{ component: string; percentage: number }> {
  const components = [
    { component: 'systemPrompt', tokens: breakdown.systemPrompt },
    { component: 'conversationHistory', tokens: breakdown.conversationHistory },
    { component: 'toolDefinitions', tokens: breakdown.toolDefinitions },
    { component: 'toolResults', tokens: breakdown.toolResults },
    { component: 'userMessage', tokens: breakdown.userMessage },
  ];

  return components
    .map(c => ({
      component: c.component,
      percentage: calculatePercentage(c.tokens, breakdown.total),
    }))
    .filter(c => c.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
}

/**
 * Create a request ID for tracking
 *
 * @returns Unique request ID
 */
export function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
