'use client';

import { useState, useEffect, useMemo } from 'react';
import { useJiraData } from '@/hooks/useJiraData';
import { colors } from '@/lib/colors';
import Icon from '@/components/ui/Icon';
import { Task, Epic } from '@/lib/jira/types';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

type FilterType = 'all' | 'epics' | 'stories' | 'tasks';

interface JiraIssueListProps {
  isOpen: boolean;
}

export default function JiraIssueList({ isOpen }: JiraIssueListProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedEpic, setSelectedEpic] = useState<string>('all');
  const { data, loading, error, refetch } = useJiraData(REFRESH_INTERVAL, isOpen ? Date.now() : undefined);

  // Refetch when panel opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Get unique epics for filter
  const epics = useMemo(() => {
    if (!data?.epics) return [];
    return data.epics;
  }, [data?.epics]);

  // Filter items based on selected filters
  const filteredItems = useMemo(() => {
    if (!data) return [];

    let items: Task[] = [];

    // First filter by type
    if (filterType === 'epics') {
      items = data.epics;
    } else if (filterType === 'stories') {
      items = data.stories;
    } else if (filterType === 'tasks') {
      items = [...data.tasks, ...data.bugs];
    } else {
      items = [...data.epics, ...data.stories, ...data.tasks, ...data.bugs];
    }

    // Then filter by epic if selected
    if (selectedEpic !== 'all') {
      items = items.filter(item =>
        item.key === selectedEpic || item.parentKey === selectedEpic
      );
    }

    return items;
  }, [data, filterType, selectedEpic]);

  if (loading && !data) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Icon name="progress_activity" size={20} animate="animate-spin" style={{ color: colors.onSurfaceVariant }} decorative />
        <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, marginTop: '8px' }}>
          Loading Jira items...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Icon name="error" size={20} style={{ color: colors.error }} decorative />
        <p style={{ fontSize: '12px', color: colors.error, marginTop: '8px' }}>
          {error instanceof Error ? error.message : 'Failed to load Jira items'}
        </p>
        <button
          onClick={refetch}
          style={{
            marginTop: '12px',
            padding: '6px 12px',
            fontSize: '11px',
            background: colors.surfaceContainerHigh,
            border: `1px solid ${colors.outline}`,
            borderRadius: '6px',
            color: colors.onSurface,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filters */}
      <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Type Filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['all', 'epics', 'stories', 'tasks'] as FilterType[]).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                background: filterType === type ? colors.tertiary : colors.surfaceContainerHigh,
                color: filterType === type ? '#000' : colors.onSurfaceVariant,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Epic Filter */}
        {epics.length > 0 && (
          <select
            value={selectedEpic}
            onChange={(e) => setSelectedEpic(e.target.value)}
            style={{
              padding: '6px 8px',
              fontSize: '11px',
              background: colors.surfaceContainerHigh,
              border: `1px solid ${colors.outline}`,
              borderRadius: '6px',
              color: colors.onSurface,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Epics</option>
            {epics.map(epic => (
              <option key={epic.key} value={epic.key}>
                {epic.key} - {epic.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Issue List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {filteredItems.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Icon name="search_off" size={24} style={{ color: colors.onSurfaceVariant }} decorative />
            <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, marginTop: '8px' }}>
              No items found
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isBug = item.type === 'bug';
            const isEpic = item.type === 'epic';
            const statusColor =
              item.statusCategory === 'done' ? colors.success :
              item.statusCategory === 'inprogress' ? '#fbbf24' :
              '#94a3b8';

            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  background: isBug ? `${colors.error}11` : colors.surfaceContainerHigh,
                  border: `1px solid ${isBug ? colors.error : colors.outline}`,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isBug ? `${colors.error}22` : colors.surfaceContainerHighest;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isBug ? `${colors.error}11` : colors.surfaceContainerHigh;
                }}
              >
                {/* Status Indicator */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: statusColor,
                    flexShrink: 0,
                  }}
                />

                {/* Type Icon */}
                {isEpic && (
                  <Icon name="bookmark" size={14} style={{ color: colors.tertiary }} decorative />
                )}
                {isBug && (
                  <Icon name="bug_report" size={14} style={{ color: colors.error }} decorative />
                )}
                {item.type === 'task' && (
                  <Icon name="task" size={14} style={{ color: colors.onSurfaceVariant }} decorative />
                )}

                {/* Key */}
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: isBug ? colors.error : isEpic ? colors.tertiary : colors.primary,
                    flexShrink: 0,
                  }}
                >
                  {item.key}
                </span>

                {/* Title */}
                <span
                  style={{
                    fontSize: '12px',
                    color: colors.onSurface,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </span>

                {/* Assignee Avatar */}
                {item.assignee && (
                  <img
                    src={item.assignee.avatar}
                    alt={item.assignee.name}
                    title={item.assignee.name}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* External Link Icon */}
                <Icon
                  name="open_in_new"
                  size={12}
                  style={{ color: colors.onSurfaceVariant, flexShrink: 0 }}
                  decorative
                />
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
