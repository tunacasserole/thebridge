/**
 * Cache Analytics and Monitoring
 *
 * Tracks cache performance metrics, health indicators,
 * and provides insights for optimization.
 */

import { CacheStats, CacheLevel, CacheAnalytics } from './types';
import { formatBytes, formatPercentage } from './utils';

/**
 * Cache health status
 */
export enum CacheHealth {
  EXCELLENT = 'excellent', // >90% hit rate
  GOOD = 'good', // 70-90% hit rate
  FAIR = 'fair', // 50-70% hit rate
  POOR = 'poor', // <50% hit rate
}

/**
 * Cache health indicators
 */
export interface CacheHealthIndicators {
  overall: CacheHealth;
  hitRate: number;
  memoryUsage: number;
  memoryPressure: number; // 0-1 scale
  evictionRate: number;
  tokensSaved: number;
  recommendations: string[];
}

/**
 * Time-series data point
 */
interface TimeSeriesPoint {
  timestamp: number;
  hitRate: number;
  hits: number;
  misses: number;
  size: number;
  memoryUsage?: number;
  tokensSaved?: number;
}

/**
 * Cache analytics tracker
 */
export class CacheAnalyticsTracker {
  private timeSeries: TimeSeriesPoint[] = [];
  private maxDataPoints = 1000;
  private analyticsEvents: CacheAnalytics[] = [];
  private maxEvents = 10000;

  /**
   * Record a snapshot of cache stats
   */
  recordSnapshot(stats: CacheStats): void {
    const point: TimeSeriesPoint = {
      timestamp: Date.now(),
      hitRate: stats.hitRate,
      hits: stats.hits,
      misses: stats.misses,
      size: stats.size,
      memoryUsage: stats.memoryUsage,
      tokensSaved: stats.tokensSaved,
    };

    this.timeSeries.push(point);

    // Keep only recent data points
    if (this.timeSeries.length > this.maxDataPoints) {
      this.timeSeries = this.timeSeries.slice(-this.maxDataPoints);
    }
  }

  /**
   * Record an analytics event
   */
  recordEvent(event: CacheAnalytics): void {
    this.analyticsEvents.push(event);

    // Keep only recent events
    if (this.analyticsEvents.length > this.maxEvents) {
      this.analyticsEvents = this.analyticsEvents.slice(-this.maxEvents);
    }
  }

