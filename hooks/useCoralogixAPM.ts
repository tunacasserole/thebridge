'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CoralogixAPMResponse } from '@/lib/coralogix/types';

interface UseCoralogixAPMOptions {
  autoRefreshMs?: number;
}

interface UseCoralogixAPMResult {
  data: CoralogixAPMResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

export function useCoralogixAPM(
  options: UseCoralogixAPMOptions = {},
  refreshTrigger?: number
): UseCoralogixAPMResult {
  const [data, setData] = useState<CoralogixAPMResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const { autoRefreshMs } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/coralogix/apm');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch Coralogix APM services');
      }

      setData(result);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching Coralogix APM:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // No initial fetch - user must click refresh

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
