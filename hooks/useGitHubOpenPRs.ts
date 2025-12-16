// Custom hook to fetch open GitHub PRs from multiple repositories
import { useState, useEffect, useCallback } from 'react';
import type { GitHubOpenPRsDashboardData } from '@/lib/github';

interface UseGitHubOpenPRsResult {
  data: GitHubOpenPRsDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGitHubOpenPRs(
  refreshInterval: number = 0,
  refreshTrigger: number = 0
): UseGitHubOpenPRsResult {
  const [data, setData] = useState<GitHubOpenPRsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/github/open-prs');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch open PRs');
      }

      // Convert date strings back to Date objects
      const processedData: GitHubOpenPRsDashboardData = {
        ...result.data,
        openPRs: result.data.openPRs.map((pr: any) => ({
          ...pr,
          createdAt: new Date(pr.createdAt),
          updatedAt: new Date(pr.updatedAt),
        })),
        summary: {
          ...result.data.summary,
          lastUpdated: new Date(result.data.summary.lastUpdated),
        },
      };

      setData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('[useGitHubOpenPRs] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchData, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}
