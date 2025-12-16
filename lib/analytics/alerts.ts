/**
 * Usage Alerts System
 *
 * Monitors token usage and triggers alerts when approaching budget limits
 * or detecting unusual usage patterns.
 */

import { prisma } from '@/lib/db';
import { formatCost } from './costCalculator';

export interface BudgetAlert {
  level: 'info' | 'warning' | 'critical';
  threshold: number; // percentage
  currentSpend: number; // in cents
  budgetLimit: number; // in cents
  percentUsed: number;
  message: string;
}

export interface UsageAnomaly {
  type: 'spike' | 'unusual_pattern' | 'high_cost';
  severity: 'low' | 'medium' | 'high';
  description: string;
  currentValue: number;
  normalValue: number;
  difference: number;
}

/**
 * Check if user has exceeded budget thresholds
 */
export async function checkBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
  const alerts: BudgetAlert[] = [];

  // Get user's budget settings
  const budget = await prisma.budget.findUnique({
    where: { userId },
  });

  if (!budget) {
    // No budget set, create default
    await prisma.budget.create({
      data: { userId },
    });
    return alerts;
  }

  // Get current month's spending
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const usage = await prisma.tokenUsage.aggregate({
    where: {
      userId,
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    _sum: {
      estimatedCostCents: true,
    },
  });

  const currentSpend = usage._sum.estimatedCostCents || 0;
  const budgetLimit = budget.monthlyLimitCents;
  const percentUsed = (currentSpend / budgetLimit) * 100;

  // Check each threshold
  const thresholds = [
    { level: 'info' as const, threshold: budget.alertThreshold1 },
    { level: 'warning' as const, threshold: budget.alertThreshold2 },
    { level: 'critical' as const, threshold: budget.alertThreshold3 },
  ];

  for (const { level, threshold } of thresholds) {
    if (percentUsed >= threshold) {
      alerts.push({
        level,
        threshold,
        currentSpend,
        budgetLimit,
        percentUsed,
        message: `You've used ${percentUsed.toFixed(1)}% of your monthly budget (${formatCost(currentSpend)} of ${formatCost(budgetLimit)})`,
      });
    }
  }

  return alerts;
}

/**
 * Detect unusual usage patterns
 */
export async function detectUsageAnomalies(userId: string): Promise<UsageAnomaly[]> {
  const anomalies: UsageAnomaly[] = [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const lastWeekStart = new Date(todayStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  // Get today's usage
  const todayUsage = await prisma.tokenUsage.aggregate({
    where: {
      userId,
      createdAt: { gte: todayStart },
    },
    _sum: {
      totalTokens: true,
      estimatedCostCents: true,
    },
    _count: true,
  });

  // Get average daily usage from last week
  const lastWeekUsage = await prisma.tokenUsage.aggregate({
    where: {
      userId,
      createdAt: {
        gte: lastWeekStart,
        lt: todayStart,
      },
    },
    _sum: {
      totalTokens: true,
      estimatedCostCents: true,
    },
    _count: true,
  });

  const daysInPeriod = 7;
  const avgDailyTokens = (lastWeekUsage._sum.totalTokens || 0) / daysInPeriod;
  const avgDailyCost = (lastWeekUsage._sum.estimatedCostCents || 0) / daysInPeriod;
  const avgDailyCalls = (lastWeekUsage._count || 0) / daysInPeriod;

  const todayTokens = todayUsage._sum.totalTokens || 0;
  const todayCost = todayUsage._sum.estimatedCostCents || 0;
  const todayCalls = todayUsage._count || 0;

  // Check for token usage spike (>2x average)
  if (avgDailyTokens > 0 && todayTokens > avgDailyTokens * 2) {
    const difference = ((todayTokens - avgDailyTokens) / avgDailyTokens) * 100;
    anomalies.push({
      type: 'spike',
      severity: difference > 300 ? 'high' : 'medium',
      description: `Token usage is ${difference.toFixed(0)}% higher than your weekly average`,
      currentValue: todayTokens,
      normalValue: avgDailyTokens,
      difference,
    });
  }

  // Check for cost spike (>2x average)
  if (avgDailyCost > 0 && todayCost > avgDailyCost * 2) {
    const difference = ((todayCost - avgDailyCost) / avgDailyCost) * 100;
    anomalies.push({
      type: 'high_cost',
      severity: difference > 300 ? 'high' : 'medium',
      description: `Daily cost is ${difference.toFixed(0)}% higher than your weekly average (${formatCost(todayCost)} vs ${formatCost(avgDailyCost)})`,
      currentValue: todayCost,
      normalValue: avgDailyCost,
      difference,
    });
  }

  // Check for unusual call pattern (>3x average)
  if (avgDailyCalls > 0 && todayCalls > avgDailyCalls * 3) {
    const difference = ((todayCalls - avgDailyCalls) / avgDailyCalls) * 100;
    anomalies.push({
      type: 'unusual_pattern',
      severity: difference > 500 ? 'high' : 'low',
      description: `API call volume is ${difference.toFixed(0)}% higher than usual (${todayCalls} vs ${avgDailyCalls.toFixed(0)} avg)`,
      currentValue: todayCalls,
      normalValue: avgDailyCalls,
      difference,
    });
  }

  return anomalies;
}

/**
 * Get all alerts for a user
 */
export async function getUserAlerts(userId: string) {
  const [budgetAlerts, anomalies] = await Promise.all([
    checkBudgetAlerts(userId),
    detectUsageAnomalies(userId),
  ]);

  return {
    budgetAlerts,
    anomalies,
    hasAlerts: budgetAlerts.length > 0 || anomalies.length > 0,
  };
}

/**
 * Update user's budget settings
 */
export async function updateBudget(
  userId: string,
  settings: {
    monthlyLimitCents?: number;
    alertThreshold1?: number;
    alertThreshold2?: number;
    alertThreshold3?: number;
  }
) {
  return await prisma.budget.upsert({
    where: { userId },
    update: settings,
    create: {
      userId,
      ...settings,
    },
  });
}

/**
 * Get current month's budget status
 */
export async function getBudgetStatus(userId: string) {
  const budget = await prisma.budget.findUnique({
    where: { userId },
  });

  if (!budget) {
    return null;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const usage = await prisma.tokenUsage.aggregate({
    where: {
      userId,
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    _sum: {
      estimatedCostCents: true,
    },
  });

  const spent = usage._sum.estimatedCostCents || 0;
  const limit = budget.monthlyLimitCents;
  const remaining = Math.max(0, limit - spent);
  const percentUsed = (spent / limit) * 100;

  return {
    spent,
    limit,
    remaining,
    percentUsed,
    isOverBudget: spent > limit,
    monthStart,
    monthEnd,
  };
}
