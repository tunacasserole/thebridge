'use client';

import { useCallback } from 'react';
import { useCoralogixAlerts } from './useCoralogixAlerts';
import { useCoralogixAPM } from './useCoralogixAPM';
import { useCoralogixSLO } from './useCoralogixSLO';
import { useCoralogixUsage } from './useCoralogixUsage';

interface UseCoralogixDashboardOptions {
  autoRefreshMs?: number;
}

/**
 * Combined hook for Coralogix dashboard
 * Fetches all data sources in parallel
 */
export function useCoralogixDashboard(
  options: UseCoralogixDashboardOptions = {},
  refreshTrigger?: number
) {
  const { autoRefreshMs } = options; // No default auto-refresh

  const alerts = useCoralogixAlerts({ autoRefreshMs }, refreshTrigger);
  // APM, SLO, and Usage endpoints are not available on all Coralogix plans
  // Commenting out to prevent 404 errors
  // const apm = useCoralogixAPM({ autoRefreshMs }, refreshTrigger);
  // const slo = useCoralogixSLO({ autoRefreshMs }, refreshTrigger);
  // const usage = useCoralogixUsage({ autoRefreshMs }, refreshTrigger);

  const loading = alerts.loading;
  const error = alerts.error;

  const refetchAll = useCallback(async () => {
    await alerts.refetch();
  }, [alerts]);

  return {
    alerts: {
      data: alerts.data,
      loading: alerts.loading,
      error: alerts.error,
      lastFetched: alerts.lastFetched,
    },
    // APM, SLO, and Usage not available - return empty state
    apm: {
      data: null,
      loading: false,
      error: null,
      lastFetched: null,
    },
    slo: {
      data: null,
      loading: false,
      error: null,
      lastFetched: null,
    },
    usage: {
      data: null,
      loading: false,
      error: null,
      lastFetched: null,
    },
    loading,
    error,
    refetchAll,
  };
}
