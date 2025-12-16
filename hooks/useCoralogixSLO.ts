'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CoralogixSLOResponse } from '@/lib/coralogix/types';

interface UseCoralogixSLOOptions {
  autoRefreshMs?: number;
}

interface UseCoralogixSLOResult {
  data: CoralogixSLOResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

export function useCoralogixSLO(
  options: UseCoralogixSLOOptions = {},
  refreshTrigger?: number
): UseCoralogixSLOResult {
  const [data, setData] = useState<CoralogixSLOResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const { autoRefreshMs } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/coralogix/slo');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch Coralogix SLOs');
      }

      setData(result);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching Coralogix SLO:', err);
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
