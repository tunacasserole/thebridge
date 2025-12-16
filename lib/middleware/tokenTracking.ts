/**
 * Token Tracking Middleware
 *
 * Intercepts API requests and responses to track token usage.
 * Logs usage to database for analytics and budget enforcement.
 */

import { prisma } from '@/lib/db';
import { estimateCost, TOKEN_PRICING } from '@/lib/tokens/estimator';
import type Anthropic from '@anthropic-ai/sdk';

/**
 * Token usage data for logging
 */
export interface TokenUsageData {
  // User context
  userId?: string;
  conversationId?: string;
  agentSlug?: string;

  // Model info
  model: string;
  modelType: 'sonnet' | 'opus' | 'haiku';

  // Token counts
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;

  // Metadata
  toolsUsed?: string[];
  responseTimeMs?: number;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Extract model type from model ID
 */
function getModelType(model: string): 'sonnet' | 'opus' | 'haiku' {
  const lowerModel = model.toLowerCase();
  if (lowerModel.includes('opus')) return 'opus';
  if (lowerModel.includes('haiku')) return 'haiku';
  return 'sonnet'; // default
}

/**
 * Calculate cost in cents to avoid floating point precision issues
 */
function calculateCostCents(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
}): number {
  const costUSD = estimateCost(params);
  return Math.round(costUSD * 100); // Convert to cents
}

/**
 * Log token usage to database
 */
export async function logTokenUsage(data: TokenUsageData): Promise<void> {
  try {
    const modelType = getModelType(data.model);
    const totalTokens =
      data.inputTokens +
      data.outputTokens +
      (data.thinkingTokens || 0);

    const estimatedCostCents = calculateCostCents({
      model: data.model,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
    });

    // Only log if we have a userId
    if (!data.userId) {
      console.warn('[TokenTracking] Skipping log - no userId provided');
      return;
    }

    await prisma.tokenUsage.create({
      data: {
        userId: data.userId,
        model: data.model,
        modelType,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        thinkingTokens: data.thinkingTokens || 0,
        totalTokens,
        conversationId: data.conversationId || null,
        agentSlug: data.agentSlug || null,
        toolsUsed: data.toolsUsed ? JSON.stringify(data.toolsUsed) : null,
        estimatedCostCents,
        success: data.success ?? true,
        errorMessage: data.errorMessage || null,
        responseTimeMs: data.responseTimeMs || null,
      },
    });

    console.log('[TokenTracking] Logged usage:', {
      userId: data.userId,
      model: modelType,
      totalTokens,
      costCents: estimatedCostCents,
    });

    // Check budget warnings
    await checkBudgetWarnings(data.userId, estimatedCostCents);
  } catch (error) {
    console.error('[TokenTracking] Failed to log token usage:', error);
    // Don't throw - logging failures shouldn't break the request
  }
}

/**
 * Check if user is approaching or exceeding budget limits
 */
async function checkBudgetWarnings(
  userId: string,
  additionalCostCents: number
): Promise<void> {
  try {
    // Get user's budget
    const budget = await prisma.budget.findUnique({
      where: { userId },
    });

    if (!budget) {
      // No budget set, skip warnings
      return;
    }

    // Get current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await prisma.tokenUsage.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        estimatedCostCents: true,
      },
    });

    const totalCostCents = (monthlyUsage._sum.estimatedCostCents || 0) + additionalCostCents;
    const percentUsed = (totalCostCents / budget.monthlyLimitCents) * 100;

    // Check thresholds
    const thresholds = [
      { level: budget.alertThreshold3, name: '90%' },
      { level: budget.alertThreshold2, name: '75%' },
      { level: budget.alertThreshold1, name: '50%' },
    ];

    for (const threshold of thresholds) {
      if (percentUsed >= threshold.level) {
        console.warn('[TokenTracking] Budget warning:', {
          userId,
          percentUsed: percentUsed.toFixed(1),
          threshold: threshold.name,
          totalCost: (totalCostCents / 100).toFixed(2),
          limit: (budget.monthlyLimitCents / 100).toFixed(2),
        });

        // Update last alert time
        await prisma.budget.update({
          where: { userId },
          data: {
            lastAlertSent: new Date(),
            alertsSentThisMonth: { increment: 1 },
          },
        });

        break; // Only send one alert per request
      }
    }
  } catch (error) {
    console.error('[TokenTracking] Failed to check budget warnings:', error);
  }
}

/**
 * Extract token usage from Anthropic API response
 */
export function extractTokenUsage(
  response: Anthropic.Message
): {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
} {
  const usage = response.usage;

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    // @ts-ignore - thinking tokens may not be in the type yet
    thinkingTokens: usage.cache_read_input_tokens || 0,
  };
}

/**
 * Create a token tracking context for a request
 */
export class TokenTracker {
  private startTime: number;
  private toolsUsed: string[] = [];

  constructor(
    private userId?: string,
    private conversationId?: string,
    private agentSlug?: string,
    private model: string = 'claude-sonnet-4-20250514'
  ) {
    this.startTime = Date.now();
  }

  /**
   * Add a tool call to tracking
   */
  addToolCall(toolName: string): void {
    this.toolsUsed.push(toolName);
  }

  /**
   * Log the final usage data
   */
  async logUsage(params: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const responseTimeMs = Date.now() - this.startTime;

    await logTokenUsage({
      userId: this.userId,
      conversationId: this.conversationId,
      agentSlug: this.agentSlug,
      model: this.model,
      modelType: getModelType(this.model),
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      thinkingTokens: params.thinkingTokens,
      toolsUsed: this.toolsUsed.length > 0 ? this.toolsUsed : undefined,
      responseTimeMs,
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }
}

/**
 * Get user's current month token usage summary
 */
export async function getUserMonthlyUsage(userId: string): Promise<{
  totalTokens: number;
  totalCostCents: number;
  totalCalls: number;
  budgetLimitCents?: number;
  percentUsed?: number;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [usage, budget] = await Promise.all([
    prisma.tokenUsage.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        totalTokens: true,
        estimatedCostCents: true,
      },
      _count: true,
    }),
    prisma.budget.findUnique({
      where: { userId },
    }),
  ]);

  const totalTokens = usage._sum.totalTokens || 0;
  const totalCostCents = usage._sum.estimatedCostCents || 0;
  const totalCalls = usage._count;

  const result: {
    totalTokens: number;
    totalCostCents: number;
    totalCalls: number;
    budgetLimitCents?: number;
    percentUsed?: number;
  } = {
    totalTokens,
    totalCostCents,
    totalCalls,
  };

  if (budget) {
    result.budgetLimitCents = budget.monthlyLimitCents;
    result.percentUsed = (totalCostCents / budget.monthlyLimitCents) * 100;
  }

  return result;
}
