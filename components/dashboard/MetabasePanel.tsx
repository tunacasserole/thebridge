'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui';
import { useMetabaseData } from '@/hooks/useMetabaseData';
import { colors } from '@/lib/colors';
import { PanelSkeleton, PanelError, getErrorMessage } from './PanelStates';

interface MetabasePanelProps {
  compact?: boolean;
  refreshTrigger?: number;
}

export default function MetabasePanel({ compact = false, refreshTrigger }: MetabasePanelProps) {
  // Auto-fetch data on mount with refresh interval
  const { data, loading, error, timeout, configMissing, refetch } = useMetabaseData(true, 60000);

  // Query state
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQueryExecuting, setIsQueryExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryMode, setQueryMode] = useState<'sql' | 'natural'>('natural');
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<number | null>(null);

  // Set default database to first available when data loads
  React.useEffect(() => {
    if (data && data.databases.list.length > 0 && !selectedDatabaseId) {
      const defaultDbId = data.databases.list[0].id;
      const defaultDb = data.databases.list.find(db => db.id === defaultDbId);

      console.log('[MetabasePanel] Setting default database:', {
        selectedDb: defaultDb,
        allDatabases: data.databases.list.map(db => ({ id: db.id, name: db.name }))
      });

      setSelectedDatabaseId(defaultDbId);
    }
  }, [data, selectedDatabaseId]);

  // Helper to render content inside expanded panel
  const renderContent = () => {
    // Configuration missing
    if (configMissing) {
      return (
        <PanelError
          title="Configuration Required"
          message="Metabase integration needs to be configured before you can use it."
          icon="settings"
          severity="info"
          tips={[
            'Add METABASE_URL to your .env.local file',
            'Add METABASE_API_KEY with a valid API key',
            'Restart the development server after adding variables',
          ]}
        />
      );
    }

    // Timeout or error
    if (timeout || error) {
      const errorInfo = getErrorMessage(error || 'Connection timeout');
      return (
        <PanelError
          {...errorInfo}
          onRetry={refetch}
          isRetrying={loading}
        />
      );
    }

    // Loading state
    if (loading && !data) {
      return <PanelSkeleton rows={2} showStats={false} />;
    }

    // No data
    if (!data) {
      return (
        <div className="text-center py-8 text-bridge-text-muted">
          <Icon name="bar_chart" size={32} className="mx-auto mb-2 opacity-50" decorative />
          <p className="text-sm">No data available</p>
        </div>
      );
    }

    // Render full content when data is loaded
    return (
      <>
        {/* Database Selector - Compact Right-Aligned */}
        <div className="mb-6 flex justify-end">
          <select
            value={selectedDatabaseId || ''}
            onChange={(e) => setSelectedDatabaseId(Number(e.target.value))}
            title={data?.databases.list.find(db => db.id === selectedDatabaseId)?.name || 'Select Database'}
            className="h-[30px] px-2 pr-6 rounded border border-bridge-border-primary bg-bridge-bg-secondary text-bridge-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            style={{
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.25rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1em 1em',
            }}
          >
            {data.databases.list.map((db) => (
              <option key={db.id} value={db.id}>
                {db.name}
              </option>
            ))}
          </select>
        </div>

        {/* Query Interface */}
        <div className="p-4 rounded-lg border border-bridge-border-primary bg-bridge-bg-secondary">
          {/* Active Database Indicator */}
          {selectedDatabaseId && (
            <div className="mb-4 px-3 py-2 rounded-lg" style={{
              background: 'rgba(240, 147, 251, 0.1)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(240, 147, 251, 0.3)',
            }}>
              <div className="flex items-center gap-2">
                <Icon name="check_circle" size={16} style={{ color: '#f093fb' }} decorative />
                <span className="text-sm font-medium" style={{ color: '#f093fb' }}>
                  Active Database: {data?.databases.list.find(db => db.id === selectedDatabaseId)?.name || 'Unknown'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-bridge-text-primary flex items-center gap-2">
              <Icon name="terminal" size={16} className="text-bridge-accent-yellow" decorative />
              Query Interface
            </h4>
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-bridge-bg-tertiary rounded-lg p-1">
              <button
                onClick={() => setQueryMode('sql')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  queryMode === 'sql'
                    ? 'bg-bridge-accent-yellow text-bridge-bg-primary'
                    : 'text-bridge-text-secondary hover:text-bridge-text-primary'
                }`}
              >
                {queryMode === 'sql' && (
                  <Icon name="check_circle" size={12} decorative />
                )}
                SQL
              </button>
              <button
                onClick={() => setQueryMode('natural')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  queryMode === 'natural'
                    ? 'bg-bridge-accent-yellow text-bridge-bg-primary'
                    : 'text-bridge-text-secondary hover:text-bridge-text-primary'
                }`}
              >
                {queryMode === 'natural' && (
                  <Icon name="check_circle" size={12} decorative />
                )}
                Natural Language
              </button>
            </div>
          </div>

          {/* Query Input */}
          <div className="space-y-3">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                queryMode === 'sql'
                  ? 'Enter SQL query... (Cmd/Ctrl+Enter to execute)'
                  : 'Ask a question in plain English... (Cmd/Ctrl+Enter to execute)'
              }
              className="w-full h-24 px-3 py-2 rounded-lg bg-bridge-bg-tertiary text-bridge-text-primary placeholder-bridge-text-muted focus:outline-none focus:ring-2 focus:ring-bridge-accent-yellow text-sm font-mono resize-none"
              disabled={isQueryExecuting}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-bridge-text-muted">
                {queryMode === 'sql' ? 'Use SQL syntax' : 'Ask questions in natural language'}
              </span>
              <button
                onClick={executeQuery}
                disabled={!query.trim() || isQueryExecuting}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  background: query.trim() && !isQueryExecuting
                    ? colors.tertiary
                    : colors.surfaceContainerHigh,
                  color: query.trim() && !isQueryExecuting ? colors.onTertiary : colors.onSurface,
                }}
              >
                {isQueryExecuting ? (
                  <>
                    <Icon name="progress_activity" size={16} className="w-4 h-4 animate-spin" decorative />
                    Executing...
                  </>
                ) : (
                  <>
                    <Icon name="play_arrow" size={16} className="w-4 h-4" decorative />
                    Execute Query
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Query Error */}
          {queryError && (
            <div className="mt-4 p-3 rounded-lg bg-bridge-accent-red/10 border border-bridge-accent-red/30">
              <div className="flex items-start gap-2 text-bridge-accent-red">
                <Icon name="error" size={16} className="w-4 h-4 mt-0.5 flex-shrink-0" decorative />
                <span className="text-sm">{queryError}</span>
              </div>
            </div>
          )}

          {/* Query Results */}
          {queryResult && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-bridge-text-primary">Results</h5>
                <div className="text-xs text-bridge-text-muted">
                  {queryResult.data?.rows?.length || 0} rows
                  {queryResult.running_time && ` · ${queryResult.running_time}ms`}
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto rounded-lg border border-bridge-border-primary">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bridge-bg-tertiary border-b border-bridge-border-primary">
                      {(queryResult.data?.cols || []).map((col: any, idx: number) => (
                        <th
                          key={idx}
                          className="px-4 py-2 text-left text-xs font-semibold text-bridge-text-secondary"
                        >
                          {col.display_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(queryResult.data?.rows || []).slice(0, 50).map((row: any[], rowIdx: number) => (
                      <tr
                        key={rowIdx}
                        className="border-b border-bridge-border-primary last:border-b-0 hover:bg-bridge-bg-tertiary/50"
                      >
                        {row.map((cell: any, cellIdx: number) => (
                          <td key={cellIdx} className="px-4 py-2 text-bridge-text-primary">
                            {cell === null ? (
                              <span className="text-bridge-text-muted italic">null</span>
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(queryResult.data?.rows?.length || 0) > 50 && (
                <p className="text-xs text-bridge-text-muted text-center">
                  Showing first 50 of {queryResult.data.rows.length} rows
                </p>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  // Query execution handler
  const executeQuery = async () => {
    if (!query.trim()) return;
    if (!selectedDatabaseId) {
      setQueryError('Please select a database first');
      return;
    }

    // Find the selected database for logging
    const selectedDb = data?.databases.list.find(db => db.id === selectedDatabaseId);

    console.log('[MetabasePanel] Executing query:', {
      databaseId: selectedDatabaseId,
      databaseName: selectedDb?.name,
      databaseEngine: selectedDb?.engine,
      queryMode,
      queryPreview: query.trim().substring(0, 100)
    });

    setIsQueryExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      let finalQuery = query.trim();
      let actualDatabaseId = selectedDatabaseId;

      // If natural language mode, convert to SQL via chat API first
      if (queryMode === 'natural') {
        console.log('[MetabasePanel] Natural language query detected, converting to SQL...');

        const chatResponse = await fetch('/api/mcp/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemId: 'metabase',
            message: query.trim(),
          }),
        });

        const chatResult = await chatResponse.json();
        console.log('[MetabasePanel] Chat API response:', chatResult);

        // Check if chat API returned query results directly
        if (chatResult.success && chatResult.data) {
          // Chat API already executed the query, use its results
          console.log('[MetabasePanel] Using results from chat API');
          setQueryResult(chatResult.data);
          setIsQueryExecuting(false);
          return;
        }

        // If chat API didn't execute, it should have provided a message
        // For now, fallback to passing the query as-is
        console.log('[MetabasePanel] Chat API did not execute query, message:', chatResult.message);
        setQueryError(chatResult.message || 'Could not convert natural language to SQL. Try SQL mode or use the chat interface above.');
        setIsQueryExecuting(false);
        return;
      }

      // Execute SQL query directly
      const response = await fetch('/api/metabase/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: finalQuery,
          databaseId: actualDatabaseId,
          isNaturalLanguage: false, // Always false now since we convert NL to SQL first
        }),
      });

      const result = await response.json();

      console.log('[MetabasePanel] Query result:', result);
      console.log('[MetabasePanel] Data structure:', {
        hasData: !!result.data,
        hasRows: !!result.data?.data?.rows,
        rowCount: result.data?.data?.rows?.length,
        hasCols: !!result.data?.data?.cols,
        colCount: result.data?.data?.cols?.length,
      });

      if (result.success) {
        setQueryResult(result.data);
      } else {
        setQueryError(result.error || 'Failed to execute query');
      }
    } catch (err) {
      setQueryError('Network error executing query');
      console.error('Query execution error:', err);
    } finally {
      setIsQueryExecuting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      executeQuery();
    }
  };

  // Render content directly - parent container handles scrolling
  return renderContent();
}
