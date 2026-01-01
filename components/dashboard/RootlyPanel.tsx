'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRootlyData } from '@/hooks/useRootlyData';
import { colors } from '@/lib/colors';
import { Icon } from '@/components/ui';
import { RootlyLogo } from '@/components/logos';
import { ActiveIncident, ActiveAlert } from '@/lib/rootly/types';

const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes for incident data

type ViewMode = 'incidents' | 'alerts';
type FilterMode = 'all' | 'triage' | 'active' | 'canceled' | 'resolved';

interface RootlyPanelProps {
  compact?: boolean;
  defaultExpanded?: boolean;
  refreshTrigger?: number;
  embedded?: boolean; // When true, hides internal header/border (used inside DashboardPanel)
}

export default function RootlyPanel({ compact = false, defaultExpanded = true, refreshTrigger, embedded = false }: RootlyPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<ViewMode>('incidents');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    summary: '',
    severity_id: '',
  });
  const [creatingIncident, setCreatingIncident] = useState(false);
  const { data, loading, error, refetch } = useRootlyData(REFRESH_INTERVAL, refreshTrigger);

  // Filter incidents and alerts based on mode
  const filteredData = useMemo(() => {
    if (!data) return { incidents: [], alerts: [] };

    // Start with all data
    let incidents = [...data.activeIncidents, ...data.recentIncidents];
    let alerts = data.activeAlerts;

    // Filter based on view mode
    if (viewMode === 'incidents') {
      // Show incidents, filter by status if needed
      alerts = [];

      if (filterMode === 'triage') {
        incidents = incidents.filter(i => i.status === 'in_triage');
      } else if (filterMode === 'active') {
        incidents = incidents.filter(i => i.status === 'started' || i.status === 'mitigated');
      } else if (filterMode === 'canceled') {
        incidents = incidents.filter(i => i.status === 'cancelled');
      } else if (filterMode === 'resolved') {
        incidents = incidents.filter(i => i.status === 'resolved');
      }
      // 'all' shows all incidents, no filter
    } else {
      // Show alerts only
      incidents = [];
      // For alerts, we could add filters later if needed
    }

    return { incidents, alerts };
  }, [data, viewMode, filterMode]);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'resolved') return '#10b981'; // green
    if (s === 'mitigated') return '#3b82f6'; // blue
    if (s === 'started' || s === 'acknowledged') return '#f59e0b'; // amber
    if (s === 'in_triage' || s === 'open') return '#ef4444'; // red
    return colors.outlineVariant;
  };

  const getSeverityConfig = (priority: string) => {
    if (priority === 'P1') return { color: '#ef4444', label: 'SEV1' };
    if (priority === 'P2') return { color: '#f97316', label: 'SEV2' };
    if (priority === 'P3') return { color: '#eab308', label: 'SEV3' };
    return { color: '#3b82f6', label: 'SEV4' };
  };

  const getUrgencyConfig = (urgency: string) => {
    if (urgency === 'critical') return { color: '#ef4444', icon: 'priority_high' };
    if (urgency === 'high') return { color: '#f97316', icon: 'arrow_upward' };
    if (urgency === 'medium') return { color: '#eab308', icon: 'drag_handle' };
    return { color: '#3b82f6', icon: 'arrow_downward' };
  };

  // Handle creating a new incident
  const handleCreateIncident = async () => {
    if (!createFormData.title.trim()) {
      alert('Please enter an incident title');
      return;
    }

    setCreatingIncident(true);
    try {
      const response = await fetch('/api/rootly/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form and close modal
        setCreateFormData({ title: '', summary: '', severity_id: '' });
        setShowCreateModal(false);
        // Refresh data to show new incident
        await refetch();
      } else {
        alert(`Failed to create incident: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to create incident:', error);
      alert('Failed to create incident. Please try again.');
    } finally {
      setCreatingIncident(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (incidentId: string, newStatus: 'resolved' | 'cancelled') => {
    setUpdatingStatus(incidentId);
    try {
      const response = await fetch(`/api/rootly/incident/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data after successful update
        await refetch();
        setStatusDropdown(null);
      } else {
        alert(`Failed to update status: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Toggle status dropdown
  const toggleStatusDropdown = (incidentId: string) => {
    if (statusDropdown === incidentId) {
      setStatusDropdown(null);
    } else {
      setStatusDropdown(incidentId);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (statusDropdown && !target.closest('.status-dropdown-container')) {
        setStatusDropdown(null);
      }
    };

    if (statusDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [statusDropdown]);

  // Loading state - skeleton loader
  if (loading && !data) {
    return (
      <div
        className={embedded ? 'h-full flex flex-col' : 'rounded-2xl p-6'}
        style={embedded ? {} : {
          background: 'var(--md-surface-container)',
          border: '1px solid var(--md-outline-variant)',
        }}
      >
        {/* Header skeleton - hide when embedded */}
        {!embedded && (
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-full animate-pulse"
              style={{ background: 'var(--md-surface-container-highest)' }}
            />
            <div className="flex-1">
              <div
                className="h-5 w-40 rounded animate-pulse mb-2"
                style={{ background: 'var(--md-surface-container-highest)' }}
              />
              <div
                className="h-3 w-24 rounded animate-pulse"
                style={{ background: 'var(--md-surface-container-highest)' }}
              />
            </div>
          </div>
        )}

        {/* View mode buttons skeleton */}
        <div className="flex gap-2 mb-4">
          <div
            className="flex-1 h-12 rounded-lg animate-pulse"
            style={{ background: 'var(--md-surface-container-highest)' }}
          />
          <div
            className="flex-1 h-12 rounded-lg animate-pulse"
            style={{ background: 'var(--md-surface-container-highest)', animationDelay: '100ms' }}
          />
        </div>

        {/* Filter chips skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-9 rounded-lg animate-pulse"
              style={{
                background: 'var(--md-surface-container-highest)',
                width: `${60 + i * 10}px`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>

        {/* Incident cards skeleton */}
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="rounded-xl p-4 animate-pulse"
              style={{
                background: 'var(--md-surface-container-high)',
                border: '1px solid var(--md-outline-variant)',
                animationDelay: `${i * 100}ms`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1"
                  style={{ background: 'var(--md-surface-container-highest)' }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="h-4 w-16 rounded"
                      style={{ background: 'var(--md-surface-container-highest)' }}
                    />
                    <div
                      className="h-4 w-20 rounded-full"
                      style={{ background: 'var(--md-surface-container-highest)' }}
                    />
                  </div>
                  <div
                    className="h-5 w-3/4 rounded mb-2"
                    style={{ background: 'var(--md-surface-container-highest)' }}
                  />
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-16 rounded"
                      style={{ background: 'var(--md-surface-container-highest)' }}
                    />
                    <div
                      className="h-3 w-24 rounded"
                      style={{ background: 'var(--md-surface-container-highest)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={embedded ? 'h-full flex flex-col items-center justify-center' : 'rounded-2xl p-6'}
        style={embedded ? {} : {
          background: 'var(--md-surface-container)',
          border: '1px solid var(--md-error)'
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Icon name="error" size={24} color="var(--md-error)" decorative />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--md-error)' }}>
            Failed to load Rootly data
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--md-on-surface-variant)' }}>
          {error}
        </p>
        <button
          onClick={refetch}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow-md"
          style={{
            background: 'var(--md-primary)',
            color: 'var(--md-on-primary)',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const totalFiltered = filteredData.incidents.length + filteredData.alerts.length;

  // Combine active and recent incidents for total counts
  const allIncidents = [...data.activeIncidents, ...data.recentIncidents];

  // Counts for incident filters
  const incidentCounts = {
    all: allIncidents.length,
    triage: allIncidents.filter(i => i.status === 'in_triage').length,
    active: allIncidents.filter(i => i.status === 'started' || i.status === 'mitigated').length,
    canceled: allIncidents.filter(i => i.status === 'cancelled').length,
    resolved: allIncidents.filter(i => i.status === 'resolved').length,
  };

  // Count for alerts
  const alertsCount = data.activeAlerts.length;

  // Minimized state - just the Rootly avatar (only when not embedded)
  if (!isExpanded && !embedded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #7748F6 0%, #9B6FFF 100%)',
          boxShadow: '0 4px 12px rgba(119, 72, 246, 0.3)',
        }}
        aria-label="Expand Rootly Incidents panel"
      >
        <RootlyLogo width={28} height={28} />
        {/* Notification badge for total items */}
        {totalFiltered > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center"
            style={{
              background: 'var(--md-error)',
              color: 'var(--md-on-error)',
            }}
          >
            {totalFiltered > 99 ? '99+' : totalFiltered}
          </span>
        )}
        {/* Hover tooltip */}
        <span
          className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: 'var(--md-surface-container-high)',
            color: 'var(--md-on-surface)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          Rootly Incidents
        </span>
      </button>
    );
  }

  return (
    <div
      className={embedded ? 'h-full flex flex-col' : 'rounded-2xl p-6 h-full flex flex-col'}
      style={embedded ? {} : {
        background: 'var(--md-surface-container)',
        border: '1px solid var(--md-outline-variant)',
      }}
    >
      {/* Header - hide when embedded (DashboardPanel provides its own header) */}
      {!embedded && (
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: 'linear-gradient(135deg, #7748F6 0%, #9B6FFF 100%)',
                boxShadow: '0 4px 12px rgba(119, 72, 246, 0.3)',
              }}
            >
              <RootlyLogo width={28} height={28} />
            </div>
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: 'var(--md-on-surface)' }}
              >
                Rootly Incidents
              </h2>
              <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                {totalFiltered} items {filterMode !== 'all' ? 'filtered' : 'total'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateModal(true);
              }}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:shadow-md flex items-center gap-1.5"
              style={{
                background: '#7748F6',
                color: '#ffffff',
              }}
              aria-label="Create new incident"
            >
              <Icon name="add" size={18} decorative />
              <span>Create</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                refetch();
              }}
              disabled={loading}
              className="p-2 rounded-full transition-all hover:bg-opacity-10 hover:bg-bridge-text-primary disabled:opacity-50"
              aria-label="Refresh Rootly data"
            >
              <Icon
                name="refresh"
                size={20}
                className={loading ? 'animate-spin' : ''}
                color="var(--md-on-surface-variant)"
                decorative
              />
            </button>
          </div>
        </div>
      )}

      {/* Expandable Content - always expanded when embedded */}
      {(isExpanded || embedded) && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filter Row with View Mode Toggle */}
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              {/* Create Button (shown when embedded in Dashboard) */}
              {embedded && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:shadow-md flex items-center gap-1"
                  style={{
                    background: '#7748F6',
                    color: '#ffffff',
                  }}
                  aria-label="Create new incident"
                >
                  <Icon name="add" size={14} decorative />
                  <span>Create</span>
                </button>
              )}

              {/* MD3 Segmented Button - View Mode Toggle */}
              <div
                className="inline-flex rounded-lg overflow-hidden shrink-0"
                style={{
                  border: '1px solid var(--md-outline-variant)',
                  background: 'var(--md-surface-container-highest)',
                }}
                role="group"
                aria-label="View mode"
              >
              <button
                onClick={() => {
                  setViewMode('incidents');
                  setFilterMode('all');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all"
                style={{
                  background: viewMode === 'incidents' ? '#7748F6' : 'transparent',
                  color: viewMode === 'incidents' ? '#ffffff' : 'var(--md-on-surface-variant)',
                }}
                aria-pressed={viewMode === 'incidents'}
              >
                <Icon name="emergency" size={12} decorative />
                <span>{incidentCounts.all}</span>
              </button>
              <div style={{ width: '1px', background: 'var(--md-outline-variant)' }} />
              <button
                onClick={() => {
                  setViewMode('alerts');
                  setFilterMode('all');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all"
                style={{
                  background: viewMode === 'alerts' ? '#f59e0b' : 'transparent',
                  color: viewMode === 'alerts' ? '#ffffff' : 'var(--md-on-surface-variant)',
                }}
                aria-pressed={viewMode === 'alerts'}
              >
                <Icon name="notifications_active" size={12} decorative />
                <span>{alertsCount}</span>
              </button>
              </div>
            </div>

            {/* Filter Chips - Only for Incidents (right-justified) */}
            {viewMode === 'incidents' && (
              <div className="flex flex-wrap items-center gap-1.5 justify-end">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  filterMode === 'all' ? 'shadow-sm' : ''
                }`}
                style={filterMode === 'all' ? {
                  background: 'var(--md-primary)',
                  color: 'var(--md-on-primary)',
                } : {
                  background: 'var(--md-surface-container-highest)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                All ({incidentCounts.all})
              </button>

              <button
                onClick={() => setFilterMode('triage')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  filterMode === 'triage' ? 'shadow-sm' : ''
                }`}
                style={filterMode === 'triage' ? {
                  background: '#ef4444',
                  color: '#ffffff',
                } : {
                  background: 'var(--md-surface-container-highest)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                Triage ({incidentCounts.triage})
              </button>

              <button
                onClick={() => setFilterMode('active')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  filterMode === 'active' ? 'shadow-sm' : ''
                }`}
                style={filterMode === 'active' ? {
                  background: '#f97316',
                  color: '#ffffff',
                } : {
                  background: 'var(--md-surface-container-highest)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                Active ({incidentCounts.active})
              </button>

              <button
                onClick={() => setFilterMode('canceled')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  filterMode === 'canceled' ? 'shadow-sm' : ''
                }`}
                style={filterMode === 'canceled' ? {
                  background: '#94a3b8',
                  color: '#ffffff',
                } : {
                  background: 'var(--md-surface-container-highest)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                Canceled ({incidentCounts.canceled})
              </button>

              <button
                onClick={() => setFilterMode('resolved')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  filterMode === 'resolved' ? 'shadow-sm' : ''
                }`}
                style={filterMode === 'resolved' ? {
                  background: '#10b981',
                  color: '#ffffff',
                } : {
                  background: 'var(--md-surface-container-highest)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                Resolved ({incidentCounts.resolved})
              </button>
              </div>
            )}
          </div>

          {/* Incidents & Alerts List */}
          <div
            className="space-y-2 overflow-y-auto pr-2 flex-1 min-h-0"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--md-primary) var(--md-surface-container-high)',
            } as React.CSSProperties}
          >
            {/* Incidents */}
            {filteredData.incidents.map((incident) => {
              const severity = getSeverityConfig(incident.priority);
              return (
                <div
                  key={incident.id}
                  className="group rounded-lg p-2 transition-all duration-200 hover:shadow-md cursor-pointer"
                  style={{
                    background: 'var(--md-surface-container-high)',
                    border: '1px solid var(--md-outline-variant)',
                  }}
                  onClick={() => window.open(incident.url, '_blank')}
                >
                  <div className="flex items-center gap-2">
                    {/* Status Indicator */}
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: getStatusColor(incident.status) }}
                    />

                    {/* ID & Icon */}
                    <Icon name="emergency" size={14} color="#7748F6" decorative className="flex-shrink-0" />
                    <span
                      className="text-xs font-mono font-semibold flex-shrink-0"
                      style={{ color: '#7748F6' }}
                    >
                      #{incident.sequentialId}
                    </span>

                    {/* Title */}
                    <h3
                      className="text-sm font-semibold group-hover:text-opacity-80 transition-all truncate flex-1 min-w-0"
                      style={{ color: 'var(--md-on-surface)' }}
                    >
                      {incident.title}
                    </h3>

                    {/* Right-justified metadata */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Status with dropdown */}
                      <div className="relative status-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatusDropdown(incident.id);
                          }}
                          disabled={updatingStatus === incident.id}
                          className="px-1.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-0.5 hover:opacity-80 transition-opacity disabled:opacity-50"
                          style={{
                            background: `${getStatusColor(incident.status)}22`,
                            color: getStatusColor(incident.status),
                          }}
                        >
                          {updatingStatus === incident.id ? (
                            <Icon name="sync" size={10} className="animate-spin" decorative />
                          ) : (
                            <>
                              {incident.status.replace('_', ' ')}
                              <Icon name="expand_more" size={12} decorative />
                            </>
                          )}
                        </button>

                        {/* Status dropdown */}
                        {statusDropdown === incident.id && (
                          <div
                            className="absolute z-20 mt-1 rounded-lg shadow-lg overflow-hidden min-w-[130px] right-0"
                            style={{
                              background: 'var(--md-surface-container-high)',
                              border: '1px solid var(--md-outline-variant)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleStatusUpdate(incident.id, 'resolved')}
                              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-opacity-10 hover:bg-bridge-text-primary transition-colors"
                              style={{ color: 'var(--md-on-surface)' }}
                            >
                              Mark as Resolved
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(incident.id, 'cancelled')}
                              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-opacity-10 hover:bg-bridge-text-primary transition-colors"
                              style={{ color: 'var(--md-on-surface)' }}
                            >
                              Cancel Incident
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Source badge */}
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          background: 'var(--md-tertiary-container)',
                          color: 'var(--md-on-tertiary-container)',
                        }}
                      >
                        {incident.source}
                      </span>

                      {/* External Link Icon */}
                      <Icon
                        name="open_in_new"
                        size={14}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        color="var(--md-on-surface-variant)"
                        decorative
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Alerts */}
            {filteredData.alerts.map((alert) => {
              const urgency = getUrgencyConfig(alert.urgency);
              return (
                <div
                  key={alert.id}
                  className="group rounded-lg p-2 transition-all duration-200 hover:shadow-md cursor-pointer"
                  style={{
                    background: 'var(--md-surface-container-high)',
                    border: '1px solid var(--md-outline-variant)',
                  }}
                  onClick={() => alert.externalUrl && window.open(alert.externalUrl, '_blank')}
                >
                  <div className="flex items-center gap-2">
                    {/* Status Indicator */}
                    <Icon
                      name="notifications_active"
                      size={14}
                      color={urgency.color}
                      decorative
                      className="flex-shrink-0"
                    />

                    {/* ID */}
                    <span
                      className="text-xs font-mono font-semibold flex-shrink-0"
                      style={{ color: urgency.color }}
                    >
                      {alert.shortId}
                    </span>

                    {/* Summary */}
                    <h3
                      className="text-sm font-semibold group-hover:text-opacity-80 transition-all truncate flex-1 min-w-0"
                      style={{ color: 'var(--md-on-surface)' }}
                    >
                      {alert.summary}
                    </h3>

                    {/* Right-justified metadata */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          background: `${getStatusColor(alert.status)}22`,
                          color: getStatusColor(alert.status),
                        }}
                      >
                        {alert.status}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-0.5"
                        style={{
                          background: `${urgency.color}22`,
                          color: urgency.color,
                        }}
                      >
                        <Icon name={urgency.icon} size={10} decorative />
                        {alert.urgency}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          background: 'var(--md-secondary-container)',
                          color: 'var(--md-on-secondary-container)',
                        }}
                      >
                        {alert.source}
                      </span>
                    </div>

                    {/* External Link Icon */}
                    {alert.externalUrl && (
                      <Icon
                        name="open_in_new"
                        size={14}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        color="var(--md-on-surface-variant)"
                        decorative
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {totalFiltered === 0 && (
              <div className="py-12 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--md-surface-container-highest)' }}
                >
                  <Icon name="check_circle" size={32} color="var(--md-on-surface-variant)" decorative />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--md-on-surface)' }}>
                  No items found
                </h3>
                <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {filterMode !== 'all' ? `No items in ${filterMode}` : 'All systems operational!'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => !creatingIncident && setShowCreateModal(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-md w-full"
            style={{
              background: 'var(--md-surface-container)',
              border: '1px solid var(--md-outline-variant)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: 'var(--md-on-surface)' }}>
                Create New Incident
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creatingIncident}
                className="p-1 rounded-full transition-all hover:bg-opacity-10 hover:bg-bridge-text-primary disabled:opacity-50"
                aria-label="Close modal"
              >
                <Icon name="close" size={24} color="var(--md-on-surface-variant)" decorative />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title Field */}
              <div>
                <label
                  htmlFor="incident-title"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--md-on-surface)' }}
                >
                  Title *
                </label>
                <input
                  id="incident-title"
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  disabled={creatingIncident}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
                  style={{
                    background: 'var(--md-surface-container-high)',
                    border: '1px solid var(--md-outline-variant)',
                    color: 'var(--md-on-surface)',
                  }}
                  placeholder="Brief description of the incident"
                  required
                />
              </div>

              {/* Summary Field */}
              <div>
                <label
                  htmlFor="incident-summary"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--md-on-surface)' }}
                >
                  Summary
                </label>
                <textarea
                  id="incident-summary"
                  value={createFormData.summary}
                  onChange={(e) => setCreateFormData({ ...createFormData, summary: e.target.value })}
                  disabled={creatingIncident}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-50 resize-none"
                  style={{
                    background: 'var(--md-surface-container-high)',
                    border: '1px solid var(--md-outline-variant)',
                    color: 'var(--md-on-surface)',
                  }}
                  placeholder="Additional details about the incident"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingIncident}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-opacity-10 hover:bg-bridge-text-primary disabled:opacity-50"
                  style={{ color: 'var(--md-on-surface)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateIncident}
                  disabled={creatingIncident || !createFormData.title.trim()}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                  style={{
                    background: '#7748F6',
                    color: '#ffffff',
                  }}
                >
                  {creatingIncident && (
                    <Icon name="sync" size={16} className="animate-spin" decorative />
                  )}
                  {creatingIncident ? 'Creating...' : 'Create Incident'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
