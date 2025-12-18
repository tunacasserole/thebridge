'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { colors } from '@/lib/colors';

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  url: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  labels: Array<{ name: string; color: string }>;
  author: string;
}

interface GitHubIssueListProps {
  onRefresh?: () => void;
}

export default function GitHubIssueList({ onRefresh }: GitHubIssueListProps) {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'open' | 'closed'>('open');
  const [reopening, setReopening] = useState<number | null>(null);

  const fetchIssues = async (issueState: 'open' | 'closed') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/github/issues?state=${issueState}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch issues');
      }

      setIssues(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues(state);
  }, [state]);

  const handleReopen = async (issueNumber: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setReopening(issueNumber);
    try {
      const response = await fetch('/api/github/issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueNumber, state: 'open' }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reopen issue');
      }

      // Refresh the list
      await fetchIssues(state);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reopen issue');
    } finally {
      setReopening(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* State Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          background: colors.surfaceContainerHigh,
          borderRadius: '8px',
          marginBottom: '12px',
        }}
      >
        <button
          onClick={() => setState('open')}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: state === 'open' ? colors.onSurface : colors.onSurfaceVariant,
            background: state === 'open' ? colors.surfaceContainer : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Open
        </button>
        <button
          onClick={() => setState('closed')}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: state === 'closed' ? colors.onSurface : colors.onSurfaceVariant,
            background: state === 'closed' ? colors.surfaceContainer : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Closed
        </button>
      </div>

      {/* Issue List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              color: colors.onSurfaceVariant,
            }}
          >
            <Icon name="progress_activity" size={24} animate="animate-spin" decorative />
          </div>
        ) : error ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              fontSize: '12px',
              color: colors.error,
            }}
          >
            {error}
          </div>
        ) : issues.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              fontSize: '12px',
              color: colors.onSurfaceVariant,
            }}
          >
            No {state} issues found
          </div>
        ) : (
          issues.map((issue) => (
            <a
              key={issue.id}
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '12px',
                background: colors.surfaceContainerHigh,
                border: `1px solid ${colors.outline}`,
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.surfaceContainerHighest;
                e.currentTarget.style.borderColor = colors.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.surfaceContainerHigh;
                e.currentTarget.style.borderColor = colors.outline;
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '6px',
                }}
              >
                <Icon
                  name={state === 'open' ? 'error_outline' : 'check_circle'}
                  size={16}
                  style={{
                    color: state === 'open' ? colors.success : colors.onSurfaceVariant,
                    marginTop: '2px',
                  }}
                  decorative
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: colors.onSurface,
                      marginBottom: '4px',
                      lineHeight: '1.4',
                    }}
                  >
                    {issue.title}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: colors.onSurfaceVariant,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>#{issue.number}</span>
                    <span>•</span>
                    <span>{issue.author}</span>
                  </div>
                </div>
              </div>

              {/* Labels */}
              {issue.labels.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap',
                    marginBottom: state === 'closed' ? '8px' : '0',
                  }}
                >
                  {issue.labels.slice(0, 3).map((label) => (
                    <span
                      key={label.name}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `#${label.color}33`,
                        color: `#${label.color}`,
                        border: `1px solid #${label.color}66`,
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                  {issue.labels.length > 3 && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: colors.onSurfaceVariant,
                      }}
                    >
                      +{issue.labels.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Reopen Button for Closed Issues */}
              {state === 'closed' && (
                <button
                  onClick={(e) => handleReopen(issue.number, e)}
                  disabled={reopening === issue.number}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: colors.tertiary,
                    background: `${colors.tertiary}15`,
                    border: `1px solid ${colors.tertiary}44`,
                    borderRadius: '6px',
                    cursor: reopening === issue.number ? 'not-allowed' : 'pointer',
                    opacity: reopening === issue.number ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (reopening !== issue.number) {
                      e.currentTarget.style.background = `${colors.tertiary}22`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (reopening !== issue.number) {
                      e.currentTarget.style.background = `${colors.tertiary}15`;
                    }
                  }}
                >
                  {reopening === issue.number ? (
                    <>
                      <Icon name="progress_activity" size={12} animate="animate-spin" decorative />
                      Reopening...
                    </>
                  ) : (
                    <>
                      <Icon name="refresh" size={12} decorative />
                      Reopen Issue
                    </>
                  )}
                </button>
              )}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
