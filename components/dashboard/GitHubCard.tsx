'use client';

import { useState } from 'react';
import { useGitHubMergedPRs } from '@/hooks/useGitHubMergedPRs';
import { useGitHubOpenPRs } from '@/hooks/useGitHubOpenPRs';
import { colors } from '@/lib/colors';
import Icon from '@/components/ui/Icon';
import { MergedPR, OpenPR } from '@/lib/github';

interface GitHubCardProps {
  compact?: boolean;
  refreshTrigger?: number;
}

type ViewMode = 'open' | 'merged';

export default function GitHubCard({ compact = false, refreshTrigger }: GitHubCardProps) {
  const mergedData = useGitHubMergedPRs(5 * 60 * 1000, refreshTrigger);
  const openData = useGitHubOpenPRs(5 * 60 * 1000, refreshTrigger);
  const [expanded, setExpanded] = useState(!compact);
  const [viewMode, setViewMode] = useState<ViewMode>('open');

  // Use data from the active view
  const { data, loading, error, refetch } = viewMode === 'open' ? openData : mergedData;

  // Group PRs by repository (works for both open and merged)
  const groupedPRs = viewMode === 'merged'
    ? (mergedData.data?.mergedPRs.reduce((acc, pr) => {
        if (!acc[pr.repository]) {
          acc[pr.repository] = [];
        }
        acc[pr.repository].push(pr);
        return acc;
      }, {} as Record<string, MergedPR[]>) || {})
    : (openData.data?.openPRs.reduce((acc, pr) => {
        if (!acc[pr.repository]) {
          acc[pr.repository] = [];
        }
        acc[pr.repository].push(pr);
        return acc;
      }, {} as Record<string, OpenPR[]>) || {});

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetch();
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <h3 className="text-lg font-bold text-bridge-accent-yellow flex items-center gap-2">
            <span>🐙</span> GitHub PRs
          </h3>
          <Icon
            name={expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            size={20}
            className="text-bridge-text-muted"
            decorative
          />
        </button>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-bridge-text-muted flex items-center gap-1">
              <Icon name="refresh" size={12} className="w-3 h-3 animate-spin" decorative /> Loading...
            </span>
          ) : error ? (
            <span className="text-xs text-bridge-accent-red flex items-center gap-1">
              <Icon name="warning" size={12} className="w-3 h-3" decorative /> Error
            </span>
          ) : viewMode === 'open' && openData.data ? (
            <span className="text-xs text-bridge-text-muted">
              {openData.data.summary.totalOpen} open PRs
            </span>
          ) : viewMode === 'merged' && mergedData.data ? (
            <span className="text-xs text-bridge-text-muted">
              {mergedData.data.summary.totalMerged} merged PRs
            </span>
          ) : null}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-bridge-bg-elevated hover:bg-bridge-bg-tertiary transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <Icon
              name="refresh"
              size={16}
              className={`w-4 h-4 text-bridge-text-secondary ${loading ? 'animate-spin' : ''}`}
              decorative
            />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-bridge-accent-red/10 border border-bridge-accent-red/30 mb-4">
          <p className="text-sm text-bridge-accent-red">{error}</p>
          <p className="text-xs text-bridge-text-muted mt-1">
            Check your GitHub configuration in .env.local
          </p>
        </div>
      )}

      {/* View Mode Tabs */}
      {!error && expanded && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('open')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'open'
                ? 'bg-bridge-accent-purple text-white'
                : 'bg-bridge-bg-elevated text-bridge-text-secondary hover:bg-bridge-bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon name="pending" size={16} decorative />
              Open ({openData.data?.summary.totalOpen || 0})
            </span>
          </button>
          <button
            onClick={() => setViewMode('merged')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'merged'
                ? 'bg-bridge-accent-purple text-white'
                : 'bg-bridge-bg-elevated text-bridge-text-secondary hover:bg-bridge-bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon name="merge" size={16} decorative />
              Merged ({mergedData.data?.summary.totalMerged || 0})
            </span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-bridge-bg-elevated animate-pulse" />
          ))}
        </div>
      )}

      {/* Expanded View */}
      {expanded && !loading && !error && (viewMode === 'open' ? openData.data : mergedData.data) && (
        <div className="space-y-4">
          {/* Repository Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {(viewMode === 'merged' ? mergedData.data?.repositories : openData.data ? mergedData.data?.repositories : [])?.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl hover:scale-[1.02] transition-all"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}08)`,
                  border: `1px solid ${colors.primary}40`,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon name="folder_open" size={16} style={{ color: colors.primary }} decorative />
                    <h4 className="text-sm font-bold text-bridge-text-primary">{repo.name}</h4>
                  </div>
                  <Icon name="open_in_new" size={14} className="text-bridge-text-muted" decorative />
                </div>

                {repo.description && (
                  <p className="text-xs text-bridge-text-muted mb-3 line-clamp-2">{repo.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs" style={{ color: colors.warning }}>
                      <Icon name="star" size={12} decorative />
                      <span className="font-bold">{repo.stars}</span>
                    </div>
                    <div className="text-xs text-bridge-text-muted mt-0.5">stars</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs" style={{ color: colors.success }}>
                      <Icon name={viewMode === 'open' ? 'pending' : 'merge'} size={12} decorative />
                      <span className="font-bold">
                        {viewMode === 'open'
                          ? openData.data?.summary.byRepo[repo.name] || 0
                          : mergedData.data?.summary.byRepo[repo.name] || 0}
                      </span>
                    </div>
                    <div className="text-xs text-bridge-text-muted mt-0.5">{viewMode === 'open' ? 'open' : 'merged'}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs" style={{ color: colors.error }}>
                      <Icon name="bug_report" size={12} decorative />
                      <span className="font-bold">{repo.openIssues}</span>
                    </div>
                    <div className="text-xs text-bridge-text-muted mt-0.5">issues</div>
                  </div>
                </div>

                {repo.language && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-bridge-text-muted">
                    <Icon name="code" size={12} decorative />
                    <span>{repo.language}</span>
                  </div>
                )}
              </a>
            ))}
          </div>

          {/* PRs by Repository */}
          {Object.entries(groupedPRs).map(([repo, prs]) => {
            const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || 'your-org';
            const repoUrl = `https://github.com/${owner}/${repo}`;
            const pullsUrl = `${repoUrl}/pulls${viewMode === 'open' ? '?q=is%3Aopen+is%3Apr' : '?q=is%3Amerged+is%3Apr+sort%3Aupdated-desc'}`;

            return (
              <div key={repo} className="space-y-2">
                {/* Repository Header with Links */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-bridge-bg-elevated border border-bridge-border-muted">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}15)`,
                      }}
                    >
                      <Icon name="folder_open" size={20} style={{ color: colors.primary }} decorative />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-bridge-text-primary">{repo}</h4>
                      <p className="text-xs text-bridge-text-muted">
                        {(prs as (MergedPR | OpenPR)[]).length} {viewMode === 'open' ? 'open' : 'merged'} PR{(prs as (MergedPR | OpenPR)[]).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Links */}
                  <div className="flex items-center gap-2">
                    <a
                      href={pullsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${colors.primary}20`,
                        color: colors.primary,
                        border: `1px solid ${colors.primary}40`,
                      }}
                      title={`View all ${viewMode === 'open' ? 'open' : 'merged'} PRs in GitHub`}
                    >
                      <Icon name="list" size={14} decorative />
                      View All
                    </a>
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-bridge-bg-tertiary transition-colors"
                      title="Open repository in GitHub"
                    >
                      <Icon name="open_in_new" size={16} className="text-bridge-text-muted" decorative />
                    </a>
                  </div>
                </div>
              {(prs as (MergedPR | OpenPR)[]).map((pr) => {
                const isMerged = 'mergedAt' in pr;
                const isDraft = 'draft' in pr && pr.draft;
                return (
                  <a
                    key={pr.id}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl bg-bridge-bg-elevated hover:bg-bridge-bg-tertiary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <img
                          src={pr.authorAvatar}
                          alt={pr.author}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs text-bridge-text-muted">#{pr.number}</span>
                            {isMerged ? (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-semibold"
                                style={{
                                  backgroundColor: `${colors.success}20`,
                                  color: colors.success,
                                  border: `1px solid ${colors.success}40`,
                                }}
                              >
                                Merged
                              </span>
                            ) : (
                              <>
                                <span
                                  className="px-2 py-0.5 rounded text-xs font-semibold"
                                  style={{
                                    backgroundColor: isDraft ? `${colors.warning}20` : `${colors.primary}20`,
                                    color: isDraft ? colors.warning : colors.primary,
                                    border: `1px solid ${isDraft ? colors.warning : colors.primary}40`,
                                  }}
                                >
                                  {isDraft ? 'Draft' : 'Open'}
                                </span>
                              </>
                            )}
                          </div>
                          <h5 className="text-sm font-medium text-bridge-text-primary mb-1 line-clamp-2">
                            {pr.title}
                          </h5>
                          <div className="flex items-center gap-3 text-xs text-bridge-text-muted">
                            <span className="flex items-center gap-1">
                              <Icon name="person" size={12} decorative />
                              {pr.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="schedule" size={12} decorative />
                              {isMerged ? (pr as MergedPR).mergedAgo : (pr as OpenPR).createdAgo}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Icon
                        name="open_in_new"
                        size={16}
                        className="text-bridge-accent-purple flex-shrink-0"
                        decorative
                      />
                    </div>
                  </a>
                );
              })}
              </div>
            );
          })}
        </div>
      )}

      {/* Compact View */}
      {!expanded && (openData.data || mergedData.data) && (
        <div className="text-sm text-bridge-text-secondary">
          Click to view {openData.data?.summary.totalOpen || 0} open and {mergedData.data?.summary.totalMerged || 0} merged PRs
        </div>
      )}

      {/* Footer */}
      {(openData.data || mergedData.data) && (
        <div className="mt-4 pt-4 border-t border-bridge-border-muted text-xs text-bridge-text-muted">
          Last updated: {new Date(
            viewMode === 'open'
              ? openData.data?.summary.lastUpdated || new Date()
              : mergedData.data?.summary.lastUpdated || new Date()
          ).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
