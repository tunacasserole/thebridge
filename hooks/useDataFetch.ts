'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, APIError } from '@/lib/api';

export interface DataFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface DataFetchOptions {
  /**
   * Auto-refresh interval in milliseconds (0 to disable)
   */
  refreshInterval?: number;
  /**
   * Whether to fetch on mount
   */
  fetchOnMount?: boolean;
  /**
   * External trigger to force refetch
   */
  refreshTrigger?: number;
}

/**
 * Generic data fetching hook with auto-refresh and error handling
 * @param endpoint API endpoint to fetch from
 * @param options Configuration options
 * @returns Data fetch state and refetch function
 */
export function useDataFetch<T>(
  endpoint: string,
  options: DataFetchOptions = {}
): DataFetchState<T> {
  const {
    refreshInterval = 0,
    fetchOnMount = true,
    refreshTrigger = 0,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted
  const isMounted = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set mounted flag
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiGet<{ success: boolean; data?: T; error?: string }>(
        endpoint
      );

      if (!isMounted.current) return;

      if (response.success && response.data) {
        setData(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch data');
        setData(null);
      }
    } catch (err) {
      if (!isMounted.current) return;

      const errorMessage =
        err instanceof APIError
          ? `API Error (${err.status}): ${err.message}`
          : err instanceof Error
          ? err.message
          : 'An unknown error occurred';

      setError(errorMessage);
      setData(null);
      console.error(`Error fetching ${endpoint}:`, err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [endpoint]);

  // Refetch function (exposed to consumers)
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchOnMount, fetchData]);

  // Handle external refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger, fetchData]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [refreshInterval, fetchData]);

  return { data, loading, error, refetch };
}
