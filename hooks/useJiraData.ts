'use client';

import { useMemo } from 'react';
import { JiraDashboardData } from '@/lib/jira';
import { useDataFetch } from './useDataFetch';
import { REFRESH_INTERVALS } from '@/lib/utils';

interface UseJiraDataResult {
  data: JiraDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching Jira dashboard data
 * @param refreshInterval Auto-refresh interval in ms (default: 10 minutes)
 * @param refreshTrigger External trigger to force refetch
 * @returns Jira data state and refetch function
 */
export function useJiraData(
  refreshInterval: number = REFRESH_INTERVALS.SLOW,
  refreshTrigger: number = 0
): UseJiraDataResult {
  const { data, loading, error, refetch } = useDataFetch<JiraDashboardData>(
    '/api/jira',
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
