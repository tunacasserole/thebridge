'use client';

import { useMemo } from 'react';
import { RootlyDashboardData } from '@/lib/rootly';
import { useDataFetch } from './useDataFetch';
import { REFRESH_INTERVALS } from '@/lib/utils';

interface UseRootlyDataResult {
  data: RootlyDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching Rootly dashboard data
 * @param refreshInterval Auto-refresh interval in ms (default: 5 minutes)
 * @param refreshTrigger External trigger to force refetch
 * @returns Rootly data state and refetch function
 */
export function useRootlyData(
  refreshInterval: number = REFRESH_INTERVALS.STANDARD,
  refreshTrigger: number = 0
): UseRootlyDataResult {
  const { data, loading, error, refetch } = useDataFetch<RootlyDashboardData>(
    '/api/rootly',
    {
      refreshInterval,
      refreshTrigger,
      fetchOnMount: true,
    }
  );

  return useMemo(
    () => ({ data, loading, error, refetch }),
    [data, loading, error, refetch]
  );
}
