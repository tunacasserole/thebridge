'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CoralogixAlertsResponse } from '@/lib/coralogix/types';

interface UseCoralogixAlertsOptions {
  status?: string[];
  limit?: number;
  offset?: number;
  autoRefreshMs?: number;
}

interface UseCoralogixAlertsResult {
  data: CoralogixAlertsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

export function useCoralogixAlerts(
  options: UseCoralogixAlertsOptions = {},
  refreshTrigger?: number
): UseCoralogixAlertsResult {
  const [data, setData] = useState<CoralogixAlertsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const { status, limit, offset, autoRefreshMs } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (status) params.set('status', status.join(','));
      if (limit) params.set('limit', limit.toString());
      if (offset) params.set('offset', offset.toString());

      const response = await fetch(`/api/coralogix/alerts?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch Coralogix alerts');
      }

      setData(result);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching Coralogix alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [status, limit, offset]);

  // Initial fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh if interval provided
  useEffect(() => {
    if (!autoRefreshMs) return;

    const interval = setInterval(fetchData, autoRefreshMs);
    return () => clearInterval(interval);
  }, [autoRefreshMs, fetchData]);

  // External refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    lastFetched,
  };
}