  /**
   * Get cache health indicators
   */
  getHealthIndicators(stats: CacheStats, config?: {
    maxMemory?: number;
    targetHitRate?: number;
  }): CacheHealthIndicators {
    const targetHitRate = config?.targetHitRate ?? 0.7;
    const maxMemory = config?.maxMemory ?? 100 * 1024 * 1024; // 100MB

    // Calculate health status
    let overall: CacheHealth;
    if (stats.hitRate >= 0.9) {
      overall = CacheHealth.EXCELLENT;
    } else if (stats.hitRate >= 0.7) {
      overall = CacheHealth.GOOD;
    } else if (stats.hitRate >= 0.5) {
      overall = CacheHealth.FAIR;
    } else {
      overall = CacheHealth.POOR;
    }

    // Calculate memory pressure
    const memoryUsage = stats.memoryUsage ?? 0;
    const memoryPressure = maxMemory > 0 ? memoryUsage / maxMemory : 0;

    // Calculate eviction rate
    const total = stats.hits + stats.misses + stats.sets;
    const evictionRate = total > 0 ? stats.evictions / total : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(stats, {
      targetHitRate,
      maxMemory,
      memoryPressure,
      evictionRate,
    });

    return {
      overall,
      hitRate: stats.hitRate,
      memoryUsage,
      memoryPressure,
      evictionRate,
      tokensSaved: stats.tokensSaved || 0,
      recommendations,
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    stats: CacheStats,
    metrics: {
      targetHitRate: number;
      maxMemory: number;
      memoryPressure: number;
      evictionRate: number;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Hit rate recommendations
    if (stats.hitRate < metrics.targetHitRate) {
      recommendations.push(
        `Hit rate (${formatPercentage(stats.hitRate)}) is below target (${formatPercentage(metrics.targetHitRate)}). Consider increasing TTL or cache size.`
      );
    }

    // Memory recommendations
    if (metrics.memoryPressure > 0.8) {
      recommendations.push(
        `High memory pressure (${formatPercentage(metrics.memoryPressure)}). Consider increasing max memory or enabling compression.`
      );
    }

    // Eviction recommendations
    if (metrics.evictionRate > 0.1) {
      recommendations.push(
        `High eviction rate (${formatPercentage(metrics.evictionRate)}). Consider increasing cache size or adjusting TTL strategy.`
      );
    }

    // Size recommendations
    if (stats.size === 0) {
      recommendations.push('Cache is empty. Consider pre-warming with common queries.');
    }

    // Token savings
    const tokensSaved = stats.tokensSaved || 0;
    if (tokensSaved > 10000) {
      recommendations.push(
        `Cache has saved ${tokensSaved.toLocaleString()} tokens! Keep it enabled.`
      );
    }

    return recommendations;
  }

  /**
   * Get time-series data
   */
  getTimeSeries(options?: {
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): TimeSeriesPoint[] {
    let data = [...this.timeSeries];

    // Filter by time range
    if (options?.startTime) {
      data = data.filter((p) => p.timestamp >= options.startTime!);
    }
    if (options?.endTime) {
      data = data.filter((p) => p.timestamp <= options.endTime!);
    }

    // Limit results
    if (options?.limit && data.length > options.limit) {
      data = data.slice(-options.limit);
    }

    return data;
  }

  /**
   * Get analytics events
   */
  getEvents(options?: {
    level?: CacheLevel;
    operation?: CacheAnalytics['operation'];
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): CacheAnalytics[] {
    let events = [...this.analyticsEvents];

    // Filter by level
    if (options?.level) {
      events = events.filter((e) => e.level === options.level);
    }

    // Filter by operation
    if (options?.operation) {
      events = events.filter((e) => e.operation === options.operation);
    }

    // Filter by time range
    if (options?.startTime) {
      events = events.filter((e) => e.timestamp >= options.startTime!);
    }
    if (options?.endTime) {
      events = events.filter((e) => e.timestamp <= options.endTime!);
    }

    // Limit results
    if (options?.limit && events.length > options.limit) {
      events = events.slice(-options.limit);
    }

    return events;
  }

  /**
   * Calculate statistics for a time period
   */
  getPeriodStats(startTime: number, endTime: number): {
    avgHitRate: number;
    totalHits: number;
    totalMisses: number;
    avgSize: number;
    avgMemoryUsage: number;
    totalTokensSaved: number;
  } {
    const points = this.getTimeSeries({ startTime, endTime });

    if (points.length === 0) {
      return {
        avgHitRate: 0,
        totalHits: 0,
        totalMisses: 0,
        avgSize: 0,
        avgMemoryUsage: 0,
        totalTokensSaved: 0,
      };
    }

    const sum = points.reduce(
      (acc, p) => ({
        hitRate: acc.hitRate + p.hitRate,
        hits: acc.hits + p.hits,
        misses: acc.misses + p.misses,
        size: acc.size + p.size,
        memoryUsage: acc.memoryUsage + (p.memoryUsage || 0),
        tokensSaved: acc.tokensSaved + (p.tokensSaved || 0),
      }),
      { hitRate: 0, hits: 0, misses: 0, size: 0, memoryUsage: 0, tokensSaved: 0 }
    );

    return {
      avgHitRate: sum.hitRate / points.length,
      totalHits: sum.hits,
      totalMisses: sum.misses,
      avgSize: sum.size / points.length,
      avgMemoryUsage: sum.memoryUsage / points.length,
      totalTokensSaved: sum.tokensSaved,
    };
  }

  /**
   * Get top cache keys by hits
   */
  getTopKeys(limit = 10): Array<{ key: string; hits: number; tokensSaved?: number }> {
    const keyStats = new Map<string, { hits: number; tokensSaved: number }>();

    // Aggregate hits by key
    for (const event of this.analyticsEvents) {
      if (event.operation === 'hit') {
        const current = keyStats.get(event.key) || { hits: 0, tokensSaved: 0 };
        keyStats.set(event.key, {
          hits: current.hits + 1,
          tokensSaved: current.tokensSaved + (event.tokensSaved || 0),
        });
      }
    }

    // Sort by hits and limit
    return Array.from(keyStats.entries())
      .map(([key, stats]) => ({ key, ...stats }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }

  /**
   * Generate summary report
   */
  generateReport(stats: CacheStats): string {
    const health = this.getHealthIndicators(stats);
    const topKeys = this.getTopKeys(5);

    let report = '=== Cache Performance Report ===\n\n';

    // Health status
    report += `Overall Health: ${health.overall.toUpperCase()}\n`;
    report += `Hit Rate: ${formatPercentage(health.hitRate)}\n`;
    report += `Memory Usage: ${formatBytes(health.memoryUsage)}\n`;
    report += `Memory Pressure: ${formatPercentage(health.memoryPressure)}\n`;
    report += `Eviction Rate: ${formatPercentage(health.evictionRate)}\n`;
    report += `Tokens Saved: ${health.tokensSaved.toLocaleString()}\n\n`;

    // Statistics
    report += '--- Statistics ---\n';
    report += `Total Hits: ${stats.hits.toLocaleString()}\n`;
    report += `Total Misses: ${stats.misses.toLocaleString()}\n`;
    report += `Total Sets: ${stats.sets.toLocaleString()}\n`;
    report += `Total Evictions: ${stats.evictions.toLocaleString()}\n`;
    report += `Cache Size: ${stats.size.toLocaleString()} entries\n\n`;

    // Top keys
    if (topKeys.length > 0) {
      report += '--- Top Cache Keys ---\n';
      for (const key of topKeys) {
        report += `${key.key}: ${key.hits} hits`;
        if (key.tokensSaved && key.tokensSaved > 0) {
          report += ` (saved ${key.tokensSaved} tokens)`;
        }
        report += '\n';
      }
      report += '\n';
    }

    // Recommendations
    if (health.recommendations.length > 0) {
      report += '--- Recommendations ---\n';
      for (const rec of health.recommendations) {
        report += `• ${rec}\n`;
      }
      report += '\n';
    }

    return report;
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.timeSeries = [];
    this.analyticsEvents = [];
  }
}

// Global singleton instance
let globalAnalytics: CacheAnalyticsTracker | null = null;

/**
 * Get global analytics tracker
 */
export function getCacheAnalytics(): CacheAnalyticsTracker {
  if (!globalAnalytics) {
    globalAnalytics = new CacheAnalyticsTracker();
  }
  return globalAnalytics;
}

/**
 * Start periodic analytics recording
 */
export function startAnalyticsRecording(
  getStats: () => CacheStats,
  intervalMs = 60000 // 1 minute
): NodeJS.Timeout {
  const analytics = getCacheAnalytics();

  return setInterval(() => {
    const stats = getStats();
    analytics.recordSnapshot(stats);
  }, intervalMs);
}
