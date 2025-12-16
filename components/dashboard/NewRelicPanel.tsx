'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { NewRelicLogo } from '@/components/logos';
import { PanelSkeleton, PanelError, PanelEmpty, getErrorMessage } from './PanelStates';

interface NewRelicPanelProps {
  compact?: boolean;
  refreshTrigger?: number;
  defaultExpanded?: boolean;
  embedded?: boolean; // When true, hides internal header (used inside DashboardPanel)
}

interface NewRelicData {
  applications: {
    id: number;
    name: string;
    health_status: 'green' | 'yellow' | 'red' | 'gray';
    reporting: boolean;
    language: string;
  }[];
  summary: {
    healthy: number;
    warning: number;
    critical: number;
    notReporting: number;
  };
}

export default function NewRelicPanel({
  compact = false,
  refreshTrigger,
  defaultExpanded = false,
  embedded = false,
}: NewRelicPanelProps) {
  // Auto-expand when embedded (used inside DashboardPanel)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || embedded);
  const [data, setData] = useState<NewRelicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/newrelic/applications');
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 503 && result.error?.includes('not configured')) {
          setConfigMissing(true);
        } else {
          throw new Error(result.error || 'Failed to fetch New Relic data');
        }
        return;
      }

      if (result.success) {
        setData(result.data);
        setConfigMissing(false);
      } else {
        throw new Error(result.error || 'Failed to fetch New Relic data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount and when refresh trigger changes
  useEffect(() => {
    if (isExpanded) {
      fetchData();
    }
  }, [isExpanded, refreshTrigger, fetchData]);

  // Auto-load data on initial mount (even when collapsed)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'green':
        return '#10b981';
      case 'yellow':
        return '#f59e0b';
      case 'red':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'green':
        return 'check_circle';
      case 'yellow':
        return 'warning';
      case 'red':
        return 'error';
      default:
        return 'help';
    }
  };

  // Collapsed state
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #008C99 0%, #00AC69 100%)',
          boxShadow: '0 4px 12px rgba(0, 172, 105, 0.4)',
        }}
        aria-label="Expand New Relic panel"
      >
        <NewRelicLogo width={28} height={28} />

        {/* Health Badge */}
        {data && data.summary.critical > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: '#ef4444',
              color: 'white',
              border: '2px solid white',
            }}
          >
            {data.summary.critical}
          </span>
        )}

        {/* Hover Tooltip */}
        <span
          className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: 'var(--md-surface-container-high)',
            color: 'var(--md-on-surface)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          New Relic APM
        </span>
      </button>
    );
  }

  return (
    <div
      className={embedded ? 'h-full flex flex-col' : 'rounded-2xl p-6'}
      style={embedded ? {} : {
        background: 'var(--md-surface-container)',
        border: '1px solid var(--md-outline-variant)',
      }}
    >
      {/* Header - only show when not embedded */}
      {!embedded && (
        <div className="flex items-center justify-between mb-6">
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => setIsExpanded(false)}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #008C99 0%, #00AC69 100%)',
                boxShadow: '0 4px 12px rgba(0, 172, 105, 0.3)',
              }}
            >
              <NewRelicLogo width={28} height={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--md-on-surface)' }}>
                New Relic
              </h2>
              <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                Application performance monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loading && (
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                <Icon name="refresh" size={12} className="animate-spin" decorative />
                Loading...
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchData();
              }}
              disabled={loading}
              className="p-2 rounded-full transition-all hover:bg-opacity-10 hover:bg-white disabled:opacity-50"
              aria-label="Refresh New Relic data"
            >
              <Icon
                name="refresh"
                size={20}
                className={loading ? 'animate-spin' : ''}
                color="var(--md-on-surface-variant)"
                decorative
              />
            </button>

            <a
              href="https://one.newrelic.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full transition-all hover:bg-opacity-10 hover:bg-white"
              title="Open New Relic"
            >
              <Icon name="open_in_new" size={18} color="var(--md-on-surface-variant)" decorative />
            </a>
          </div>
        </div>
      )}

      {/* Configuration Missing */}
      {configMissing && (
        <PanelError
          title="Configuration Required"
          message="New Relic integration needs to be configured before you can use it."
          icon="settings"
          severity="info"
          tips={[
            'Add NEW_RELIC_API_KEY to your .env.local file',
            'Add NEW_RELIC_ACCOUNT_ID with your account ID',
            'Restart the development server after adding variables',
          ]}
        />
      )}

      {/* Error State */}
      {error && !configMissing && (
        <PanelError
          {...getErrorMessage(error)}
          onRetry={fetchData}
          isRetrying={loading}
        />
      )}

      {/* Loading State */}
      {loading && !data && !configMissing && !error && (
        <PanelSkeleton rows={4} />
      )}

      {/* Data Display */}
      {data && !configMissing && !error && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
            <div
              className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(16, 185, 129, 0.1)' }}
            >
              <div className="text-xl font-bold" style={{ color: '#10b981' }}>
                {data.summary.healthy}
              </div>
              <div className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                Healthy
              </div>
            </div>
            <div
              className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(245, 158, 11, 0.1)' }}
            >
              <div className="text-xl font-bold" style={{ color: '#f59e0b' }}>
                {data.summary.warning}
              </div>
              <div className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                Warning
              </div>
            </div>
            <div
              className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(239, 68, 68, 0.1)' }}
            >
              <div className="text-xl font-bold" style={{ color: '#ef4444' }}>
                {data.summary.critical}
              </div>
              <div className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                Critical
              </div>
            </div>
            <div
              className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(107, 114, 128, 0.1)' }}
            >
              <div className="text-xl font-bold" style={{ color: '#6b7280' }}>
                {data.summary.notReporting}
              </div>
              <div className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                Not Reporting
              </div>
            </div>
          </div>

          {/* Applications List */}
          <h4
            className="text-sm font-semibold mb-3 flex items-center gap-2 flex-shrink-0"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            <Icon name="apps" size={16} decorative />
            Applications ({data.applications.length})
          </h4>

          {data.applications.length > 0 ? (
            <div
              className="space-y-2 overflow-y-auto pr-2 flex-1"
              style={{
                maxHeight: embedded ? 'none' : '300px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--md-primary) var(--md-surface-container-high)',
              }}
            >
              {data.applications.map((app) => (
                <div
                  key={app.id}
                  className="p-2.5 rounded-lg transition-all duration-200 hover:shadow-md"
                  style={{
                    background: 'var(--md-surface-container-high)',
                    border: '1px solid var(--md-outline-variant)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {/* Health Indicator */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${getHealthColor(app.health_status)}22` }}
                    >
                      <Icon
                        name={getHealthIcon(app.health_status)}
                        size={14}
                        color={getHealthColor(app.health_status)}
                        decorative
                      />
                    </div>

                    {/* App Name */}
                    <h5
                      className="font-semibold text-sm truncate flex-1 min-w-0"
                      style={{ color: 'var(--md-on-surface)' }}
                    >
                      {app.name}
                    </h5>

                    {/* Right-justified metadata */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-xs"
                        style={{ color: 'var(--md-on-surface-variant)' }}
                      >
                        {app.language}
                      </span>
                      {!app.reporting && (
                        <span className="text-xs text-yellow-500">Not reporting</span>
                      )}
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          background: `${getHealthColor(app.health_status)}22`,
                          color: getHealthColor(app.health_status),
                        }}
                      >
                        {app.health_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PanelEmpty
              icon="apps"
              title="No Applications Found"
              description="No applications are configured in your New Relic account."
            />
          )}
        </>
      )}
    </div>
  );
}
