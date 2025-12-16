/**
 * Tool Usage Analytics
 *
 * Tracks tool usage patterns to optimize dynamic loading.
 * Provides insights into:
 * - Which tools are actually used vs loaded
 * - Usage frequency per tool
 * - Token waste from unused tools
 * - Per-user and per-agent patterns
 */

import { prisma } from '@/lib/db';

export interface ToolUsageStats {
  toolName: string;
  usageCount: number;
  lastUsed?: Date;
  firstUsed?: Date;
  avgExecutionTime?: number;
  successRate?: number;
}

export interface UsageAnalytics {
  totalTools: number;
  usedTools: number;
  unusedTools: number;
  totalExecutions: number;
  topTools: Array<{
    name: string;
    count: number;
    lastUsed: Date;
  }>;
  rareTools: Array<{
    name: string;
    count: number;
  }>;
  tokenWaste: {
    unusedToolTokens: number;
    percentageWaste: number;
  };
}

/**
 * Record a tool execution
 */
export async function recordToolUsage(
  toolName: string,
  userId?: string,
  agentId?: string,
  executionTimeMs?: number,
  success: boolean = true
): Promise<void> {
  try {
    // Update or create tool usage stat
    const existing = await prisma.toolUsageStat.findUnique({
      where: {
        userId_toolName: {
          userId: userId || 'anonymous',
          toolName,
        },
      },
    });

    if (existing) {
      // Calculate new averages
      const newCount = existing.usageCount + 1;
      const newAvgTime = executionTimeMs
        ? (existing.avgExecutionTimeMs * existing.usageCount + executionTimeMs) / newCount
        : existing.avgExecutionTimeMs;
      const newSuccessCount = existing.successCount + (success ? 1 : 0);

      await prisma.toolUsageStat.update({
        where: { id: existing.id },
        data: {
          usageCount: newCount,
          lastUsed: new Date(),
          avgExecutionTimeMs: newAvgTime,
          successCount: newSuccessCount,
          successRate: (newSuccessCount / newCount) * 100,
        },
      });
    } else {
      // Create new stat
      await prisma.toolUsageStat.create({
        data: {
          userId: userId || 'anonymous',
          toolName,
          agentId,
          usageCount: 1,
          firstUsed: new Date(),
          lastUsed: new Date(),
          avgExecutionTimeMs: executionTimeMs || 0,
          successCount: success ? 1 : 0,
          successRate: success ? 100 : 0,
        },
      });
    }
  } catch (error) {
    console.error('[Analytics] Failed to record tool usage:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Get tool usage stats for a specific user and tool
 */
export async function getToolUsageStats(
  userId: string,
  toolName: string
): Promise<ToolUsageStats> {
  try {
    const stat = await prisma.toolUsageStat.findUnique({
      where: {
        userId_toolName: {
          userId,
          toolName,
        },
      },
    });

    if (!stat) {
      return {
        toolName,
        usageCount: 0,
      };
    }

    return {
      toolName: stat.toolName,
      usageCount: stat.usageCount,
      lastUsed: stat.lastUsed,
      firstUsed: stat.firstUsed,
      avgExecutionTime: stat.avgExecutionTimeMs,
      successRate: stat.successRate,
    };
  } catch (error) {
    console.error('[Analytics] Failed to get tool usage stats:', error);
    return {
      toolName,
      usageCount: 0,
    };
  }
}

/**
 * Get all tool usage stats for a user
 */
export async function getUserToolStats(userId: string): Promise<ToolUsageStats[]> {
  try {
    const stats = await prisma.toolUsageStat.findMany({
      where: { userId },
      orderBy: { usageCount: 'desc' },
    });

    return stats.map(stat => ({
      toolName: stat.toolName,
      usageCount: stat.usageCount,
      lastUsed: stat.lastUsed,
      firstUsed: stat.firstUsed,
      avgExecutionTime: stat.avgExecutionTimeMs,
      successRate: stat.successRate,
    }));
  } catch (error) {
    console.error('[Analytics] Failed to get user tool stats:', error);
    return [];
  }
}

/**
 * Get comprehensive usage analytics
 */
export async function getUsageAnalytics(
  userId?: string,
  agentId?: string
): Promise<UsageAnalytics> {
  try {
    const where = {
      ...(userId && { userId }),
      ...(agentId && { agentId }),
    };

    const stats = await prisma.toolUsageStat.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });

    const totalTools = stats.length;
    const usedTools = stats.filter(s => s.usageCount > 0).length;
    const unusedTools = totalTools - usedTools;
    const totalExecutions = stats.reduce((sum, s) => sum + s.usageCount, 0);

    // Top 10 most used tools
    const topTools = stats.slice(0, 10).map(s => ({
      name: s.toolName,
      count: s.usageCount,
      lastUsed: s.lastUsed,
    }));

    // Tools used only once or twice (rare)
    const rareTools = stats
      .filter(s => s.usageCount > 0 && s.usageCount <= 2)
      .map(s => ({
        name: s.toolName,
        count: s.usageCount,
      }));

    // Estimate token waste from unused tools
    // Assuming avg 150 tokens per tool definition
    const avgTokensPerTool = 150;
    const unusedToolTokens = unusedTools * avgTokensPerTool;
    const totalPossibleTokens = totalTools * avgTokensPerTool;
    const percentageWaste = totalPossibleTokens > 0
      ? (unusedToolTokens / totalPossibleTokens) * 100
      : 0;

    return {
      totalTools,
      usedTools,
      unusedTools,
      totalExecutions,
      topTools,
      rareTools,
      tokenWaste: {
        unusedToolTokens,
        percentageWaste,
      },
    };
  } catch (error) {
    console.error('[Analytics] Failed to get usage analytics:', error);
    return {
      totalTools: 0,
      usedTools: 0,
      unusedTools: 0,
      totalExecutions: 0,
      topTools: [],
      rareTools: [],
      tokenWaste: {
        unusedToolTokens: 0,
        percentageWaste: 0,
      },
    };
  }
}

/**
 * Get tools that should be lazy-loaded (rarely used)
 */
export async function getRareTools(
  userId?: string,
  threshold: number = 2
): Promise<string[]> {
  try {
    const where = userId ? { userId } : {};

    const stats = await prisma.toolUsageStat.findMany({
      where: {
        ...where,
        usageCount: {
          lte: threshold,
        },
      },
    });

    return stats.map(s => s.toolName);
  } catch (error) {
    console.error('[Analytics] Failed to get rare tools:', error);
    return [];
  }
}

/**
 * Get frequently used tools (high priority for loading)
 */
export async function getFrequentTools(
  userId?: string,
  limit: number = 20
): Promise<string[]> {
  try {
    const where = userId ? { userId } : {};

    const stats = await prisma.toolUsageStat.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: limit,
    });

    return stats.map(s => s.toolName);
  } catch (error) {
    console.error('[Analytics] Failed to get frequent tools:', error);
    return [];
  }
}

/**
 * Clear old analytics data (cleanup)
 */
export async function cleanupOldAnalytics(daysOld: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.toolUsageStat.deleteMany({
      where: {
        lastUsed: {
          lt: cutoffDate,
        },
        usageCount: {
          lte: 1, // Only delete rarely used old entries
        },
      },
    });

    console.log(`[Analytics] Cleaned up ${result.count} old tool usage records`);
    return result.count;
  } catch (error) {
    console.error('[Analytics] Failed to cleanup old analytics:', error);
    return 0;
  }
}

/**
 * Export analytics data for reporting
 */
export async function exportAnalytics(
  userId?: string,
  agentId?: string
): Promise<string> {
  const analytics = await getUsageAnalytics(userId, agentId);
  const stats = userId
    ? await getUserToolStats(userId)
    : await prisma.toolUsageStat.findMany({
        where: agentId ? { agentId } : {},
        orderBy: { usageCount: 'desc' },
      });

  const report = {
    generatedAt: new Date().toISOString(),
    filters: { userId, agentId },
    summary: analytics,
    detailedStats: stats,
  };

  return JSON.stringify(report, null, 2);
}
