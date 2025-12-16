'use client';

import { useState, useRef, useEffect } from 'react';
import { colors } from '@/lib/colors';
import { Icon } from '@/components/ui';

interface LogResult {
  timestamp: string;
  message: string;
  severity?: string;
  service?: string;
  raw?: Record<string, unknown>;
}

interface CoralogixLogSearchProps {
  onClose?: () => void;
}

export default function CoralogixLogSearch({ onClose }: CoralogixLogSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [application, setApplication] = useState('');
  const [subsystem, setSubsystem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LogResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dropdown state
  const [applications, setApplications] = useState<string[]>([]);
  const [subsystems, setSubsystems] = useState<string[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [isLoadingSubsystems, setIsLoadingSubsystems] = useState(false);

  const timeRangeOptions = [
    { value: '15m', label: '15 min' },
    { value: '30m', label: '30 min' },
    { value: '1h', label: '1 hour' },
    { value: '4h', label: '4 hours' },
    { value: '8h', label: '8 hours' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
  ];

  // Fetch applications on mount
  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoadingApplications(true);
      try {
        const response = await fetch('/api/coralogix/metadata?type=applications');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Sort applications alphabetically
          setApplications(data.data.sort((a: string, b: string) => a.localeCompare(b)));
        }
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      } finally {
        setIsLoadingApplications(false);
      }
    };
    fetchApplications();
  }, []);

  // Fetch subsystems when application changes
  useEffect(() => {
    const fetchSubsystems = async () => {
      if (!application) {
        setSubsystems([]);
        return;
      }
      setIsLoadingSubsystems(true);
      try {
        const response = await fetch(`/api/coralogix/metadata?type=subsystems&application=${encodeURIComponent(application)}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Sort subsystems alphabetically
          setSubsystems(data.data.sort((a: string, b: string) => a.localeCompare(b)));
        }
      } catch (err) {
        console.error('Failed to fetch subsystems:', err);
      } finally {
        setIsLoadingSubsystems(false);
      }
    };
    fetchSubsystems();
  }, [application]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    // Allow search if any filter is specified
    const hasFilter = searchTerm.trim() || application.trim() || subsystem.trim();
    if (!hasFilter || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    // Build the DataPrime query directly - no NL parsing needed
    // Note: ~~ only works on $d (full document), use == for specific fields
    let query = `source logs`;

    // Add application filter if specified (exact match with ==)
    if (application.trim()) {
      query += ` | filter $l.applicationname == '${application.trim()}'`;
    }

    // Add subsystem filter if specified (exact match with ==)
    if (subsystem.trim()) {
      query += ` | filter $l.subsystemname == '${subsystem.trim()}'`;
    }

    // Add search term filter using ~~ which works on $d (full document search)
    if (searchTerm.trim()) {
      query += ` | filter $d ~~ '${searchTerm.trim()}'`;
    }
    setLastQuery(query);

    try {
      const response = await fetch('/api/mcp/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemId: 'coralogix',
          message: query, // Send the query directly
          timeRange: selectedTimeRange,
          isDirectQuery: true, // Flag to skip NL conversion
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Parse results from the response message if they exist
        // The API returns formatted text, but we may need to extract structured data
        if (data.rawResults) {
          setResults(data.rawResults);
        } else {
          // Display the message as a single result for now
          setResults([{
            timestamp: new Date().toISOString(),
            message: data.message || 'No results found',
          }]);
        }
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
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

  return (
    <div
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{ background: 'var(--md-surface-variant)' }}
    >
      {/* Header */}
      <div
        className="p-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
      >
        <div className="flex items-center gap-2">
          <Icon name="search" size={20} color={colors.secondary} decorative />
          <div>
            <h3
              className="text-sm font-bold"
              style={{ color: 'var(--md-on-surface)' }}
            >
              Log Search
            </h3>
            <p
              className="text-xs"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Search logs by keyword
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-bridge-bg-tertiary"
          >
            <Icon name="close" size={16} color={colors.onSurfaceVariant} decorative />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-3" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
        {/* Time Range Selector */}
        <div className="flex items-center gap-2 mb-3">
          <Icon name="schedule" size={14} color={colors.onSurfaceVariant} decorative />
          <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
            Time range:
          </span>
          <div className="flex gap-1 flex-wrap">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedTimeRange(option.value)}
                className={`px-2 py-0.5 rounded text-xs transition-all ${
                  selectedTimeRange === option.value
                    ? 'font-semibold'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: selectedTimeRange === option.value
                    ? colors.secondary
                    : 'var(--md-surface-container)',
                  color: selectedTimeRange === option.value
                    ? '#fff'
                    : 'var(--md-on-surface-variant)',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Application and Subsystem Filters */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--md-on-surface-variant)' }}>
              Application
            </label>
            <div className="relative">
              <select
                value={application}
                onChange={(e) => {
                  setApplication(e.target.value);
                  setSubsystem(''); // Reset subsystem when application changes
                }}
                className="w-full px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs appearance-none cursor-pointer"
                style={{
                  background: 'var(--md-surface-container)',
                  color: 'var(--md-on-surface)',
                }}
                disabled={isLoadingApplications}
              >
                <option value="">
                  {isLoadingApplications ? 'Loading...' : 'All applications'}
                </option>
                {applications.map((app) => (
                  <option key={app} value={app}>
                    {app}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                {isLoadingApplications ? (
                  <Icon name="refresh" size={12} color={colors.onSurfaceVariant} animate="animate-spin" decorative />
                ) : (
                  <Icon name="expand_more" size={14} color={colors.onSurfaceVariant} decorative />
                )}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--md-on-surface-variant)' }}>
              Subsystem
            </label>
            <div className="relative">
              <select
                value={subsystem}
                onChange={(e) => setSubsystem(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs appearance-none cursor-pointer"
                style={{
                  background: 'var(--md-surface-container)',
                  color: 'var(--md-on-surface)',
                }}
                disabled={isLoadingSubsystems || !application}
              >
                <option value="">
                  {isLoadingSubsystems ? 'Loading...' : !application ? 'Select application first' : 'All subsystems'}
                </option>
                {subsystems.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                {isLoadingSubsystems ? (
                  <Icon name="refresh" size={12} color={colors.onSurfaceVariant} animate="animate-spin" decorative />
                ) : (
                  <Icon name="expand_more" size={14} color={colors.onSurfaceVariant} decorative />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter search term (e.g., login, error, timeout)"
            className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            style={{
              background: 'var(--md-surface-container)',
              color: 'var(--md-on-surface)',
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSearch}
            disabled={!(searchTerm.trim() || application.trim() || subsystem.trim()) || isLoading}
            className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: (searchTerm.trim() || application.trim() || subsystem.trim()) && !isLoading
                ? `linear-gradient(135deg, ${colors.secondary}, ${colors.tertiary})`
                : colors.surfaceContainerHigh,
            }}
          >
            {isLoading ? (
              <Icon name="refresh" size={16} animate="animate-spin" decorative />
            ) : (
              <Icon name="search" size={16} decorative />
            )}
          </button>
        </div>
        <p
          className="text-xs mt-2"
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          Searches log messages for your term. Supports regex patterns.
        </p>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Show the query that was executed */}
        {lastQuery && (
          <div className="mb-3 p-2 rounded-lg" style={{ background: 'var(--md-surface-container)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="code" size={12} color={colors.tertiary} decorative />
              <span className="text-xs font-medium" style={{ color: colors.tertiary }}>
                DataPrime Query
              </span>
            </div>
            <code className="text-xs font-mono break-all" style={{ color: 'var(--md-on-surface-variant)' }}>
              {lastQuery}
            </code>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              <Icon name="refresh" size={20} animate="animate-spin" decorative />
              <span className="text-sm">Searching logs...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2">
              <Icon name="error" size={16} color={colors.error} decorative />
              <span className="text-sm" style={{ color: colors.error }}>{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg"
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
                    <p
                      className="text-sm font-mono break-words whitespace-pre-wrap"
                      style={{ color: 'var(--md-on-surface)' }}
                    >
                      {result.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                      {result.service && (
                        <span className="text-xs" style={{ color: colors.tertiary }}>
                          {result.service}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && lastQuery && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <Icon name="search_off" size={32} color={colors.onSurfaceVariant} decorative />
            <p className="text-sm mt-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              No logs found matching your search
            </p>
          </div>
        )}

        {/* Initial State */}
        {!lastQuery && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Icon name="manage_search" size={32} color={colors.onSurfaceVariant} decorative />
            <p className="text-sm mt-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Enter a search term to find logs
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
              Examples: login, error, timeout, payment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
