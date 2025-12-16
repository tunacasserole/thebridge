/**
 * Token Usage Cost Calculator
 *
 * Calculates API costs based on token usage and model pricing.
 * Pricing as of January 2025 (subject to change).
 */

// Pricing per million tokens (in cents)
// Source: https://www.anthropic.com/pricing
export const MODEL_PRICING = {
  // Claude Sonnet 4
  'claude-sonnet-4-20250514': {
    input: 300,      // $3.00 per million input tokens
    output: 1500,    // $15.00 per million output tokens
    thinking: 300,   // Same as input for thinking tokens
  },
  // Claude Opus 4
  'claude-opus-4-20250514': {
    input: 1500,     // $15.00 per million input tokens
    output: 7500,    // $75.00 per million output tokens
    thinking: 1500,  // Same as input for thinking tokens
  },
  // Claude Haiku 3.5
  'claude-3-5-haiku-latest': {
    input: 80,       // $0.80 per million input tokens
    output: 400,     // $4.00 per million output tokens
    thinking: 80,    // Same as input for thinking tokens
  },
} as const;

// Model type aliases for easier reference
export const MODEL_ALIASES = {
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
  haiku: 'claude-3-5-haiku-latest',
} as const;

export interface TokenCounts {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
}

export interface CostBreakdown {
  inputCostCents: number;
  outputCostCents: number;
  thinkingCostCents: number;
  totalCostCents: number;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  totalTokens: number;
  model: string;
  modelType: string;
}

/**
 * Calculate the cost for a given token usage
 */
export function calculateCost(
  model: string,
  tokens: TokenCounts
): CostBreakdown {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];

  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  const inputTokens = tokens.inputTokens || 0;
  const outputTokens = tokens.outputTokens || 0;
  const thinkingTokens = tokens.thinkingTokens || 0;

  // Calculate cost per token type (pricing is per million tokens)
  const inputCostCents = Math.ceil((inputTokens / 1_000_000) * pricing.input);
  const outputCostCents = Math.ceil((outputTokens / 1_000_000) * pricing.output);
  const thinkingCostCents = Math.ceil((thinkingTokens / 1_000_000) * pricing.thinking);

  const totalCostCents = inputCostCents + outputCostCents + thinkingCostCents;
  const totalTokens = inputTokens + outputTokens + thinkingTokens;

  // Determine model type
  let modelType = 'sonnet'; // default
  if (model.includes('opus')) modelType = 'opus';
  else if (model.includes('haiku')) modelType = 'haiku';
  else if (model.includes('sonnet')) modelType = 'sonnet';

  return {
    inputCostCents,
    outputCostCents,
    thinkingCostCents,
    totalCostCents,
    inputTokens,
    outputTokens,
    thinkingTokens,
    totalTokens,
    model,
    modelType,
  };
}

/**
 * Format cost in cents to dollar string
 */
export function formatCost(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Calculate monthly projection based on current usage
 */
export interface UsageStats {
  totalCalls: number;
  totalTokens: number;
  totalCostCents: number;
  periodDays: number;
}

export interface MonthlyProjection {
  projectedCalls: number;
  projectedTokens: number;
  projectedCostCents: number;
  dailyAverage: {
    calls: number;
    tokens: number;
    costCents: number;
  };
}

export function projectMonthlyCost(stats: UsageStats): MonthlyProjection {
  const daysInMonth = 30;

  if (stats.periodDays === 0) {
    return {
      projectedCalls: 0,
      projectedTokens: 0,
      projectedCostCents: 0,
      dailyAverage: { calls: 0, tokens: 0, costCents: 0 },
    };
  }

  const dailyAverage = {
    calls: stats.totalCalls / stats.periodDays,
    tokens: stats.totalTokens / stats.periodDays,
    costCents: stats.totalCostCents / stats.periodDays,
  };

  return {
    projectedCalls: Math.ceil(dailyAverage.calls * daysInMonth),
    projectedTokens: Math.ceil(dailyAverage.tokens * daysInMonth),
    projectedCostCents: Math.ceil(dailyAverage.costCents * daysInMonth),
    dailyAverage,
  };
}

/**
 * Calculate cost savings by switching models
 */
export interface ModelComparison {
  currentModel: string;
  currentCostCents: number;
  alternativeModel: string;
  alternativeCostCents: number;
  savingsCents: number;
  savingsPercent: number;
}

export function compareModelCosts(
  tokens: TokenCounts,
  currentModel: string,
  alternativeModel: string
): ModelComparison {
  const currentCost = calculateCost(currentModel, tokens);
  const alternativeCost = calculateCost(alternativeModel, tokens);

  const savingsCents = currentCost.totalCostCents - alternativeCost.totalCostCents;
  const savingsPercent = currentCost.totalCostCents > 0
    ? (savingsCents / currentCost.totalCostCents) * 100
    : 0;

  return {
    currentModel,
    currentCostCents: currentCost.totalCostCents,
    alternativeModel,
    alternativeCostCents: alternativeCost.totalCostCents,
    savingsCents,
    savingsPercent,
  };
}

/**
 * Get pricing information for a model
 */
export function getModelPricing(model: string) {
  return MODEL_PRICING[model as keyof typeof MODEL_PRICING] || null;
}

/**
 * Format large numbers for display
 */
export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(2)}M`;
  } else if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}
