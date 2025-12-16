// Hook for fetching Metabase data

import { useState, useEffect, useCallback } from 'react';
import { MetabaseStats } from '@/lib/metabase/types';

interface UseMetabaseDataResult {
  data: MetabaseStats | null;
  loading: boolean;
  error: string | null;
  timeout: boolean;
  configMissing: boolean;
  refetch: () => Promise<void>;
}

export function useMetabaseData(autoRefresh = false, interval = 30000): UseMetabaseDataResult {
  const [data, setData] = useState<MetabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeout, setTimeout] = useState(false);
  const [configMissing, setConfigMissing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setTimeout(false);
      setConfigMissing(false);

      const response = await fetch('/api/metabase');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch Metabase data');
        if (result.timeout) {
          setTimeout(true);
        }
        if (result.configMissing) {
          setConfigMissing(true);
        }
      }
    } catch (err) {
      console.error('Metabase data fetch error:', err);
      setError('Network error fetching Metabase data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchData, interval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, interval, fetchData]);

  return {
    data,
    loading,
    error,
    timeout,
    configMissing,
    refetch: fetchData,
  };
}
