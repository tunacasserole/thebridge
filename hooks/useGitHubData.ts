'use client';

import { useMemo } from 'react';
import { GitHubData } from '@/lib/github';
import { useDataFetch } from './useDataFetch';

const REFRESH_INTERVALS = {
  STANDARD: 5 * 60 * 1000, // 5 minutes
};

interface UseGitHubDataResult {
  data: GitHubData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching GitHub repository data
 * @param refreshInterval Auto-refresh interval in ms (default: 5 minutes)
 * @param refreshTrigger External trigger to force refetch
 * @returns GitHub data state and refetch function
 */
export function useGitHubData(
  refreshInterval: number = REFRESH_INTERVALS.STANDARD,
  refreshTrigger: number = 0
): UseGitHubDataResult {
  const { data, loading, error, refetch } = useDataFetch<GitHubData>(
    '/api/github',
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
