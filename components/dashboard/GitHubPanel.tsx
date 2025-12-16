'use client';

import { useState } from 'react';
import { useGitHubData } from '@/hooks/useGitHubData';
import { Commit, PullRequest } from '@/lib/github';
import { colors } from '@/lib/colors';
import Icon from '@/components/ui/Icon';
import { PanelSkeleton, PanelError, getErrorMessage } from './PanelStates';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

type ViewMode = 'commits' | 'prs';

interface GitHubPanelProps {
  compact?: boolean;
  defaultExpanded?: boolean;
  refreshTrigger?: number;
  embedded?: boolean; // When true, hides internal header (used inside DashboardPanel)
}

export default function GitHubPanel({ compact = false, defaultExpanded = false, refreshTrigger, embedded = false }: GitHubPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<ViewMode>('commits');
  const { data, loading, error, refetch } = useGitHubData(REFRESH_INTERVAL, refreshTrigger);

  const getPRStateColor = (state: 'open' | 'closed' | 'merged') => {
    switch (state) {
      case 'open':
        return colors.success;
      case 'merged':
        return colors.secondary;
      case 'closed':
        return colors.error;
      default:
        return colors.outlineVariant;
    }
  };

  const getPRStateIcon = (state: 'open' | 'closed' | 'merged') => {
    switch (state) {
      case 'open':
        return <Icon name="merge" size={16} decorative />;
      case 'merged':
        return <Icon name="check_circle" size={16} decorative />;
      case 'closed':
        return <Icon name="cancel" size={16} decorative />;
      default:
        return <Icon name="merge" size={16} decorative />;
    }
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetch();
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  // Collapsed state
  if (!isExpanded) {
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
            <span className="text-xl"><Icon name="account_tree" size={20} style={{ color: colors.tertiary }} decorative /></span>
            <div>
              <h3 className="text-sm font-bold text-bridge-text-primary">GitHub</h3>
              {loading && !data ? (
                <p className="text-xs text-bridge-text-muted flex items-center gap-1">
                  <Icon name="refresh" size={12} animate="animate-spin" decorative /> Loading...
                </p>
              ) : error ? (
                <p className="text-xs text-bridge-accent-red flex items-center gap-1">
                  <Icon name="warning" size={12} decorative /> Error connecting
                </p>
              ) : data ? (
                <p className="text-xs text-bridge-text-muted">
                  {data.summary.commitsToday > 0 ? (
                    <span style={{ color: colors.success }}>
                      {data.summary.commitsToday} commit{data.summary.commitsToday !== 1 ? 's' : ''} today
                    </span>
                  ) : (
                    <span>
                      {data.summary.openPRs} open PR{data.summary.openPRs !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data && data.summary.openPRs > 0 && (
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: `${colors.success}22`, color: colors.success }}
              >
                {data.summary.openPRs} open
              </span>
            )}
            <Icon name="keyboard_arrow_down" size={16} className="text-bridge-text-muted" decorative />
          </div>
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
          background: `linear-gradient(135deg, ${colors.tertiary}15, ${colors.primary}10)`,
          border: `2px solid ${colors.tertiary}44`,
        }}
      >
        <div
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => setIsExpanded(false)}
        >
          <div className="flex items-center gap-2">
            <Icon name="account_tree" size={16} style={{ color: colors.tertiary }} decorative />
            <h3 className="text-sm font-bold text-bridge-text-primary">
              {data?.repository.name || 'GitHub'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {loading && <Icon name="refresh" size={12} animate="animate-spin" className="text-bridge-text-muted" decorative />}
            {error && <Icon name="warning" size={12} className="text-bridge-accent-red" decorative />}
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
          <PanelError
            {...getErrorMessage(error)}
            onRetry={refetch}
            isRetrying={loading}
            className="mb-3"
          />
        )}

        {data && (
          <>
            <div className="flex items-center gap-4 mb-3 text-xs">
              <span style={{ color: colors.success }}>
                <strong className="text-lg">{data.summary.commitsToday}</strong> today
              </span>
              <span className="text-bridge-text-muted">|</span>
              <span style={{ color: colors.primary }}>
                <strong>{data.summary.openPRs}</strong> open PRs
              </span>
              <span className="text-bridge-text-muted">|</span>
              <span style={{ color: colors.warning }}>
                <strong>{data.repository.stars}</strong> stars
              </span>
            </div>

            {data.commits.length > 0 ? (
              <div className="space-y-1.5">
                {data.commits.slice(0, 5).map((commit: Commit) => (
                  <div
                    key={commit.sha}
                    className="flex items-center gap-2 p-2 rounded bg-bridge-bg-card text-xs"
                  >
                    <Icon name="commit" size={12} style={{ color: colors.tertiary }} decorative />
                    <span className="flex-1 truncate text-bridge-text-primary">
                      {commit.messageShort}
                    </span>
                    <span className="text-bridge-text-muted flex items-center gap-1">
                      <Icon name="schedule" size={10} decorative />
                      {commit.duration}
                    </span>
                  </div>
                ))}
                {data.commits.length > 5 && (
                  <p className="text-xs text-bridge-text-muted text-center pt-1">
                    +{data.commits.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 text-center rounded bg-bridge-bg-card">
                <Icon name="account_tree" size={20} className="mx-auto mb-1 text-bridge-text-muted" decorative />
                <p className="text-xs text-bridge-text-secondary">No recent commits</p>
              </div>
            )}
          </>
        )}

        {loading && !data && (
          <div className="h-20 rounded bg-bridge-bg-card animate-pulse" />
        )}
      </div>
    );
  }

  // Full expanded version
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
          <Icon name="account_tree" size={24} style={{ color: colors.tertiary }} decorative />
          <div>
            <h3 className="text-lg font-bold text-bridge-text-primary">
              {data?.repository.name || 'GitHub'}
            </h3>
            <p className="text-xs text-bridge-text-muted">
              {data?.repository.fullName || 'Repository activity'}
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

          {data && (
            <a
              href={data.repository.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg bg-bridge-bg-card hover:bg-bridge-bg-tertiary transition-colors text-bridge-text-secondary hover:text-bridge-accent-cyan"
              title="Open in GitHub"
            >
              <Icon name="open_in_new" size={16} decorative />
            </a>
          )}

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

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <button
              onClick={() => setViewMode('commits')}
              className={`p-4 rounded-xl text-center transition-all hover:scale-105 flex flex-col items-center justify-center ${
                viewMode === 'commits' ? '' : 'bg-bridge-bg-card'
              }`}
              style={
                viewMode === 'commits'
                  ? {
                      background: `${colors.tertiary}22`,
                      border: `2px solid ${colors.tertiary}`,
                      height: '100px',
                    }
                  : { border: '2px solid transparent', height: '100px' }
              }
            >
              <div className="text-3xl font-bold mb-1" style={{ color: colors.tertiary }}>
                {data.summary.commitsThisWeek}
              </div>
              <div className="text-xs text-bridge-text-muted">Commits</div>
            </button>
            <button
              onClick={() => setViewMode('prs')}
              className={`p-4 rounded-xl text-center transition-all hover:scale-105 flex flex-col items-center justify-center ${
                viewMode === 'prs' ? '' : 'bg-bridge-bg-card'
              }`}
              style={
                viewMode === 'prs'
                  ? {
                      background: `${colors.success}22`,
                      border: `2px solid ${colors.success}`,
                      height: '100px',
                    }
                  : { border: '2px solid transparent', height: '100px' }
              }
            >
              <div className="text-3xl font-bold mb-1" style={{ color: colors.success }}>
                {data.summary.openPRs}
              </div>
              <div className="text-xs text-bridge-text-muted">Open PRs</div>
            </button>
            <div className="p-4 rounded-xl bg-bridge-bg-card text-center flex flex-col items-center justify-center" style={{ height: '100px' }}>
              <div className="text-3xl font-bold mb-1 flex items-center gap-1" style={{ color: colors.warning }}>
                <Icon name="star" size={20} decorative />
                {data.repository.stars}
              </div>
              <div className="text-xs text-bridge-text-muted">Stars</div>
            </div>
            <div className="p-4 rounded-xl bg-bridge-bg-card text-center flex flex-col items-center justify-center" style={{ height: '100px' }}>
              <div className="text-3xl font-bold mb-1 flex items-center gap-1" style={{ color: colors.primary }}>
                <Icon name="fork_right" size={20} decorative />
                {data.repository.forks}
              </div>
              <div className="text-xs text-bridge-text-muted">Forks</div>
            </div>
            <div className="p-4 rounded-xl bg-bridge-bg-card text-center flex flex-col items-center justify-center" style={{ height: '100px' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: colors.error }}>
                {data.repository.openIssues}
              </div>
              <div className="text-xs text-bridge-text-muted">Issues</div>
            </div>
          </div>

          {viewMode === 'commits' && (
            data.commits.length > 0 ? (
              <>
                <h4 className="text-sm font-semibold text-bridge-text-secondary flex items-center gap-2 mb-2">
                  <Icon name="commit" size={16} decorative />
                  Recent Commits
                </h4>
                <div className="space-y-1.5">
                  {data.commits.map((commit: Commit) => (
                    <a
                      key={commit.sha}
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-bridge-bg-card hover:bg-bridge-bg-tertiary transition-colors"
                    >
                      {commit.authorAvatar ? (
                        <img src={commit.authorAvatar} alt={commit.author} className="w-6 h-6 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-bridge-bg-tertiary flex items-center justify-center text-xs flex-shrink-0">
                          {commit.author[0]}
                        </div>
                      )}
                      <span className="text-sm font-medium text-bridge-text-primary truncate flex-1 min-w-0">
                        {commit.messageShort}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-bridge-text-muted flex-shrink-0">
                        <span className="font-mono">{commit.shortSha}</span>
                        <span className="flex items-center gap-1">
                          <Icon name="schedule" size={10} decorative />
                          {commit.duration}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-6 text-center rounded-xl bg-bridge-bg-card">
                <Icon name="commit" size={32} className="mx-auto mb-2 text-bridge-text-muted" decorative />
                <p className="text-sm text-bridge-text-secondary">No recent commits</p>
              </div>
            )
          )}

          {viewMode === 'prs' && (
            data.pullRequests.length > 0 ? (
              <>
                <h4 className="text-sm font-semibold text-bridge-text-secondary flex items-center gap-2 mb-2">
                  <Icon name="merge" size={16} decorative />
                  Pull Requests
                </h4>
                <div className="space-y-1.5">
                  {data.pullRequests.map((pr: PullRequest) => (
                    <a
                      key={pr.id}
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-bridge-bg-card hover:bg-bridge-bg-tertiary transition-colors"
                    >
                      <div style={{ color: getPRStateColor(pr.state) }} className="flex-shrink-0">
                        {getPRStateIcon(pr.state)}
                      </div>
                      <span className="text-sm font-medium text-bridge-text-primary truncate flex-1 min-w-0">
                        {pr.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-bridge-text-muted flex-shrink-0">
                        {pr.draft && (
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: `${colors.outlineVariant}22`, color: colors.outlineVariant }}>
                            Draft
                          </span>
                        )}
                        <span>#{pr.number}</span>
                        <span style={{ color: getPRStateColor(pr.state) }}>
                          {pr.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="schedule" size={10} decorative />
                          {pr.duration}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-6 text-center rounded-xl bg-bridge-bg-card">
                <Icon name="merge" size={32} className="mx-auto mb-2 text-bridge-text-muted" decorative />
                <p className="text-sm text-bridge-text-secondary">No pull requests found</p>
              </div>
            )
          )}
        </>
      )}

      {!loading && !data && !error && (
        <div className="p-8 text-center rounded-xl bg-bridge-bg-card">
          <Icon name="refresh" size={40} className="mx-auto mb-3 text-bridge-text-muted" decorative />
          <p className="text-sm text-bridge-text-secondary mb-1">No data loaded</p>
          <p className="text-xs text-bridge-text-muted">Click the refresh button above to load GitHub data</p>
        </div>
      )}

      {loading && !data && (
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-bridge-bg-card animate-pulse" />
            ))}
          </div>
          <div className="h-32 rounded-xl bg-bridge-bg-card animate-pulse" />
        </div>
      )}
    </div>
  );
}
