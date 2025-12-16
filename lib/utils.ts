/**
 * Utility functions
 */

/**
 * Merge class names conditionally
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Refresh intervals for data polling (in milliseconds)
 */
export const REFRESH_INTERVALS = {
  FAST: 30000,      // 30 seconds
  STANDARD: 300000, // 5 minutes
  SLOW: 600000,     // 10 minutes
} as const;
