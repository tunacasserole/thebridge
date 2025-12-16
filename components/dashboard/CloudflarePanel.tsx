'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { CloudflareLogo } from '@/components/logos';
import { PanelSkeleton, PanelError, PanelEmpty, getErrorMessage } from './PanelStates';

interface CloudflarePanelProps {
  compact?: boolean;
  refreshTrigger?: number;
  defaultExpanded?: boolean;
  embedded?: boolean;
}

interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  plan?: {
    name: string;
  };
}

interface CloudflareData {
  zones: CloudflareZone[];
}

export default function CloudflarePanel({
  compact = false,
  refreshTrigger,
  defaultExpanded = false,
  embedded = false,
}: CloudflarePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || embedded);
  const [data, setData] = useState<CloudflareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cloudflare/zones');
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 503 && result.error?.includes('not available')) {
          setConfigMissing(true);
        } else {
          throw new Error(result.error || 'Failed to fetch Cloudflare data');
        }
        return;
      }

      if (result.success) {
        setData({ zones: result.zones || [] });
        setConfigMissing(false);
      } else {
        throw new Error(result.error || 'Failed to fetch Cloudflare data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isExpanded) {
      fetchData();
    }
  }, [isExpanded, refreshTrigger, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'paused':
        return '#6b7280';
      default:
        return '#ef4444';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'check_circle';
      case 'pending':
        return 'pending';
      case 'paused':
        return 'pause_circle';
      default:
        return 'error';
    }
  };

  // Collapsed state
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #F38020 0%, #FAAE40 100%)',
          boxShadow: '0 4px 12px rgba(243, 128, 32, 0.4)',
        }}
        aria-label="Expand Cloudflare panel"
      >
        <CloudflareLogo width={28} height={28} />

        {/* Zone Count Badge */}
        {data && data.zones.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: '#10b981',
              color: 'white',
              border: '2px solid white',
            }}
          >
            {data.zones.length}
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
          Cloudflare
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
                background: 'linear-gradient(135deg, #F38020 0%, #FAAE40 100%)',
                boxShadow: '0 4px 12px rgba(243, 128, 32, 0.3)',
              }}
            >
              <CloudflareLogo width={28} height={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--md-on-surface)' }}>
                Cloudflare
              </h2>
              <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                CDN, security & performance
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
              aria-label="Refresh Cloudflare data"
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
              href="https://dash.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full transition-all hover:bg-opacity-10 hover:bg-white"
              title="Open Cloudflare Dashboard"
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
          message="Cloudflare integration needs to be configured before you can use it."
          icon="settings"
          severity="info"
          tips={[
            'Add CLOUDFLARE_API_TOKEN to your .env.local file',
            'Get your API token from Cloudflare Dashboard → My Profile → API Tokens',
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
          <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
            <div
              className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(16, 185, 129, 0.1)' }}
            >
              <div className="text-xl font-bold" style={{ color: '#10b981' }}>
                {data.zones.filter(z => z.status.toLowerCase() === 'active').length}
              </div>
              <div className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                Active
              </div>
            </div>
            <div
              className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(245, 158, 11, 0.1)' }}
            >
              <div className="text-xl font-bold" style={{ color: '#f59e0b' }}>
                {data.zones.filter(z => z.status.toLowerCase() === 'pending').length}
              </div>
              <div className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                Pending
              </div>
            </div>
            <div
              className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(107, 114, 128, 0.1)' }}
            >
              <div className="text-xl font-bold" style={{ color: '#6b7280' }}>
                {data.zones.filter(z => z.status.toLowerCase() === 'paused').length}
              </div>
              <div className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                Paused
              </div>
            </div>
          </div>

          {/* Zones List */}
          <h4
            className="text-sm font-semibold mb-3 flex items-center gap-2 flex-shrink-0"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            <Icon name="public" size={16} decorative />
            Zones ({data.zones.length})
          </h4>

          {data.zones.length > 0 ? (
            <div
              className="space-y-2 overflow-y-auto pr-2 flex-1"
              style={{
                maxHeight: embedded ? 'none' : '300px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--md-primary) var(--md-surface-container-high)',
              }}
            >
              {data.zones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-2.5 rounded-lg transition-all duration-200 hover:shadow-md"
                  style={{
                    background: 'var(--md-surface-container-high)',
                    border: '1px solid var(--md-outline-variant)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {/* Status Indicator */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${getStatusColor(zone.status)}22` }}
                    >
                      <Icon
                        name={getStatusIcon(zone.status)}
                        size={14}
                        color={getStatusColor(zone.status)}
                        decorative
                      />
                    </div>

                    {/* Zone Name */}
                    <h5
                      className="font-semibold text-sm truncate flex-1 min-w-0"
                      style={{ color: 'var(--md-on-surface)' }}
                    >
                      {zone.name}
                    </h5>

                    {/* Right-justified metadata */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {zone.plan && (
                        <span
                          className="text-xs"
                          style={{ color: 'var(--md-on-surface-variant)' }}
                        >
                          {zone.plan.name}
                        </span>
                      )}
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          background: `${getStatusColor(zone.status)}22`,
                          color: getStatusColor(zone.status),
                        }}
                      >
                        {zone.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PanelEmpty
              icon="public"
              title="No Zones Found"
              description="No zones are configured in your Cloudflare account."
            />
          )}
        </>
      )}
    </div>
  );
}
