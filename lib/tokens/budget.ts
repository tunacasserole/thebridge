/**
 * Token Budget Manager - Enforces token limits per conversation and user
 *
 * Enhanced with database-backed budget tracking for per-user limits.
 */

import { prisma } from '@/lib/db';
import { countConversationTokens, TokenCount } from './counter';

export interface BudgetConfig {
  maxTokensPerConversation: number;
  maxTokensPerMessage: number;
  warningThreshold: number; // 0.0 - 1.0
  maxTokensPerRequest?: number; // Optional per-request limit
}

export interface BudgetStatus {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export interface UserBudgetStatus {
  totalCostCents: number;
  limitCents: number;
  percentUsed: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  totalTokens: number;
  totalCalls: number;
}

export class TokenBudget {
  private config: BudgetConfig;
  private conversationTokens: number = 0;

  constructor(config: Partial<BudgetConfig> = {}) {
    this.config = {
      maxTokensPerConversation: config.maxTokensPerConversation || 100_000,
      maxTokensPerMessage: config.maxTokensPerMessage || 8_192,
      maxTokensPerRequest: config.maxTokensPerRequest || 200_000,
      warningThreshold: config.warningThreshold || 0.8,
    };
  }

  /**
   * Check if adding a message would exceed budget
   */
  canAddMessage(
    messages: { role: string; content: string | unknown[] }[],
    tools?: unknown[],
    systemPrompt?: string
  ): boolean {
    const count = countConversationTokens(messages, tools, systemPrompt);
    return count.total <= this.config.maxTokensPerConversation;
  }

  /**
   * Get current budget status
   */
  getStatus(
    messages: { role: string; content: string | unknown[] }[],
    tools?: unknown[],
    systemPrompt?: string
  ): BudgetStatus {
    const count = countConversationTokens(messages, tools, systemPrompt);
    const used = count.total;
    const limit = this.config.maxTokensPerConversation;
    const remaining = Math.max(0, limit - used);
    const percentUsed = (used / limit) * 100;

    return {
      used,
      limit,
      remaining,
      percentUsed,
      isOverBudget: used > limit,
      isNearLimit: percentUsed >= this.config.warningThreshold * 100,
    };
  }

  /**
   * Truncate conversation history to fit within budget
   * Keeps system prompt and most recent messages
   */
  truncateToFit(
    messages: { role: string; content: string | unknown[] }[],
    tools?: unknown[],
    systemPrompt?: string,
    minMessages: number = 2
  ): { role: string; content: string | unknown[] }[] {
    // Always keep at least the last few messages
    if (messages.length <= minMessages) {
      return messages;
    }

    // Binary search for the right number of messages
    let left = minMessages;
    let right = messages.length;
    let bestFit = messages.slice(-minMessages);

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const subset = messages.slice(-mid);
      const count = countConversationTokens(subset, tools, systemPrompt);

      if (count.total <= this.config.maxTokensPerConversation) {
        bestFit = subset;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return bestFit;
  }

  /**
   * Get recommended action based on budget status
   */
  getRecommendation(status: BudgetStatus): string {
    if (status.isOverBudget) {
      return 'TRUNCATE: Conversation exceeds token budget. Remove old messages.';
    }

    if (status.isNearLimit) {
      return 'WARNING: Approaching token limit. Consider summarizing or truncating.';
    }

    if (status.percentUsed > 50) {
      return 'CAUTION: Over 50% of budget used. Monitor token usage.';
    }

    return 'OK: Token usage is within normal limits.';
  }

  /**
   * Get user's monthly budget status from database
   */
  async getUserBudgetStatus(userId: string): Promise<UserBudgetStatus | null> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [budget, usage] = await Promise.all([
        prisma.budget.findUnique({
          where: { userId },
        }),
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
      ]);

      if (!budget) {
        return null;
      }

      const totalCostCents = usage._sum.estimatedCostCents || 0;
      const percentUsed = (totalCostCents / budget.monthlyLimitCents) * 100;

      return {
        totalCostCents,
        limitCents: budget.monthlyLimitCents,
        percentUsed,
        isOverBudget: totalCostCents > budget.monthlyLimitCents,
        isNearLimit: percentUsed >= this.config.warningThreshold * 100,
        totalTokens: usage._sum.totalTokens || 0,
        totalCalls: usage._count,
      };
    } catch (error) {
      console.error('[TokenBudget] Error getting user budget status:', error);
      return null;
    }
  }

  /**
   * Check if user can make a request based on their budget
   */
  async canUserMakeRequest(
    userId: string,
    estimatedCostCents: number
  ): Promise<{ allowed: boolean; reason?: string; status?: UserBudgetStatus }> {
    const status = await this.getUserBudgetStatus(userId);

    if (!status) {
      // No budget set, allow request
      return { allowed: true };
    }

    const projectedCost = status.totalCostCents + estimatedCostCents;

    if (projectedCost > status.limitCents) {
      return {
        allowed: false,
        reason: `Monthly budget exceeded (${(projectedCost / 100).toFixed(2)} > ${(status.limitCents / 100).toFixed(2)})`,
        status,
      };
    }

    return { allowed: true, status };
  }

  /**
   * Create or update user budget
   */
  async setUserBudget(
    userId: string,
    limitCents: number,
    alertThresholds?: {
      threshold1?: number;
      threshold2?: number;
      threshold3?: number;
    }
  ): Promise<void> {
    await prisma.budget.upsert({
      where: { userId },
      update: {
        monthlyLimitCents: limitCents,
        ...(alertThresholds && {
          alertThreshold1: alertThresholds.threshold1,
          alertThreshold2: alertThresholds.threshold2,
          alertThreshold3: alertThresholds.threshold3,
        }),
      },
      create: {
        userId,
        monthlyLimitCents: limitCents,
        alertThreshold1: alertThresholds?.threshold1 || 50,
        alertThreshold2: alertThresholds?.threshold2 || 75,
        alertThreshold3: alertThresholds?.threshold3 || 90,
      },
    });
  }
}
