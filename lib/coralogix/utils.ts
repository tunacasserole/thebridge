// Coralogix utility functions

import type { CoralogixAlert, CoralogixSLO } from './types';

/**
 * Get badge color based on alert severity
 */
export function getSeverityColor(severity: CoralogixAlert['severity']): string {
  const colorMap = {
    critical: 'red',
    error: 'orange',
    warning: 'yellow',
    info: 'blue',
  };
  return colorMap[severity] || 'gray';
}

/**
 * Get SLO status color
 */
export function getSLOStatusColor(status: CoralogixSLO['status']): string {
  const colorMap = {
    healthy: 'green',
    at_risk: 'yellow',
    breached: 'red',
  };
  return colorMap[status] || 'gray';
}

/**
 * Format time ago (e.g., "5 min ago", "2 hrs ago")
 */
export function formatTimeAgo(timestamp: string): string {
  // Handle invalid timestamps
  if (!timestamp) return 'unknown';

  const now = new Date();
  const then = new Date(timestamp);

  // Check if date is valid
  if (isNaN(then.getTime())) {
    console.warn('Invalid timestamp:', timestamp);
    return 'unknown';
  }

  const diffMs = now.getTime() - then.getTime();

  // Handle future dates or negative differences
  if (diffMs < 0) return 'just now';

  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hr ago';
  if (diffHours < 24) return `${diffHours} hrs ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format bytes to GB
 */
export function formatBytes(bytes: number, decimals = 2): string {
  const gb = bytes / (1024 ** 3);
  return `${gb.toFixed(decimals)} GB`;
}

/**
 * Format data usage
 */
export function formatDataUsage(gb: number, decimals = 1): string {
  return `${gb.toFixed(decimals)} GB`;
}

/**
 * Calculate error budget percentage remaining
 */
export function calculateErrorBudgetPercentage(slo: CoralogixSLO): number {
  return (slo.errorBudget.remaining / slo.errorBudget.total) * 100;
}

/**
 * Get date range for today
 */
export function getTodayDateRange(): { from: string; to: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    from: startOfDay.toISOString(),
    to: now.toISOString(),
  };
}

/**
 * Group alerts by severity
 */
export function groupAlertsBySeverity(alerts: CoralogixAlert[]): Record<string, number> {
  return alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Filter alerts by status
 */
export function filterAlertsByStatus(
  alerts: CoralogixAlert[],
  status: CoralogixAlert['status'][]
): CoralogixAlert[] {
  return alerts.filter((alert) => status.includes(alert.status));
}

/**
 * Sort alerts by timestamp (most recent first)
 */
export function sortAlertsByTime(alerts: CoralogixAlert[]): CoralogixAlert[] {
  return [...alerts].sort((a, b) => {
    const timeA = new Date(a.startsAt).getTime();
    const timeB = new Date(b.startsAt).getTime();
    return timeB - timeA; // Most recent first
  });
}
