'use client';

import { useState, useRef, useEffect } from 'react';
import { useCoralogixDashboard } from '@/hooks/useCoralogixDashboard';
import { colors } from '@/lib/colors';
import { Icon } from '@/components/ui';
import { CoralogixLogo } from '@/components/logos';
import CoralogixAlertsList from './CoralogixAlertsList';
import ChatInterface from '../ChatInterface';
import { PanelSkeleton, PanelError, getErrorMessage } from './PanelStates';

interface LogResult {
  timestamp: string;
  message: string;
  severity?: string;
  service?: string;
}

type PanelMode = 'chat' | 'data';

interface CoralogixPanelProps {
  compact?: boolean;
  defaultExpanded?: boolean;
  refreshTrigger?: number;
  embedded?: boolean; // When true, hides internal header (used inside DashboardPanel)
}

export default function CoralogixPanel({ compact = false, defaultExpanded = false, refreshTrigger, embedded = false }: CoralogixPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [panelMode, setPanelMode] = useState<PanelMode>('chat'); // Default to chat
  const { alerts, loading, error, refetchAll } = useCoralogixDashboard(undefined, refreshTrigger);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [application, setApplication] = useState('');
  const [subsystem, setSubsystem] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LogResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic metadata state
  const [applications, setApplications] = useState<string[]>([]);
  const [subsystems, setSubsystems] = useState<string[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingSubsystems, setLoadingSubsystems] = useState(false);

  const timeRangeOptions = [
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '24h', label: '24h' },
  ];

  // Fetch applications on mount
  useEffect(() => {
    const fetchApplications = async () => {
      setLoadingApplications(true);
      try {
        const response = await fetch('/api/coralogix/metadata?type=applications');
        const data = await response.json();
        if (data.success && data.data) {
          setApplications(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      } finally {
        setLoadingApplications(false);
      }
    };
    fetchApplications();
  }, []);

  // Fetch subsystems when application changes
  useEffect(() => {
    const fetchSubsystems = async () => {
      setLoadingSubsystems(true);
      setSubsystem(''); // Reset subsystem when application changes
      try {
        const url = application
          ? `/api/coralogix/metadata?type=subsystems&application=${encodeURIComponent(application)}`
          : '/api/coralogix/metadata?type=subsystems';
        const response = await fetch(url);
        const data = await response.json();
        if (data.success && data.data) {
          setSubsystems(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch subsystems:', err);
      } finally {
        setLoadingSubsystems(false);
      }
    };
    fetchSubsystems();
  }, [application]);

  const handleSearch = async () => {
    const hasFilter = searchTerm.trim() || application.trim() || subsystem.trim();
    if (!hasFilter || isSearching) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    // Build the DataPrime query directly
    // Note: ~~ only works on $d (full document), use == for specific field matches
    let query = `source logs`;

    if (application.trim()) {
      query += ` | filter $l.applicationname == '${application.trim()}'`;
    }

    if (subsystem.trim()) {
      query += ` | filter $l.subsystemname == '${subsystem.trim()}'`;
    }

    if (searchTerm.trim()) {
      query += ` | filter $d ~~ '${searchTerm.trim()}'`;
    }
    setLastQuery(query);

    try {
      const response = await fetch('/api/mcp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId: 'coralogix',
          message: query,
          timeRange: selectedTimeRange,
          isDirectQuery: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.rawResults) {
          setSearchResults(data.rawResults);
        } else {
          setSearchResults([{
            timestamp: new Date().toISOString(),
            message: data.message || 'No results found',
          }]);
        }
      } else {
        setSearchError(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Network error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'error':
      case 'critical':
        return colors.error;
      case 'warn':
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.primary;
      case 'debug':
        return colors.tertiary;
      default:
        return colors.onSurfaceVariant;
    }
  };

  // Data auto-loads on mount and refreshes via refresh button

  const formatLastFetched = () => {
    const lastFetched = alerts.lastFetched;
    if (!lastFetched) return 'Never';
    const diffMs = Date.now() - lastFetched.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    return `${diffMins} min ago`;
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetchAll();
  };

  const activeAlertCount = alerts.data?.alerts.length || 0;
  const criticalAlerts = alerts.data?.alerts.filter(a => a.severity === 'critical').length || 0;

  // Collapsed state
  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className="rounded-xl p-4 mb-6 cursor-pointer transition-all duration-200 hover:scale-[1.01] max-w-md mx-auto flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${colors.secondary}15, ${colors.primary}10)`,
          border: `2px solid ${colors.secondary}44`,
        }}
      >
        <div className="flex items-center gap-3">
          <CoralogixLogo width={20} height={20} />
          <div>
            <h3 className="text-sm font-bold text-bridge-text-primary">Coralogix Live</h3>
            {loading && !alerts.data ? (
              <p className="text-xs text-bridge-text-muted flex items-center gap-1">
                <Icon name="refresh" size={12} animate="animate-spin" decorative /> Loading...
              </p>
            ) : error ? (
              <p className="text-xs text-bridge-accent-red flex items-center gap-1">
                <Icon name="warning" size={12} decorative /> Error connecting
              </p>
            ) : (
              <p className="text-xs" style={{ color: activeAlertCount > 0 ? colors.error : colors.success }}>
                {activeAlertCount > 0 ? (
                  <span className="font-semibold">{activeAlertCount} active alert{activeAlertCount !== 1 ? 's' : ''}</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Icon name="check_circle" size={12} decorative /> All clear
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {criticalAlerts > 0 && (
            <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: `${colors.error}22`, color: colors.error }}>
              {criticalAlerts} Critical
            </span>
          )}
          <Icon name="keyboard_arrow_down" size={16} className="text-bridge-text-muted" decorative />
        </div>
      </div>
    );
  }

  // Compact expanded version
  if (compact) {
    return (
      <div
        className="rounded-xl p-4 mb-4 max-w-2xl mx-auto"
        style={{
          background: `linear-gradient(135deg, ${colors.secondary}15, ${colors.primary}10)`,
          border: `2px solid ${colors.secondary}44`,
        }}
      >
        <div
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => setIsExpanded(false)}
        >
          <div className="flex items-center gap-2">
            <CoralogixLogo width={18} height={18} />
            <h3 className="text-sm font-bold text-bridge-text-primary">Coralogix Live</h3>
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <Icon name="refresh" size={12} animate="animate-spin" className="text-bridge-text-muted" decorative />
            ) : error ? (
              <Icon name="warning" size={12} className="text-bridge-accent-red" decorative />
            ) : (
              <span className="text-xs text-bridge-text-muted">{formatLastFetched()}</span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 rounded bg-bridge-bg-card hover:bg-bridge-bg-tertiary transition-colors disabled:opacity-50"
            >
              <Icon name="refresh" size={12} className="text-bridge-text-secondary" animate={loading ? "animate-spin" : undefined} decorative />
            </button>
            <Icon name="keyboard_arrow_up" size={16} className="text-bridge-text-muted" decorative />
          </div>
        </div>

        {error && (
          <div className="p-2 rounded bg-bridge-accent-red/10 border border-bridge-accent-red/30 mb-3">
            <p className="text-xs text-bridge-accent-red">{error}</p>
          </div>
        )}

        {/* Compact Stats */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span style={{ color: colors.error }}>
            <strong className="text-lg">{activeAlertCount}</strong> active
          </span>
          <span className="text-bridge-text-muted">|</span>
          <span style={{ color: colors.primary }}>
            <strong>{alerts.data?.alerts.length || 0}</strong> total alerts
          </span>
        </div>

        {/* Compact Alerts List */}
        {alerts.data && alerts.data.alerts.length > 0 ? (
          <CoralogixAlertsList alerts={alerts.data.alerts.slice(0, 5)} compact />
        ) : (
          <div className="p-3 text-center rounded bg-bridge-bg-card">
            <Icon name="check_circle" size={20} color={colors.success} decorative />
            <p className="text-xs text-bridge-text-secondary">All clear!</p>
          </div>
        )}

        {loading && !alerts.data && (
          <div className="h-20 rounded bg-bridge-bg-card animate-pulse" />
        )}
      </div>
    );
  }

  // Full expanded version
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--md-surface-container)',
        border: `2px solid ${colors.secondary}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="flex items-center gap-3 cursor-pointer flex-1"
          onClick={() => setIsExpanded(false)}
        >
          <CoralogixLogo width={28} height={28} />
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--md-on-surface)' }}>
              Coralogix Live
            </h3>
            <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
              {panelMode === 'chat' ? 'AI-powered log insights' : 'Log analytics & alerts'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Chat/Data Toggle Switch */}
          <div
            className="flex items-center rounded-lg p-1"
            style={{ background: 'var(--md-surface-container-high)' }}
          >
            <button
              onClick={() => setPanelMode('chat')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                panelMode === 'chat' ? 'shadow-sm' : 'hover:opacity-80'
              }`}
              style={{
                background: panelMode === 'chat' ? colors.secondary : 'transparent',
                color: panelMode === 'chat' ? '#fff' : 'var(--md-on-surface-variant)',
              }}
            >
              <Icon name="chat" size={14} decorative />
              Chat
            </button>
            <button
              onClick={() => setPanelMode('data')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                panelMode === 'data' ? 'shadow-sm' : 'hover:opacity-80'
              }`}
              style={{
                background: panelMode === 'data' ? colors.secondary : 'transparent',
                color: panelMode === 'data' ? '#fff' : 'var(--md-on-surface-variant)',
              }}
            >
              <Icon name="monitoring" size={14} decorative />
              Data
            </button>
          </div>

          {/* Status indicator - only show in data mode */}
          {panelMode === 'data' && (
            <>
              {loading ? (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                  <Icon name="refresh" size={12} animate="animate-spin" decorative />
                  Loading...
                </span>
              ) : error ? (
                <span className="text-xs flex items-center gap-1" style={{ color: colors.error }}>
                  <Icon name="warning" size={12} decorative />
                  Error
                </span>
              ) : (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                  <Icon name="check_circle" size={12} color={colors.success} decorative />
                  {formatLastFetched()}
                </span>
              )}

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 rounded-lg bg-bridge-bg-card hover:bg-bridge-bg-tertiary transition-colors disabled:opacity-50"
              >
                <Icon name="refresh" size={16} animate={loading ? 'animate-spin' : undefined} color={colors.onSurface} decorative />
              </button>
            </>
          )}

          {/* External link */}
          <a
            href="https://coralogix.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-bridge-bg-card hover:bg-bridge-bg-tertiary transition-colors text-bridge-text-secondary hover:text-bridge-accent-purple"
            title="Open in Coralogix"
          >
            <Icon name="open_in_new" size={16} decorative />
          </a>

          <button onClick={() => setIsExpanded(false)} className="p-2 rounded-lg hover:bg-bridge-bg-tertiary transition-colors">
            <Icon name="keyboard_arrow_up" size={20} color={colors.onSurfaceVariant} decorative />
          </button>
        </div>
      </div>

      {/* Chat Mode - Embedded ChatInterface */}
      {panelMode === 'chat' && (
        <>
          {/* Application/Subsystem Filters for Chat Context */}
          <div className="mb-3 p-3 rounded-xl" style={{ background: 'var(--md-surface-container-high)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="filter_list" size={14} color={colors.onSurfaceVariant} decorative />
              <span className="text-xs font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                Filter context for AI queries
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <select
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  disabled={loadingApplications}
                  className="w-full px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs cursor-pointer appearance-none"
                  style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                >
                  <option value="">{loadingApplications ? 'Loading...' : 'All Applications'}</option>
                  {applications.map((app) => (
                    <option key={app} value={app}>{app}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  {loadingApplications ? (
                    <Icon name="refresh" size={12} color={colors.onSurfaceVariant} animate="animate-spin" decorative />
                  ) : (
                    <Icon name="expand_more" size={14} color={colors.onSurfaceVariant} decorative />
                  )}
                </div>
              </div>
              <div className="flex-1 relative">
                <select
                  value={subsystem}
                  onChange={(e) => setSubsystem(e.target.value)}
                  disabled={loadingSubsystems || !application}
                  className="w-full px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs cursor-pointer appearance-none"
                  style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                >
                  <option value="">{loadingSubsystems ? 'Loading...' : !application ? 'Select app first' : 'All Subsystems'}</option>
                  {subsystems.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  {loadingSubsystems ? (
                    <Icon name="refresh" size={12} color={colors.onSurfaceVariant} animate="animate-spin" decorative />
                  ) : (
                    <Icon name="expand_more" size={14} color={colors.onSurfaceVariant} decorative />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ChatInterface */}
          <div className="h-[560px] -mx-1">
            <ChatInterface />
          </div>
        </>
      )}

      {/* Data Mode - All data content */}
      {panelMode === 'data' && (
        <>
          {/* Inline Log Search */}
          <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--md-surface-container-high)' }}>
            {/* Time Range */}
            <div className="flex items-center gap-2 mb-3">
              <Icon name="schedule" size={14} color={colors.onSurfaceVariant} decorative />
              <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Time:</span>
              <div className="flex gap-1">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTimeRange(option.value)}
                    className={`px-2 py-0.5 rounded text-xs transition-all ${
                      selectedTimeRange === option.value ? 'font-semibold' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      background: selectedTimeRange === option.value ? colors.secondary : 'var(--md-surface-container)',
                      color: selectedTimeRange === option.value ? '#fff' : 'var(--md-on-surface-variant)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <select
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  disabled={loadingApplications}
                  className="w-full px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs cursor-pointer appearance-none"
                  style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                >
                  <option value="">{loadingApplications ? 'Loading...' : 'All Applications'}</option>
                  {applications.map((app) => (
                    <option key={app} value={app}>
                      {app}
                    </option>
                  ))}
                </select>
                {loadingApplications && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Icon name="refresh" size={12} animate="animate-spin" decorative />
                  </div>
                )}
              </div>
              <div className="flex-1 relative">
                <select
                  value={subsystem}
                  onChange={(e) => setSubsystem(e.target.value)}
                  disabled={loadingSubsystems}
                  className="w-full px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs cursor-pointer appearance-none"
                  style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                >
                  <option value="">{loadingSubsystems ? 'Loading...' : 'All Subsystems'}</option>
                  {subsystems.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                {loadingSubsystems && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Icon name="refresh" size={12} animate="animate-spin" decorative />
                  </div>
                )}
              </div>
            </div>

            {/* Search Box */}
            <div className="flex gap-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search logs (e.g., login, error, timeout)"
                className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                disabled={isSearching}
              />
              <button
                onClick={handleSearch}
                disabled={!(searchTerm.trim() || application.trim() || subsystem.trim()) || isSearching}
                className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: (searchTerm.trim() || application.trim() || subsystem.trim()) && !isSearching
                    ? `linear-gradient(135deg, ${colors.secondary}, ${colors.tertiary})`
                    : colors.surfaceContainerHigh,
                }}
              >
                {isSearching ? (
                  <Icon name="refresh" size={16} animate="animate-spin" decorative />
                ) : (
                  <Icon name="search" size={16} decorative />
                )}
              </button>
            </div>

            {/* Query Display */}
            {lastQuery && (
              <div className="mt-2 p-2 rounded-lg" style={{ background: 'var(--md-surface-container)' }}>
                <code className="text-xs font-mono break-all" style={{ color: colors.tertiary }}>
                  {lastQuery}
                </code>
              </div>
            )}

            {/* Search Results */}
            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2" style={{ color: 'var(--md-on-surface-variant)' }}>
                  <Icon name="refresh" size={16} animate="animate-spin" decorative />
                  <span className="text-sm">Searching logs...</span>
                </div>
              </div>
            )}

            {searchError && (
              <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2">
                  <Icon name="error" size={14} color={colors.error} decorative />
                  <span className="text-xs" style={{ color: colors.error }}>{searchError}</span>
                </div>
              </div>
            )}

            {!isSearching && !searchError && searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--md-surface-container)' }}
                  >
                    <div className="flex items-start gap-2">
                      {result.severity && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium shrink-0"
                          style={{
                            background: `${getSeverityColor(result.severity)}22`,
                            color: getSeverityColor(result.severity),
                          }}
                        >
                          {result.severity.toUpperCase()}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono break-words whitespace-pre-wrap" style={{ color: 'var(--md-on-surface)' }}>
                          {result.message}
                        </p>
                        <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <PanelError
              {...getErrorMessage(error)}
              onRetry={refetchAll}
              isRetrying={loading}
              className="mb-4"
            />
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ background: 'var(--md-surface-container-high)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="warning" size={16} style={{ color: colors.error }} decorative />
                <span className="text-xs text-bridge-text-muted">Active Alerts</span>
              </div>
              <div className="text-2xl font-bold text-bridge-text-primary">
                {activeAlertCount}
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--md-surface-container-high)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="info" size={16} style={{ color: colors.primary }} decorative />
                <span className="text-xs text-bridge-text-muted">Total Alerts</span>
              </div>
              <div className="text-2xl font-bold text-bridge-text-primary">
                {alerts.data?.alerts.length || 0}
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          {alerts.data && (
            <>
              <h4 className="text-sm font-semibold text-bridge-text-secondary flex items-center gap-2 mb-3">
                <Icon name="warning" size={16} decorative />
                Active Alerts ({alerts.data.alerts.length})
              </h4>
              {alerts.data.alerts.length > 0 ? (
                <CoralogixAlertsList alerts={alerts.data.alerts} />
              ) : (
                <div className="p-4 text-center rounded-xl bg-bridge-bg-card">
                  <Icon name="check_circle" size={24} className="mx-auto mb-2 text-bridge-status-migrated" decorative />
                  <p className="text-xs text-bridge-text-secondary">No active alerts</p>
                </div>
              )}
            </>
          )}

          {/* Loading skeleton */}
          {loading && !alerts.data && (
            <PanelSkeleton rows={3} showHeader={false} />
          )}
        </>
      )}
    </div>
  );
}
