'use client';

import { useState, useMemo } from 'react';
import { useGitHubOpenPRs } from '@/hooks/useGitHubOpenPRs';
import { useGitHubMergedPRs } from '@/hooks/useGitHubMergedPRs';
import { OpenPR, MergedPR } from '@/lib/github';
import { colors } from '@/lib/colors';
import Icon from '@/components/ui/Icon';
import { PanelError, getErrorMessage } from './PanelStates';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

type ViewMode = 'open' | 'merged';

interface GitHubPanelProps {
  compact?: boolean;
  defaultExpanded?: boolean;
  refreshTrigger?: number;
  embedded?: boolean; // When true, hides internal header (used inside DashboardPanel)
}

export default function GitHubPanel({ compact = false, defaultExpanded = false, refreshTrigger, embedded = false }: GitHubPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<ViewMode>('open');
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [showDrafts, setShowDrafts] = useState(true);

  const { data: openData, loading: openLoading, error: openError, refetch: refetchOpen } = useGitHubOpenPRs(REFRESH_INTERVAL, refreshTrigger);
  const { data: mergedData, loading: mergedLoading, error: mergedError, refetch: refetchMerged } = useGitHubMergedPRs(REFRESH_INTERVAL, refreshTrigger);

  // Use the appropriate data based on selected state
  const data = viewMode === 'open' ? openData : mergedData;
  const loading = viewMode === 'open' ? openLoading : mergedLoading;
  const error = viewMode === 'open' ? openError : mergedError;

  const refetch = () => {
    refetchOpen();
    refetchMerged();
  };

  // Extract unique repositories and authors from both data sources
  const repositories = useMemo(() => {
    const repos = new Set<string>();
    if (openData?.openPRs) {
      openData.openPRs.forEach(pr => repos.add(pr.repository));
    }
    if (mergedData?.mergedPRs) {
      mergedData.mergedPRs.forEach(pr => repos.add(pr.repository));
    }
    return Array.from(repos).sort();
  }, [openData, mergedData]);

  const authors = useMemo(() => {
    const authorSet = new Set<string>();
    if (openData?.openPRs) {
      openData.openPRs.forEach(pr => authorSet.add(pr.author));
    }
    if (mergedData?.mergedPRs) {
      mergedData.mergedPRs.forEach(pr => authorSet.add(pr.author));
    }
    return Array.from(authorSet).sort();
  }, [openData, mergedData]);

  // Filter PRs based on selected filters
  const filteredPRs = useMemo(() => {
    let prs: (OpenPR | MergedPR)[] = [];

    if (viewMode === 'open' && openData?.openPRs) {
      prs = openData.openPRs;
    } else if (viewMode === 'merged' && mergedData?.mergedPRs) {
      prs = mergedData.mergedPRs;
    }

    return prs.filter(pr => {
      // Repository filter
      if (selectedRepo !== 'all' && pr.repository !== selectedRepo) return false;

      // Author filter
      if (selectedAuthor !== 'all' && pr.author !== selectedAuthor) return false;

      // Draft filter (only applies to open PRs)
      if (viewMode === 'open' && !showDrafts && 'draft' in pr && pr.draft) return false;

      return true;
    });
  }, [viewMode, openData, mergedData, selectedRepo, selectedAuthor, showDrafts]);

  // Get total counts
  const totalOpen = openData?.summary.totalOpen ?? 0;
  const totalMerged = mergedData?.summary.totalMerged ?? 0;

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetch();
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  // Clear all filters helper
  const clearFilters = () => {
    setSelectedRepo('all');
    setSelectedAuthor('all');
    setShowDrafts(true);
  };

  const hasActiveFilters = selectedRepo !== 'all' || selectedAuthor !== 'all' || !showDrafts;

  // Collapsed state (when not embedded in dashboard)
  if (!isExpanded && !embedded) {
    return (
      <div
        onClick={handleExpand}
        className="rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] w-full"
        style={{
          background: `linear-gradient(135deg, ${colors.tertiary}15, ${colors.primary}10)`,
          border: `2px solid ${colors.tertiary}44`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl"><Icon name="merge" size={20} style={{ color: colors.tertiary }} decorative /></span>
            <div>
              <h3 className="text-sm font-bold text-bridge-text-primary">GitHub PRs</h3>
              {(openLoading || mergedLoading) && !openData && !mergedData ? (
                <p className="text-xs text-bridge-text-muted flex items-center gap-1">
                  <Icon name="refresh" size={12} animate="animate-spin" decorative /> Loading...
                </p>
              ) : openError || mergedError ? (
                <p className="text-xs text-bridge-accent-red flex items-center gap-1">
                  <Icon name="warning" size={12} decorative /> Error connecting
                </p>
              ) : (
                <p className="text-xs text-bridge-text-muted">
                  <span style={{ color: colors.success }}>
                    {totalOpen} open
                  </span>
                  {' · '}
                  <span style={{ color: colors.secondary }}>
                    {totalMerged} merged
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalOpen > 0 && (
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: `${colors.success}22`, color: colors.success }}
              >
                {totalOpen} open
              </span>
            )}
            <Icon name="keyboard_arrow_down" size={16} className="text-bridge-text-muted" decorative />
          </div>
        </div>
      </div>
    );
  }

  // Compact view (embedded in dashboard panel)
  if (compact || embedded) {
    return (
      <div className="h-full flex flex-col">
        {/* View Mode Toggle */}
        <div className="flex gap-1.5 mb-2">
          <button
            onClick={() => setViewMode('open')}
            className={`flex-1 px-2 py-1 rounded text-xs font-bold uppercase transition-all ${
              viewMode === 'open' ? 'shadow-sm' : ''
            }`}
            style={viewMode === 'open' ? {
              background: colors.success,
              color: 'white',
            } : {
              background: 'var(--md-surface-container-highest)',
              color: 'var(--md-on-surface-variant)',
            }}
          >
            Open ({totalOpen})
          </button>
          <button
            onClick={() => setViewMode('merged')}
            className={`flex-1 px-2 py-1 rounded text-xs font-bold uppercase transition-all ${
              viewMode === 'merged' ? 'shadow-sm' : ''
            }`}
            style={viewMode === 'merged' ? {
              background: colors.secondary,
              color: 'white',
            } : {
              background: 'var(--md-surface-container-highest)',
              color: 'var(--md-on-surface-variant)',
            }}
          >
            Merged ({totalMerged})
          </button>
        </div>

        {/* Compact Filters Row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {/* Repository Selector */}
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-2 py-1 rounded text-xs bg-bridge-bg-card border border-bridge-outline-variant text-bridge-text-primary focus:border-bridge-accent-cyan focus:outline-none cursor-pointer"
          >
            <option value="all">All Repos ({repositories.length})</option>
            {repositories.map(repo => (
              <option key={repo} value={repo}>{repo}</option>
            ))}
          </select>

          {/* Author Selector */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="px-2 py-1 rounded text-xs bg-bridge-bg-card border border-bridge-outline-variant text-bridge-text-primary focus:border-bridge-accent-cyan focus:outline-none cursor-pointer"
          >
            <option value="all">All Users ({authors.length})</option>
            {authors.map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>

          {/* Draft Toggle (only for open PRs) */}
          {viewMode === 'open' && (
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                showDrafts
                  ? 'bg-bridge-accent-cyan/20 text-bridge-accent-cyan border border-bridge-accent-cyan'
                  : 'bg-bridge-bg-card text-bridge-text-muted border border-bridge-outline-variant'
              }`}
            >
              <Icon name={showDrafts ? "visibility" : "visibility_off"} size={12} decorative />
              Drafts
            </button>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 rounded text-xs text-bridge-text-muted hover:text-bridge-text-primary transition-colors"
            >
              Clear
            </button>
          )}

          {/* Results Count */}
          <span className="ml-auto text-[10px] text-bridge-text-muted">
            {filteredPRs.length}/{viewMode === 'open' ? totalOpen : totalMerged}
          </span>
        </div>

        {error && (
          <PanelError
            {...getErrorMessage(error)}
            onRetry={refetch}
            isRetrying={loading}
            className="mb-2"
          />
        )}

        {/* PR List */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {loading && !data ? (
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded bg-bridge-bg-card animate-pulse" />
              ))}
            </div>
          ) : filteredPRs.length > 0 ? (
            filteredPRs.map((pr) => {
              const isOpenPR = 'createdAgo' in pr;
              const timeAgo = isOpenPR ? (pr as OpenPR).createdAgo : (pr as MergedPR).mergedAgo;
              const isDraft = isOpenPR && (pr as OpenPR).draft;

              return (
                <a
                  key={pr.id}
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 p-1.5 rounded transition-colors hover:bg-bridge-bg-tertiary"
                  style={{ background: 'var(--md-surface-container-high)' }}
                >
                  <img
                    src={pr.authorAvatar}
                    alt={pr.author}
                    className="w-5 h-5 rounded-full flex-shrink-0"
                  />
                  <Icon
                    name={viewMode === 'merged' ? 'check_circle' : 'merge'}
                    size={12}
                    style={{ color: viewMode === 'merged' ? colors.secondary : colors.success }}
                    decorative
                    className="flex-shrink-0"
                  />
                  <span className="text-xs font-medium text-bridge-text-primary truncate flex-1 min-w-0">
                    {pr.title}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-bridge-text-muted flex-shrink-0">
                    {isDraft && (
                      <span className="px-1 py-0.5 rounded text-[9px]" style={{ background: `${colors.outlineVariant}22`, color: colors.outlineVariant }}>
                        Draft
                      </span>
                    )}
                    <span className="hidden sm:inline">{pr.repository}</span>
                    <span>#{pr.number}</span>
                    <span>{timeAgo}</span>
                  </div>
                </a>
              );
            })
          ) : (
            <div className="py-6 text-center">
              <Icon name="merge" size={24} className="mx-auto mb-2 text-bridge-text-muted" decorative />
              <p className="text-xs text-bridge-text-secondary">
                {hasActiveFilters ? 'No PRs match filters' : 'No pull requests'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 px-3 py-1 rounded text-xs font-medium"
                  style={{ background: colors.primary, color: 'white' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full expanded version (standalone)
  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: `linear-gradient(135deg, ${colors.tertiary}15, ${colors.primary}10)`,
        border: `2px solid ${colors.tertiary}44`,
      }}
    >
      <div
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(false)}
      >
        <div className="flex items-center gap-3">
          <Icon name="merge" size={24} style={{ color: colors.tertiary }} decorative />
          <div>
            <h3 className="text-lg font-bold text-bridge-text-primary">GitHub Pull Requests</h3>
            <p className="text-xs text-bridge-text-muted">
              {filteredPRs.length} of {viewMode === 'open' ? totalOpen : totalMerged} {viewMode} PRs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-bridge-text-muted flex items-center gap-1">
              <Icon name="refresh" size={12} animate="animate-spin" decorative />
              Loading...
            </span>
          ) : error ? (
            <span className="text-xs text-bridge-accent-red flex items-center gap-1">
              <Icon name="warning" size={12} decorative />
              Error
            </span>
          ) : (
            <span className="text-xs text-bridge-text-muted flex items-center gap-1">
              <Icon name="check_circle" size={12} className="text-bridge-status-migrated" decorative />
              Live
            </span>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-bridge-bg-card hover:bg-bridge-bg-tertiary transition-colors disabled:opacity-50"
          >
            <Icon name="refresh" size={16} className="text-bridge-text-secondary" animate={loading ? "animate-spin" : undefined} decorative />
          </button>

          <Icon name="keyboard_arrow_up" size={20} className="text-bridge-text-muted" decorative />
        </div>
      </div>

      {error && (
        <PanelError
          {...getErrorMessage(error)}
          onRetry={refetch}
          isRetrying={loading}
          className="mb-4"
        />
      )}

      {/* State Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('open')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
            viewMode === 'open' ? 'shadow-md' : ''
          }`}
          style={viewMode === 'open' ? {
            background: colors.success,
            color: 'white',
          } : {
            background: 'var(--md-surface-container-highest)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Icon name="pending" size={16} decorative />
            Open ({totalOpen})
          </div>
        </button>

        <button
          onClick={() => setViewMode('merged')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
            viewMode === 'merged' ? 'shadow-md' : ''
          }`}
          style={viewMode === 'merged' ? {
            background: colors.secondary,
            color: 'white',
          } : {
            background: 'var(--md-surface-container-highest)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Icon name="check_circle" size={16} decorative />
            Merged ({totalMerged})
          </div>
        </button>
      </div>

      {/* Filters Section */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Repository Selector */}
          <div className="flex items-center gap-2">
            <Icon name="folder" size={16} className="text-bridge-text-muted" decorative />
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm bg-bridge-bg-card border border-bridge-outline-variant text-bridge-text-primary focus:border-bridge-accent-cyan focus:outline-none cursor-pointer"
            >
              <option value="all">All Repos ({repositories.length})</option>
              {repositories.map(repo => (
                <option key={repo} value={repo}>{repo}</option>
              ))}
            </select>
          </div>

          {/* Author Selector */}
          <div className="flex items-center gap-2">
            <Icon name="person" size={16} className="text-bridge-text-muted" decorative />
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm bg-bridge-bg-card border border-bridge-outline-variant text-bridge-text-primary focus:border-bridge-accent-cyan focus:outline-none cursor-pointer"
            >
              <option value="all">All Users ({authors.length})</option>
              {authors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>

          {/* Draft Toggle (only for open PRs) */}
          {viewMode === 'open' && (
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showDrafts
                  ? 'bg-bridge-accent-cyan/20 text-bridge-accent-cyan border border-bridge-accent-cyan'
                  : 'bg-bridge-bg-card text-bridge-text-muted border border-bridge-outline-variant'
              }`}
            >
              <Icon name={showDrafts ? "visibility" : "visibility_off"} size={16} decorative />
              Show Drafts
            </button>
          )}

          {/* Results Count */}
          <div className="ml-auto text-xs text-bridge-text-muted">
            Showing {filteredPRs.length} of {viewMode === 'open' ? totalOpen : totalMerged} PRs
          </div>
        </div>
      </div>

      {/* PR List */}
      {filteredPRs.length > 0 ? (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {filteredPRs.map((pr) => {
            const isOpenPR = 'createdAgo' in pr;
            const timeAgo = isOpenPR ? (pr as OpenPR).createdAgo : (pr as MergedPR).mergedAgo;
            const isDraft = isOpenPR && (pr as OpenPR).draft;

            return (
              <a
                key={pr.id}
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200 hover:shadow-md"
                style={{
                  background: 'var(--md-surface-container-high)',
                  border: '1px solid var(--md-outline-variant)',
                }}
              >
                <img
                  src={pr.authorAvatar}
                  alt={pr.author}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                />
                <Icon
                  name={viewMode === 'merged' ? 'check_circle' : 'merge'}
                  size={14}
                  style={{ color: viewMode === 'merged' ? colors.secondary : colors.success }}
                  decorative
                  className="flex-shrink-0"
                />
                <h4 className="text-sm font-semibold group-hover:text-opacity-80 transition-all truncate flex-1 min-w-0" style={{ color: 'var(--md-on-surface)' }}>
                  {pr.title}
                </h4>
                <div className="flex items-center gap-2 text-xs flex-shrink-0" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {isDraft && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: `${colors.outlineVariant}22`, color: colors.outlineVariant }}
                    >
                      Draft
                    </span>
                  )}
                  <span className="font-mono">#{pr.number}</span>
                  <span className="hidden sm:inline">{pr.repository}</span>
                  <span className="flex items-center gap-1">
                    <Icon name="schedule" size={10} decorative />
                    {timeAgo}
                  </span>
                </div>
                <Icon
                  name="open_in_new"
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  color="var(--md-on-surface-variant)"
                  decorative
                />
              </a>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--md-surface-container-highest)' }}
          >
            <Icon name="merge" size={32} color="var(--md-on-surface-variant)" decorative />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--md-on-surface)' }}>
            No pull requests found
          </h3>
          <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            {hasActiveFilters ? 'No PRs match your filters' : `No ${viewMode} pull requests`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow-md"
              style={{
                background: 'var(--md-primary)',
                color: 'var(--md-on-primary)',
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {loading && !data && (
        <div className="space-y-3">
          <div className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--md-surface-container-high)' }} />
          <div className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--md-surface-container-high)' }} />
        </div>
      )}
    </div>
  );
}
