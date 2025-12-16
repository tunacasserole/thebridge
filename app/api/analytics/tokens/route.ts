/**
 * Token Usage Analytics API
 *
 * Provides endpoints for querying token usage data, cost analytics,
 * and usage trends.
 */

import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCost, projectMonthlyCost, formatTokenCount } from '@/lib/analytics/costCalculator';
import { getUserAlerts, getBudgetStatus } from '@/lib/analytics/alerts';

/**
 * GET /api/analytics/tokens
 *
 * Query token usage data with filters:
 * - ?range=day|week|month|year
 * - ?from=YYYY-MM-DD
 * - ?to=YYYY-MM-DD
 * - ?model=sonnet|opus|haiku
 * - ?aggregation=daily|weekly|monthly
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const modelFilter = searchParams.get('model');
    const aggregation = searchParams.get('aggregation') || 'daily';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      switch (range) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'month':
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
      }
    }

    // Build query filters
    const where: any = {
      userId: user.id,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (modelFilter) {
      where.modelType = modelFilter;
    }

    // Get raw usage data
    const usageData = await prisma.tokenUsage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        model: true,
        modelType: true,
        inputTokens: true,
        outputTokens: true,
        thinkingTokens: true,
        totalTokens: true,
        estimatedCostCents: true,
        conversationId: true,
        agentSlug: true,
        toolsUsed: true,
        responseTimeMs: true,
        createdAt: true,
      },
    });

    // Aggregate by time period
    const aggregated = aggregateByPeriod(usageData, aggregation);

    // Calculate summary statistics
    const totalTokens = usageData.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalCost = usageData.reduce((sum, u) => sum + u.estimatedCostCents, 0);
    const totalCalls = usageData.length;

    const avgTokensPerCall = totalCalls > 0 ? Math.round(totalTokens / totalCalls) : 0;
    const avgCostPerCall = totalCalls > 0 ? Math.round(totalCost / totalCalls) : 0;

    // Model breakdown
    const modelBreakdown = usageData.reduce((acc, u) => {
      if (!acc[u.modelType]) {
        acc[u.modelType] = { calls: 0, tokens: 0, cost: 0 };
      }
      acc[u.modelType].calls++;
      acc[u.modelType].tokens += u.totalTokens;
      acc[u.modelType].cost += u.estimatedCostCents;
      return acc;
    }, {} as Record<string, { calls: number; tokens: number; cost: number }>);

    // Get monthly projection
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const projection = projectMonthlyCost({
      totalCalls,
      totalTokens,
      totalCostCents: totalCost,
      periodDays,
    });

    // Get alerts and budget status
    const [alerts, budgetStatus] = await Promise.all([
      getUserAlerts(user.id),
      getBudgetStatus(user.id),
    ]);

    return Response.json({
      summary: {
        totalCalls,
        totalTokens,
        totalCost,
        totalCostFormatted: formatCost(totalCost),
        avgTokensPerCall,
        avgCostPerCall,
        avgCostPerCallFormatted: formatCost(avgCostPerCall),
        periodStart: startDate,
        periodEnd: endDate,
        periodDays,
      },
      modelBreakdown: Object.entries(modelBreakdown).map(([model, stats]) => ({
        model,
        calls: stats.calls,
        tokens: stats.tokens,
        tokensFormatted: formatTokenCount(stats.tokens),
        cost: stats.cost,
        costFormatted: formatCost(stats.cost),
        percentOfCalls: (stats.calls / totalCalls) * 100,
        percentOfCost: totalCost > 0 ? (stats.cost / totalCost) * 100 : 0,
      })),
      projection: {
        monthlyCalls: projection.projectedCalls,
        monthlyTokens: projection.projectedTokens,
        monthlyTokensFormatted: formatTokenCount(projection.projectedTokens),
        monthlyCost: projection.projectedCostCents,
        monthlyCostFormatted: formatCost(projection.projectedCostCents),
        dailyAverage: {
          calls: Math.round(projection.dailyAverage.calls),
          tokens: Math.round(projection.dailyAverage.tokens),
          tokensFormatted: formatTokenCount(Math.round(projection.dailyAverage.tokens)),
          cost: Math.round(projection.dailyAverage.costCents),
          costFormatted: formatCost(Math.round(projection.dailyAverage.costCents)),
        },
      },
      timeSeries: aggregated,
      alerts: alerts.budgetAlerts,
      anomalies: alerts.anomalies,
      budget: budgetStatus ? {
        spent: budgetStatus.spent,
        spentFormatted: formatCost(budgetStatus.spent),
        limit: budgetStatus.limit,
        limitFormatted: formatCost(budgetStatus.limit),
        remaining: budgetStatus.remaining,
        remainingFormatted: formatCost(budgetStatus.remaining),
        percentUsed: budgetStatus.percentUsed,
        isOverBudget: budgetStatus.isOverBudget,
      } : null,
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return Response.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Aggregate usage data by time period
 */
function aggregateByPeriod(
  data: Array<{
    totalTokens: number;
    estimatedCostCents: number;
    createdAt: Date;
  }>,
  period: string
) {
  const grouped = new Map<string, { tokens: number; cost: number; calls: number }>();

  data.forEach((item) => {
    const date = new Date(item.createdAt);
    let key: string;

    switch (period) {
      case 'hourly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'daily':
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
    }

    const existing = grouped.get(key) || { tokens: 0, cost: 0, calls: 0 };
    existing.tokens += item.totalTokens;
    existing.cost += item.estimatedCostCents;
    existing.calls += 1;
    grouped.set(key, existing);
  });

  return Array.from(grouped.entries())
    .map(([date, stats]) => ({
      date,
      tokens: stats.tokens,
      tokensFormatted: formatTokenCount(stats.tokens),
      cost: stats.cost,
      costFormatted: formatCost(stats.cost),
      calls: stats.calls,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
