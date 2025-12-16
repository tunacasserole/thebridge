'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGitHubOpenPRs } from '@/hooks/useGitHubOpenPRs';
import { useGitHubMergedPRs } from '@/hooks/useGitHubMergedPRs';
import { OpenPR, MergedPR } from '@/lib/github';
import { colors } from '@/lib/colors';
import Icon from '@/components/ui/Icon';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

type PRState = 'open' | 'merged';

interface GitHubPRPanelProps {
  compact?: boolean;
  defaultExpanded?: boolean;
  refreshTrigger?: number;
}

// GitHub Octocat logo component
const GitHubLogo = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
    />
  </svg>
);

export default function GitHubPRPanel({
  compact = false,
  defaultExpanded = false,
  refreshTrigger
}: GitHubPRPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [prState, setPrState] = useState<PRState>('open');
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [showDrafts, setShowDrafts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: openData, loading: openLoading, error: openError, refetch: refetchOpen } = useGitHubOpenPRs(REFRESH_INTERVAL, refreshTrigger);
  const { data: mergedData, loading: mergedLoading, error: mergedError, refetch: refetchMerged } = useGitHubMergedPRs(REFRESH_INTERVAL, refreshTrigger);

  // Use the appropriate data based on selected state
  const data = prState === 'open' ? openData : mergedData;
  const loading = prState === 'open' ? openLoading : mergedLoading;
  const error = prState === 'open' ? openError : mergedError;
  const refetch = prState === 'open' ? refetchOpen : refetchMerged;

  useEffect(() => {
    if (defaultExpanded && !data && !loading) {
      refetch();
    }
  }, [defaultExpanded, data, loading, refetch]);

  // Extract unique repositories and authors
  const repositories = useMemo(() => {
    if (prState === 'open' && openData?.openPRs) {
      const repos = Array.from(new Set(openData.openPRs.map(pr => pr.repository)));
      return repos.sort();
    } else if (prState === 'merged' && mergedData?.mergedPRs) {
      const repos = Array.from(new Set(mergedData.mergedPRs.map(pr => pr.repository)));
      return repos.sort();
    }
    return [];
  }, [prState, openData, mergedData]);

  const authors = useMemo(() => {
    if (prState === 'open' && openData?.openPRs) {
      const authorSet = Array.from(new Set(openData.openPRs.map(pr => pr.author)));
      return authorSet.sort();
    } else if (prState === 'merged' && mergedData?.mergedPRs) {
      const authorSet = Array.from(new Set(mergedData.mergedPRs.map(pr => pr.author)));
      return authorSet.sort();
    }
    return [];
  }, [prState, openData, mergedData]);

  // Filter PRs based on selected filters
  const filteredPRs = useMemo(() => {
    let prs: (OpenPR | MergedPR)[] = [];

    if (prState === 'open' && openData?.openPRs) {
      prs = openData.openPRs;
    } else if (prState === 'merged' && mergedData?.mergedPRs) {
      prs = mergedData.mergedPRs;
    }

    return prs.filter(pr => {
      // Repository filter
      if (selectedRepo !== 'all' && pr.repository !== selectedRepo) return false;

      // Author filter
      if (selectedAuthor !== 'all' && pr.author !== selectedAuthor) return false;

      // Draft filter (only applies to open PRs)
      if (prState === 'open' && !showDrafts && 'draft' in pr && pr.draft) return false;

      // Search filter
      if (searchTerm && !pr.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [prState, openData, mergedData, selectedRepo, selectedAuthor, showDrafts, searchTerm]);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetch();
  };

  const handleExpand = () => {
    setIsExpanded(true);
    if (!data && !loading) {
      refetch();
    }
  };

  // Get total count based on state
  const totalCount = prState === 'open'
    ? (openData?.summary.totalOpen ?? 0)
    : (mergedData?.summary.totalMerged ?? 0);

  // Collapsed state - Circular avatar button (matching Jira/Claude Code pattern)
  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
        style={{
          background: 'var(--gradient-github)',
          boxShadow: '0 4px 12px rgba(36, 41, 46, 0.3)',
        }}
        aria-label="Expand GitHub Pull Requests panel"
      >
        <GitHubLogo size={28} />

        {/* PR Count Badge */}
        {totalCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: colors.success,
              color: 'var(--md-on-success)',
              border: '2px solid white',
            }}
          >
            {totalCount > 99 ? '99+' : totalCount}
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
          GitHub Pull Requests{totalCount > 0 && ` (${totalCount})`}
        </span>
      </button>
    );
  }

  // Full expanded version
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--md-surface-container)',
        border: '1px solid var(--md-outline-variant)',
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
              {data ? `${filteredPRs.length} of ${totalCount} ${prState} PRs` : 'Pull requests'}
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
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-bridge-accent-red/10 border border-bridge-accent-red/30 mb-4">
          <p className="text-sm text-bridge-accent-red">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* State Filter (Open/Merged) */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPrState('open')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
                prState === 'open' ? 'shadow-md' : ''
              }`}
              style={prState === 'open' ? {
                background: 'var(--md-primary)',
                color: 'var(--md-on-primary)',
              } : {
                background: 'var(--md-surface-container-highest)',
                color: 'var(--md-on-surface-variant)',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon name="pending" size={16} decorative />
                Open ({openData?.summary.totalOpen ?? 0})
              </div>
            </button>

            <button
              onClick={() => setPrState('merged')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
                prState === 'merged' ? 'shadow-md' : ''
              }`}
              style={prState === 'merged' ? {
                background: colors.emerald,
                color: 'var(--md-on-success)',
              } : {
                background: 'var(--md-surface-container-highest)',
                color: 'var(--md-on-surface-variant)',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon name="check_circle" size={16} decorative />
                Merged ({mergedData?.summary.totalMerged ?? 0})
              </div>
            </button>
          </div>

          {/* Filters Section */}
          <div className="mb-4 space-y-3">
            {/* Filter Controls Row */}
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
                    <option key={repo} value={repo}>
                      {repo} ({data.summary.byRepo[repo] || 0})
                    </option>
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
                  <option value="all">All Authors ({authors.length})</option>
                  {authors.map(author => (
                    <option key={author} value={author}>
                      {author}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-[300px]">
                <Icon
                  name="search"
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-bridge-text-muted"
                  decorative
                />
                <input
                  type="text"
                  placeholder="Search pull requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-bridge-text-primary placeholder-bridge-text-muted bg-bridge-bg-card border border-bridge-outline-variant focus:border-bridge-accent-cyan focus:outline-none"
                />
              </div>

              {/* Draft Toggle (only for open PRs) */}
              {prState === 'open' && (
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
                Showing {filteredPRs.length} of {totalCount} PRs
              </div>
            </div>
          </div>

          {/* PR List */}
          {filteredPRs.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredPRs.map((pr) => {
                // Type guard to determine if PR is open or merged
                const isOpenPR = 'createdAgo' in pr;
                const timeAgo = isOpenPR ? (pr as OpenPR).createdAgo : (pr as MergedPR).mergedAgo;
                const isDraft = isOpenPR && (pr as OpenPR).draft;

                return (
                  <a
                    key={pr.id}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-4 rounded-xl transition-all duration-200 hover:shadow-lg cursor-pointer block"
                    style={{
                      background: 'var(--md-surface-container-high)',
                      border: '1px solid var(--md-outline-variant)',
                    }}
                  >
                    {/* PR Author Avatar */}
                    <img
                      src={pr.authorAvatar}
                      alt={pr.author}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />

                    {/* PR Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="flex items-start gap-2 mb-2">
                        <Icon
                          name={prState === 'merged' ? 'check_circle' : 'merge'}
                          size={16}
                          style={{ color: prState === 'merged' ? colors.emerald : colors.success }}
                          decorative
                        />
                        <h4 className="text-base font-semibold group-hover:text-opacity-80 transition-all flex-1" style={{ color: 'var(--md-on-surface)' }}>
                          {pr.title}
                          {isDraft && (
                            <span
                              className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: `${colors.outlineVariant}22`, color: colors.outlineVariant }}
                            >
                              Draft
                            </span>
                          )}
                        </h4>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                        <span className="font-mono">#{pr.number}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Icon name="folder" size={12} decorative />
                          {pr.repository}
                        </span>
                        <span>•</span>
                        <span>{pr.author}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Icon name="schedule" size={12} decorative />
                          {timeAgo}
                        </span>
                        {!isOpenPR && 'branch' in pr && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Icon name="source" size={12} decorative />
                              {(pr as MergedPR).branch}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* External Link Icon */}
                    <Icon
                      name="open_in_new"
                      size={18}
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
                {searchTerm || selectedRepo !== 'all' || selectedAuthor !== 'all' || !showDrafts
                  ? 'No PRs match your filters'
                  : 'No open pull requests'}
              </p>
              {(searchTerm || selectedRepo !== 'all' || selectedAuthor !== 'all' || !showDrafts) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRepo('all');
                    setSelectedAuthor('all');
                    setShowDrafts(true);
                  }}
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
        </>
      )}

      {!loading && !data && !error && (
        <div className="py-12 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--md-surface-container-highest)' }}
          >
            <Icon name="refresh" size={40} color="var(--md-on-surface-variant)" decorative />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--md-on-surface)' }}>
            No data loaded
          </h3>
          <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            Click the refresh button above to load GitHub PRs
          </p>
        </div>
      )}

      {loading && !data && (
        <div className="space-y-3">
          <div className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--md-surface-container-high)' }} />
          <div className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--md-surface-container-high)' }} />
          <div className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--md-surface-container-high)' }} />
        </div>
      )}
    </div>
  );
}
