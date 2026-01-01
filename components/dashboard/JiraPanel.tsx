'use client';

import { useState, useMemo, useEffect } from 'react';
import { useJiraData } from '@/hooks/useJiraData';
import { colors } from '@/lib/colors';
import { Icon } from '@/components/ui';
import { Task, Epic } from '@/lib/jira/types';
import { PanelSkeleton, PanelError, getErrorMessage } from './PanelStates';

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const ALL_EPICS = '__ALL_EPICS__'; // Special value for showing all stories
const STORAGE_KEY = 'thebridge-selected-epic';

type FilterMode = 'todo' | 'backlog' | 'codereview' | 'inprogress' | 'done';
type StatusCategoryFilter = 'all' | 'hide-done' | 'inprogress-only' | 'done-only';

interface JiraPanelProps {
  compact?: boolean;
  refreshTrigger?: number;
  embedded?: boolean; // When true, hides internal header (used inside DashboardPanel)
}

export default function JiraPanel({ compact = false, refreshTrigger, embedded = false }: JiraPanelProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('todo');
  const [statusCategoryFilter, setStatusCategoryFilter] = useState<StatusCategoryFilter>('hide-done');
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [showEpicDropdown, setShowEpicDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [transitions, setTransitions] = useState<Record<string, { id: string; name: string }[]>>({});
  const [showDoneEpics, setShowDoneEpics] = useState(false);
  const { data, loading, error, refetch } = useJiraData(REFRESH_INTERVAL, refreshTrigger);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showEpicDropdown && !target.closest('[data-epic-selector]')) {
        setShowEpicDropdown(false);
      }
      if (showStatusDropdown && !target.closest('[data-status-selector]')) {
        setShowStatusDropdown(false);
      }
      if (statusDropdown && !target.closest('.status-dropdown-container')) {
        setStatusDropdown(null);
      }
    };

    if (showEpicDropdown || showStatusDropdown || statusDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showEpicDropdown, showStatusDropdown, statusDropdown]);

  // Load selected epic from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      setSelectedEpic(saved || ALL_EPICS);
    }
  }, []);

  // Save selected epic to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedEpic) {
      localStorage.setItem(STORAGE_KEY, selectedEpic);
    }
  }, [selectedEpic]);

  // Sort epics by story count (descending) and filter done epics unless showDoneEpics is true
  const sortedEpics = useMemo(() => {
    if (!data?.epics) return [];
    const filtered = showDoneEpics
      ? data.epics
      : data.epics.filter(epic => epic.statusCategory !== 'done');
    return [...filtered].sort((a, b) => (b.stories?.length || 0) - (a.stories?.length || 0));
  }, [data?.epics, showDoneEpics]);

  // Count of done epics (for showing in toggle)
  const doneEpicsCount = useMemo(() => {
    if (!data?.epics) return 0;
    return data.epics.filter(epic => epic.statusCategory === 'done').length;
  }, [data?.epics]);

  // Get story count for an epic
  const getEpicStoryCount = (epicKey: string): number => {
    if (!data) return 0;
    return [...data.stories, ...data.tasks, ...data.bugs].filter(
      item => item.parentKey === epicKey
    ).length;
  };

  // Get color for epic based on status
  const getEpicStatusColor = (statusCategory: 'todo' | 'inprogress' | 'done') => {
    switch (statusCategory) {
      case 'todo': return '#94a3b8'; // slate-400
      case 'inprogress': return '#fbbf24'; // amber-400
      case 'done': return '#6b7280'; // gray-500 (muted for done)
      default: return '#94a3b8';
    }
  };

  // Fetch available transitions for an issue
  const fetchTransitions = async (issueKey: string) => {
    if (transitions[issueKey]) return; // Already fetched

    try {
      const response = await fetch(`/api/jira/${issueKey}`);
      const result = await response.json();

      if (result.success && result.data) {
        setTransitions(prev => ({
          ...prev,
          [issueKey]: result.data.map((t: { id: string; name: string; to?: { name: string } }) => ({
            id: t.id,
            name: t.to?.name || t.name,
          })),
        }));
      }
    } catch (err) {
      console.error('Failed to fetch transitions:', err);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (issueKey: string, transitionId: string) => {
    setUpdatingStatus(issueKey);
    try {
      const response = await fetch(`/api/jira/${issueKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitionId }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data after successful update
        await refetch();
        setStatusDropdown(null);
      } else {
        alert(`Failed to update status: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Toggle status dropdown and fetch transitions if needed
  const toggleStatusDropdown = async (issueKey: string) => {
    if (statusDropdown === issueKey) {
      setStatusDropdown(null);
    } else {
      setStatusDropdown(issueKey);
      await fetchTransitions(issueKey);
    }
  };

  // Filter tasks based on mode and selected epic
  const filteredData = useMemo(() => {
    if (!data) return null;

    // When an epic is selected, find all stories that belong to it
    const getEpicChildKeys = (epicKey: string): Set<string> => {
      const childKeys = new Set<string>();
      childKeys.add(epicKey);

      [...data.stories, ...data.tasks, ...data.bugs].forEach(item => {
        if (item.parentKey === epicKey) {
          childKeys.add(item.key);
        }
      });

      return childKeys;
    };

    const filterByMode = (tasks: Task[]) => {
      let filtered = tasks;

      // Apply epic filter first (skip if ALL_EPICS is selected)
      if (selectedEpic && selectedEpic !== ALL_EPICS) {
        const epicChildKeys = getEpicChildKeys(selectedEpic);
        filtered = filtered.filter(t =>
          t.parentKey === selectedEpic ||
          (t.parentKey && epicChildKeys.has(t.parentKey))
        );
      }

      // Apply status category filter
      if (statusCategoryFilter === 'hide-done') {
        filtered = filtered.filter(t => t.statusCategory !== 'done');
      } else if (statusCategoryFilter === 'inprogress-only') {
        filtered = filtered.filter(t => t.statusCategory === 'inprogress');
      } else if (statusCategoryFilter === 'done-only') {
        filtered = filtered.filter(t => t.statusCategory === 'done');
      }
      // 'all' means no status category filtering

      // Apply status filters by actual Jira status
      if (filterMode === 'todo') {
        filtered = filtered.filter(t => t.status.toLowerCase() === 'to do');
      } else if (filterMode === 'backlog') {
        filtered = filtered.filter(t => t.status.toLowerCase() === 'backlog');
      } else if (filterMode === 'codereview') {
        filtered = filtered.filter(t => t.status.toLowerCase() === 'code review');
      } else if (filterMode === 'inprogress') {
        filtered = filtered.filter(t => t.status.toLowerCase() === 'in progress');
      } else if (filterMode === 'done') {
        filtered = filtered.filter(t => t.statusCategory === 'done');
      }

      return filtered;
    };

    return {
      ...data,
      stories: filterByMode(data.stories),
      tasks: filterByMode(data.tasks),
      bugs: filterByMode(data.bugs),
    };
  }, [data, filterMode, selectedEpic, statusCategoryFilter]);

  // Get epic-filtered and status-category-filtered items for counting
  const epicFilteredItems = useMemo(() => {
    if (!data) return [];

    let items = [...data.stories, ...data.tasks, ...data.bugs];

    // Apply epic filter
    if (selectedEpic && selectedEpic !== ALL_EPICS) {
      const getEpicChildKeys = (epicKey: string): Set<string> => {
        const childKeys = new Set<string>();
        childKeys.add(epicKey);
        items.forEach(item => {
          if (item.parentKey === epicKey) {
            childKeys.add(item.key);
          }
        });
        return childKeys;
      };

      const epicChildKeys = getEpicChildKeys(selectedEpic);
      items = items.filter(t =>
        t.parentKey === selectedEpic || (t.parentKey && epicChildKeys.has(t.parentKey))
      );
    }

    // Apply status category filter
    if (statusCategoryFilter === 'hide-done') {
      items = items.filter(t => t.statusCategory !== 'done');
    } else if (statusCategoryFilter === 'inprogress-only') {
      items = items.filter(t => t.statusCategory === 'inprogress');
    } else if (statusCategoryFilter === 'done-only') {
      items = items.filter(t => t.statusCategory === 'done');
    }

    return items;
  }, [data, selectedEpic, statusCategoryFilter]);

  const getStatusColor = (statusCategory: 'todo' | 'inprogress' | 'done') => {
    switch (statusCategory) {
      case 'todo': return '#94a3b8'; // slate-400
      case 'inprogress': return '#fbbf24'; // amber-400
      case 'done': return '#10b981'; // emerald-500
      default: return colors.outlineVariant;
    }
  };

  const getPriorityConfig = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes('critical') || p.includes('highest'))
      return { color: '#ef4444', icon: 'priority_high', label: 'Critical' };
    if (p.includes('high'))
      return { color: '#f97316', icon: 'arrow_upward', label: 'High' };
    if (p.includes('medium'))
      return { color: '#eab308', icon: 'drag_handle', label: 'Medium' };
    return { color: '#3b82f6', icon: 'arrow_downward', label: 'Low' };
  };

  // Loading state
  if (loading && !data) {
    return <PanelSkeleton rows={4} showHeader={false} showStats={false} />;
  }

  // Error state
  if (error) {
    const errorInfo = getErrorMessage(error);
    return (
      <PanelError
        {...errorInfo}
        onRetry={refetch}
        isRetrying={loading}
      />
    );
  }

  if (!data || !filteredData) return null;

  const totalFiltered = (filteredData.stories.length + filteredData.tasks.length + filteredData.bugs.length);
  const todoCount = epicFilteredItems.filter(t => t.status.toLowerCase() === 'to do').length;
  const backlogCount = epicFilteredItems.filter(t => t.status.toLowerCase() === 'backlog').length;
  const codeReviewCount = epicFilteredItems.filter(t => t.status.toLowerCase() === 'code review').length;
  const inProgressCount = epicFilteredItems.filter(t => t.status.toLowerCase() === 'in progress').length;
  const doneCount = epicFilteredItems.filter(t => t.statusCategory === 'done').length;

  // Task Card Component
  const TaskCard = ({ task, type }: { task: Task; type: 'story' | 'task' | 'bug' }) => {
    const priority = getPriorityConfig(task.priority);
    const isBug = type === 'bug';

    return (
      <div
        className="group rounded-lg p-2.5 transition-all duration-200 hover:shadow-md cursor-pointer"
        style={{
          background: isBug ? 'var(--md-error-container)' : 'var(--md-surface-container-high)',
          border: isBug ? '1px solid var(--md-error)' : '1px solid var(--md-outline-variant)',
        }}
        onClick={() => window.open(task.url, '_blank')}
      >
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          {isBug ? (
            <Icon name="bug_report" size={16} color="var(--md-error)" decorative className="flex-shrink-0" />
          ) : (
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: getStatusColor(task.statusCategory) }}
            />
          )}

          {/* Key */}
          {type === 'task' && (
            <Icon name="task" size={14} color="var(--md-tertiary)" decorative className="flex-shrink-0" />
          )}
          <span
            className="text-xs font-mono font-semibold flex-shrink-0"
            style={{ color: isBug ? 'var(--md-error)' : type === 'task' ? 'var(--md-tertiary)' : 'var(--md-primary)' }}
          >
            {task.key}
          </span>

          {/* Title */}
          <h3
            className="text-sm font-semibold group-hover:text-opacity-80 transition-all truncate flex-1 min-w-0"
            style={{ color: isBug ? 'var(--md-on-error-container)' : 'var(--md-on-surface)' }}
          >
            {task.title}
          </h3>

          {/* Right-justified metadata */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status with dropdown */}
            <div className="relative status-dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatusDropdown(task.key);
                }}
                disabled={updatingStatus === task.key}
                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-0.5 hover:opacity-80 transition-opacity disabled:opacity-50"
                style={{
                  background: `${getStatusColor(task.statusCategory)}22`,
                  color: getStatusColor(task.statusCategory),
                }}
              >
                {updatingStatus === task.key ? (
                  <Icon name="sync" size={10} className="animate-spin" decorative />
                ) : (
                  <>
                    {task.status}
                    <Icon name="expand_more" size={12} decorative />
                  </>
                )}
              </button>

              {/* Transitions dropdown */}
              {statusDropdown === task.key && transitions[task.key] && (
                <div
                  className="absolute z-20 mt-1 rounded-lg shadow-lg overflow-hidden min-w-[130px] right-0"
                  style={{
                    background: 'var(--md-surface-container-high)',
                    border: '1px solid var(--md-outline-variant)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {transitions[task.key].map((transition) => (
                    <button
                      key={transition.id}
                      onClick={() => handleStatusUpdate(task.key, transition.id)}
                      className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-opacity-10 hover:bg-bridge-text-primary transition-colors"
                      style={{ color: 'var(--md-on-surface)' }}
                    >
                      {transition.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assignee */}
            {task.assignee && (
              <img
                src={task.assignee.avatar}
                alt={task.assignee.name}
                className="w-5 h-5 rounded-full"
                title={task.assignee.name}
              />
            )}

            {/* External link indicator */}
            <Icon
              name="open_in_new"
              size={14}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              color={isBug ? 'var(--md-on-error-container)' : 'var(--md-on-surface-variant)'}
              decorative
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Epic Selector */}
      <div className="mb-4 shrink-0" data-epic-selector>
        <div className="relative">
          <button
            onClick={() => setShowEpicDropdown(!showEpicDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:shadow-md"
            style={{
              background: 'var(--md-surface-container-high)',
              border: '1px solid var(--md-outline-variant)',
            }}
          >
            <div className="flex items-center gap-2">
              <Icon
                name={selectedEpic === ALL_EPICS ? "view_list" : "bookmark"}
                size={20}
                color="var(--md-primary)"
                decorative
              />
              <span className="font-medium" style={{ color: 'var(--md-on-surface)' }}>
                {selectedEpic === ALL_EPICS ? 'All Stories' : selectedEpic || 'Select Epic'}
              </span>
              {selectedEpic && selectedEpic !== ALL_EPICS && data?.epics.find(e => e.key === selectedEpic) && (
                <span className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                  - {data.epics.find(e => e.key === selectedEpic)?.title}
                </span>
              )}
            </div>
            <Icon
              name={showEpicDropdown ? 'expand_less' : 'expand_more'}
              size={20}
              color="var(--md-on-surface-variant)"
              decorative
            />
          </button>

          {/* Dropdown Menu */}
          {showEpicDropdown && (
            <div
              className="absolute z-10 w-full mt-2 rounded-xl shadow-lg overflow-y-auto"
              style={{
                background: 'var(--md-surface-container-high)',
                border: '1px solid var(--md-outline-variant)',
                maxHeight: '400px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--md-primary) var(--md-surface-container-high)',
              }}
            >
              {/* All Stories Option */}
              <div className="p-2 border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
                <div
                  className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-opacity-10 hover:bg-bridge-text-primary cursor-pointer"
                  onClick={() => {
                    setSelectedEpic(ALL_EPICS);
                    setShowEpicDropdown(false);
                  }}
                  style={{
                    background: selectedEpic === ALL_EPICS ? 'var(--md-primary-container)' : 'transparent',
                  }}
                >
                  <Icon
                    name="view_list"
                    size={20}
                    color={selectedEpic === ALL_EPICS ? 'var(--md-on-primary-container)' : 'var(--md-primary)'}
                    decorative
                  />
                  <span
                    className="font-semibold"
                    style={{
                      color: selectedEpic === ALL_EPICS ? 'var(--md-on-primary-container)' : 'var(--md-on-surface)',
                    }}
                  >
                    All Stories
                  </span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--md-on-surface-variant)' }}>
                    Show all epics
                  </span>
                </div>
              </div>

              {/* Epics List */}
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--md-on-surface-variant)' }}>
                    EPICS (by story count)
                  </span>
                  {doneEpicsCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDoneEpics(!showDoneEpics);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all hover:bg-opacity-10 hover:bg-bridge-text-primary"
                      style={{
                        color: showDoneEpics ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                      }}
                    >
                      <Icon
                        name={showDoneEpics ? 'visibility' : 'visibility_off'}
                        size={14}
                        decorative
                      />
                      {showDoneEpics ? 'Hide' : 'Show'} done ({doneEpicsCount})
                    </button>
                  )}
                </div>
                {sortedEpics.map(epic => {
                  const storyCount = getEpicStoryCount(epic.key);
                  const statusColor = getEpicStatusColor(epic.statusCategory);
                  const isDone = epic.statusCategory === 'done';

                  return (
                    <div
                      key={epic.key}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-opacity-10 hover:bg-bridge-text-primary cursor-pointer"
                      style={{
                        background: selectedEpic === epic.key ? 'var(--md-primary-container)' : 'transparent',
                        opacity: isDone ? 0.6 : 1,
                      }}
                      onClick={() => {
                        setSelectedEpic(epic.key);
                        setShowEpicDropdown(false);
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: statusColor }}
                          title={epic.status}
                        />
                        <span
                          className="font-mono text-sm font-semibold flex-shrink-0"
                          style={{
                            color: selectedEpic === epic.key
                              ? 'var(--md-on-primary-container)'
                              : isDone
                                ? '#6b7280'
                                : 'var(--md-on-surface)',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {epic.key}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                          style={{
                            background: isDone ? '#9ca3af22' : 'var(--md-tertiary-container)',
                            color: isDone ? '#6b7280' : 'var(--md-on-tertiary-container)',
                          }}
                        >
                          {storyCount}
                        </span>
                        <span
                          className="text-sm truncate"
                          style={{
                            color: selectedEpic === epic.key
                              ? 'var(--md-on-primary-container)'
                              : isDone
                                ? '#6b7280'
                                : 'var(--md-on-surface-variant)',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {epic.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Category Filter */}
      <div className="mb-4 shrink-0" data-status-selector>
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:shadow-md"
            style={{
              background: 'var(--md-surface-container-high)',
              border: '1px solid var(--md-outline-variant)',
            }}
          >
            <div className="flex items-center gap-2">
              <Icon
                name="filter_list"
                size={20}
                color="var(--md-primary)"
                decorative
              />
              <span className="font-medium" style={{ color: 'var(--md-on-surface)' }}>
                {statusCategoryFilter === 'all' && 'All Statuses'}
                {statusCategoryFilter === 'hide-done' && 'Hide Done'}
                {statusCategoryFilter === 'inprogress-only' && 'In Progress Only'}
                {statusCategoryFilter === 'done-only' && 'Done Only'}
              </span>
            </div>
            <Icon
              name={showStatusDropdown ? 'expand_less' : 'expand_more'}
              size={20}
              color="var(--md-on-surface-variant)"
              decorative
            />
          </button>

          {/* Dropdown Menu */}
          {showStatusDropdown && (
            <div
              className="absolute z-10 w-full mt-2 rounded-xl shadow-lg overflow-hidden"
              style={{
                background: 'var(--md-surface-container-high)',
                border: '1px solid var(--md-outline-variant)',
              }}
            >
              <div className="p-2">
                {[
                  { value: 'all' as StatusCategoryFilter, label: 'All Statuses', icon: 'visibility' },
                  { value: 'hide-done' as StatusCategoryFilter, label: 'Hide Done', icon: 'visibility_off' },
                  { value: 'inprogress-only' as StatusCategoryFilter, label: 'In Progress Only', icon: 'sync' },
                  { value: 'done-only' as StatusCategoryFilter, label: 'Done Only', icon: 'check_circle' },
                ].map(option => (
                  <div
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-opacity-10 hover:bg-bridge-text-primary cursor-pointer"
                    onClick={() => {
                      setStatusCategoryFilter(option.value);
                      setShowStatusDropdown(false);
                    }}
                    style={{
                      background: statusCategoryFilter === option.value ? 'var(--md-primary-container)' : 'transparent',
                    }}
                  >
                    <Icon
                      name={option.icon}
                      size={20}
                      color={statusCategoryFilter === option.value ? 'var(--md-on-primary-container)' : 'var(--md-primary)'}
                      decorative
                    />
                    <span
                      className="font-semibold"
                      style={{
                        color: statusCategoryFilter === option.value ? 'var(--md-on-primary-container)' : 'var(--md-on-surface)',
                      }}
                    >
                      {option.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-4 shrink-0">
        <button
          onClick={() => setFilterMode('todo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
            filterMode === 'todo' ? 'shadow-md' : ''
          }`}
          style={filterMode === 'todo' ? {
            background: '#94a3b8',
            color: '#000000',
          } : {
            background: 'var(--md-surface-container-highest)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          To Do ({todoCount})
        </button>

        <button
          onClick={() => setFilterMode('backlog')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
            filterMode === 'backlog' ? 'shadow-md' : ''
          }`}
          style={filterMode === 'backlog' ? {
            background: '#3b82f6',
            color: '#ffffff',
          } : {
            background: 'var(--md-surface-container-highest)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          Backlog ({backlogCount})
        </button>

        <button
          onClick={() => setFilterMode('codereview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
            filterMode === 'codereview' ? 'shadow-md' : ''
          }`}
          style={filterMode === 'codereview' ? {
            background: '#3b82f6',
            color: '#ffffff',
          } : {
            background: 'var(--md-surface-container-highest)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          Code Review ({codeReviewCount})
        </button>

        <button
          onClick={() => setFilterMode('inprogress')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
            filterMode === 'inprogress' ? 'shadow-md' : ''
          }`}
          style={filterMode === 'inprogress' ? {
            background: '#fbbf24',
            color: '#000000',
          } : {
            background: 'var(--md-surface-container-highest)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          In Progress ({inProgressCount})
        </button>

        <button
          onClick={() => setFilterMode('done')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
            filterMode === 'done' ? 'shadow-md' : ''
          }`}
          style={filterMode === 'done' ? {
            background: '#10b981',
            color: '#000000',
          } : {
            background: 'var(--md-surface-container-highest)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          Done ({doneCount})
        </button>
      </div>

      {/* Task Cards */}
      <div
        className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--md-primary) var(--md-surface-container-high)',
        }}
      >
        {/* Stories */}
        {filteredData.stories.map((story) => (
          <TaskCard key={story.id} task={story} type="story" />
        ))}

        {/* Tasks */}
        {filteredData.tasks.map((task) => (
          <TaskCard key={task.id} task={task} type="task" />
        ))}

        {/* Bugs */}
        {filteredData.bugs.map((bug) => (
          <TaskCard key={bug.id} task={bug} type="bug" />
        ))}

        {/* Empty State */}
        {totalFiltered === 0 && (
          <div className="py-12 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--md-surface-container-highest)' }}
            >
              <Icon name="task_alt" size={32} color="var(--md-on-surface-variant)" decorative />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--md-on-surface)' }}>
              No tasks found
            </h3>
            <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
              No items in {filterMode === 'todo' ? 'To Do' : filterMode === 'backlog' ? 'Backlog' : filterMode === 'codereview' ? 'Code Review' : filterMode === 'inprogress' ? 'In Progress' : 'Done'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
