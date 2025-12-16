'use client';

import { useMemo } from 'react';
import { GitHubMultiRepoDashboardData } from '@/lib/github';
import { useDataFetch } from './useDataFetch';

const REFRESH_INTERVALS = {
  STANDARD: 5 * 60 * 1000, // 5 minutes
};

interface UseGitHubMergedPRsResult {
  data: GitHubMultiRepoDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching GitHub merged PRs from multiple repositories
 * @param refreshInterval Auto-refresh interval in ms (default: 5 minutes)
 * @param refreshTrigger External trigger to force refetch
 * @returns GitHub merged PRs data state and refetch function
 */
export function useGitHubMergedPRs(
  refreshInterval: number = REFRESH_INTERVALS.STANDARD,
  refreshTrigger: number = 0
): UseGitHubMergedPRsResult {
  const { data, loading, error, refetch } = useDataFetch<GitHubMultiRepoDashboardData>(
    '/api/github/merged-prs',
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
