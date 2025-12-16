// React Hook for Slack Data

import { useState, useEffect, useCallback } from 'react';
import type { SlackDashboardData } from '@/lib/slack';

interface UseSlackDataOptions {
  refreshInterval?: number;
  refreshTrigger?: number;
}

export function useSlackData(
  refreshInterval?: number,
  refreshTrigger?: number
) {
  const [data, setData] = useState<SlackDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/slack');
      const result: SlackDashboardData = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch Slack data');
      }

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Slack data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh trigger
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger, fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
