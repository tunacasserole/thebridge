'use client';

import { useState, useEffect, useMemo } from 'react';
import RootlyPanel from '@/components/dashboard/RootlyPanel';
// import CoralogixPanel from '@/components/dashboard/CoralogixPanel';
import type { Task, Epic, JiraData, FilterMode, ActivePanel } from '@/components/dashboard/types';

const ALL_EPICS = '__ALL_EPICS__';
const STORAGE_KEY = 'thebridge-selected-epic';

export default function Dashboard() {
  const [data, setData] = useState<JiraData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('todo');
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [showEpicDropdown, setShowEpicDropdown] = useState(false);
  const [showDoneEpics, setShowDoneEpics] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [transitions, setTransitions] = useState<Record<string, { id: string; name: string }[]>>({});
  const [commentModal, setCommentModal] = useState<{ issueKey: string; title: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showEpicDropdown && !target.closest('[data-epic-selector]')) {
        setShowEpicDropdown(false);
      }
      if (statusDropdown && !target.closest('.status-dropdown-container')) {
        setStatusDropdown(null);
      }
    };

    if (showEpicDropdown || statusDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showEpicDropdown, statusDropdown]);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/jira/issues');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch issues');
      }
    } catch (err) {
      setError('Failed to connect to Jira');
      console.error('Jira fetch error:', err);
    } finally {
      setLoading(false);
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
          [issueKey]: result.data.map((t: any) => ({
            id: t.id,
            name: t.to?.name || t.name,
          })),
        }));
      }
    } catch (error) {
      console.error('Failed to fetch transitions:', error);
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
        await fetchIssues(); // Refresh data
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

  // Toggle status dropdown and fetch transitions if needed
  const toggleStatusDropdown = async (issueKey: string) => {
    if (statusDropdown === issueKey) {
      setStatusDropdown(null);
    } else {
      setStatusDropdown(issueKey);
      await fetchTransitions(issueKey);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!commentModal || !commentText.trim()) return;

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const response = await fetch(`/api/jira/${commentModal.issueKey}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setCommentModal(null);
        setCommentText('');
      } else {
        setCommentError(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      setCommentError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Open comment modal
  const openCommentModal = (issueKey: string, title: string) => {
    setCommentModal({ issueKey, title });
    setCommentText('');
    setCommentError(null);
  };

  // Sort epics by story count (descending) and filter done epics
  const sortedEpics = useMemo(() => {
    if (!data?.epics) return [];
    const filtered = showDoneEpics
      ? data.epics
      : data.epics.filter(epic => epic.statusCategory !== 'done');
    return [...filtered].sort((a, b) => (b.stories?.length || 0) - (a.stories?.length || 0));
  }, [data?.epics, showDoneEpics]);

  // Count of done epics
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

  // Filter data based on mode and selected epic
  const filteredData = useMemo(() => {
    if (!data) return null;

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

      // Apply epic filter first
      if (selectedEpic && selectedEpic !== ALL_EPICS) {
        const epicChildKeys = getEpicChildKeys(selectedEpic);
        filtered = filtered.filter(t =>
          t.parentKey === selectedEpic ||
          (t.parentKey && epicChildKeys.has(t.parentKey))
        );
      }

      // Apply status filters
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
  }, [data, filterMode, selectedEpic]);

  // Get epic-filtered items for counting
  const epicFilteredItems = useMemo(() => {
    if (!data) return [];

    if (!selectedEpic || selectedEpic === ALL_EPICS) {
      return [...data.stories, ...data.tasks, ...data.bugs];
    }

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

    const epicChildKeys = getEpicChildKeys(selectedEpic);
    return [...data.stories, ...data.tasks, ...data.bugs].filter(t =>
      t.parentKey === selectedEpic || (t.parentKey && epicChildKeys.has(t.parentKey))
    );
  }, [data, selectedEpic]);

  const getStatusColor = (statusCategory: 'todo' | 'inprogress' | 'done') => {
    switch (statusCategory) {
      case 'todo': return 'var(--md-on-surface-variant)';
      case 'inprogress': return 'var(--md-warning)';
      case 'done': return 'var(--md-success)';
      default: return 'var(--md-on-surface-variant)';
    }
  };

  const getEpicStatusColor = (statusCategory: 'todo' | 'inprogress' | 'done') => {
    switch (statusCategory) {
      case 'todo': return 'var(--md-on-surface-variant)';
      case 'inprogress': return 'var(--md-warning)';
      case 'done': return 'var(--md-outline)'; // muted for done
      default: return 'var(--md-on-surface-variant)';
    }
  };

  const getPriorityConfig = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes('critical') || p.includes('highest'))
      return { color: 'var(--md-error)', icon: '⚠', label: 'Critical' };
    if (p.includes('high'))
      return { color: 'var(--md-accent)', icon: '↑', label: 'High' };
    if (p.includes('medium'))
      return { color: 'var(--md-warning)', icon: '―', label: 'Medium' };
    return { color: 'var(--md-info)', icon: '↓', label: 'Low' };
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bug':
        return (
          <svg className="w-4 h-4" viewBox="0 0 16 16" style={{ fill: 'var(--md-error)' }}>
            <circle cx="8" cy="8" r="7" />
          </svg>
        );
      case 'story':
        return (
          <svg className="w-4 h-4" viewBox="0 0 16 16" style={{ fill: 'var(--md-success)' }}>
            <rect x="2" y="2" width="12" height="12" rx="2" />
          </svg>
        );
      case 'task':
        return (
          <svg className="w-4 h-4" viewBox="0 0 16 16" style={{ fill: 'var(--md-info)' }}>
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <path d="M5 8l2 2 4-4" stroke="var(--md-on-primary)" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'epic':
        return (
          <svg className="w-4 h-4" viewBox="0 0 16 16" style={{ fill: 'var(--md-tertiary)' }}>
            <path d="M8 1l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" viewBox="0 0 16 16" style={{ fill: 'var(--md-outline)' }}>
            <circle cx="8" cy="8" r="6" strokeWidth="2" stroke="currentColor" fill="none" />
          </svg>
        );
    }
  };

  // Jira Logo SVG
  const JiraLogo = ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="var(--md-on-primary)"
        d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0Z"
      />
    </svg>
  );

  // Slack Logo SVG
  const SlackLogo = ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 54 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.712 11.52c0-3.174-2.582-5.76-5.76-5.76-3.174 0-5.76 2.586-5.76 5.76 0 3.178 2.586 5.76 5.76 5.76h5.76v-5.76zm2.88 0c0-3.174 2.586-5.76 5.76-5.76 3.178 0 5.76 2.586 5.76 5.76v14.4c0 3.178-2.582 5.76-5.76 5.76-3.174 0-5.76-2.582-5.76-5.76v-14.4z"
        fill="#E01E5A"
      />
      <path
        d="M28.352 48.48c-3.174 0-5.76-2.582-5.76-5.76 0-3.174 2.586-5.76 5.76-5.76h5.76v5.76c0 3.178-2.582 5.76-5.76 5.76zm0-17.28c-3.174 0-5.76-2.586-5.76-5.76 0-3.178 2.586-5.76 5.76-5.76h14.4c3.178 0 5.76 2.582 5.76 5.76 0 3.174-2.582 5.76-5.76 5.76h-14.4z"
        fill="#36C5F0"
      />
      <path
        d="M11.52 25.2c0 3.174-2.582 5.76-5.76 5.76C2.586 30.96 0 28.374 0 25.2c0-3.178 2.586-5.76 5.76-5.76h5.76v5.76zm2.88 0c0 3.174 2.586 5.76 5.76 5.76 3.178 0 5.76-2.586 5.76-5.76V10.8c0-3.178-2.582-5.76-5.76-5.76-3.174 0-5.76 2.582-5.76 5.76v14.4z"
        fill="#2EB67D"
      />
      <path
        d="M48.48 25.2c0-3.178 2.582-5.76 5.76-5.76 3.174 0 5.76 2.582 5.76 5.76 0 3.174-2.586 5.76-5.76 5.76h-5.76v-5.76zm-2.88 0c0-3.178-2.586-5.76-5.76-5.76-3.178 0-5.76 2.582-5.76 5.76v14.4c0 3.178 2.582 5.76 5.76 5.76 3.174 0 5.76-2.582 5.76-5.76v-14.4z"
        fill="#ECB22E"
      />
    </svg>
  );

  // Confluence Logo SVG
  const ConfluenceLogo = ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="confluence-grad-1" x1="99.14%" x2="24.93%" y1="113.9%" y2="27.14%">
          <stop offset="0%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#2684FF" />
        </linearGradient>
        <linearGradient id="confluence-grad-2" x1="0.86%" x2="75.07%" y1="-13.9%" y2="72.86%">
          <stop offset="0%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#2684FF" />
        </linearGradient>
      </defs>
      <path
        fill="url(#confluence-grad-1)"
        d="M1.422 17.24c-.293.453-.637.99-.934 1.45a.755.755 0 00.274 1.044l4.9 2.988a.773.773 0 001.074-.322c.25-.43.56-.959.903-1.541 2.208-3.747 4.394-3.271 8.318-1.418l5.123 2.413a.773.773 0 001.01-.387l2.333-5.476a.77.77 0 00-.373-1.003c-1.598-.755-4.69-2.204-7.086-3.329-5.99-2.808-10.858-2.416-15.542 5.581z"
      />
      <path
        fill="url(#confluence-grad-2)"
        d="M22.578 6.76c.293-.453.637-.99.934-1.45a.755.755 0 00-.274-1.044L18.338 1.28a.773.773 0 00-1.074.322c-.25.43-.56.959-.903 1.541-2.208 3.747-4.394 3.271-8.318 1.418L2.92 2.148a.773.773 0 00-1.01.387L-.423 8.011a.77.77 0 00.373 1.003c1.598.755 4.69 2.204 7.086 3.329 5.99 2.808 10.858 2.416 15.542-5.581z"
      />
    </svg>
  );

  // Rootly Logo SVG - Book with lotus/plant growing from it
  const RootlyLogo = ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Open book at bottom */}
      <path
        d="M12 78 C12 68, 30 65, 50 72 C70 65, 88 68, 88 78 L88 82 C88 82, 70 76, 50 82 C30 76, 12 82, 12 82 Z"
        fill="#F9A826"
      />
      {/* Center droplet/seed */}
      <path
        d="M50 58 C50 58, 42 45, 42 38 C42 32, 46 28, 50 28 C54 28, 58 32, 58 38 C58 45, 50 58, 50 58 Z"
        fill="#F9A826"
      />
      {/* Inner left leaf */}
      <ellipse cx="38" cy="42" rx="6" ry="12" transform="rotate(-30 38 42)" fill="#F9A826" />
      {/* Inner right leaf */}
      <ellipse cx="62" cy="42" rx="6" ry="12" transform="rotate(30 62 42)" fill="#F9A826" />
      {/* Outer left leaf */}
      <ellipse cx="28" cy="48" rx="6" ry="14" transform="rotate(-55 28 48)" fill="#F9A826" />
      {/* Outer right leaf */}
      <ellipse cx="72" cy="48" rx="6" ry="14" transform="rotate(55 72 48)" fill="#F9A826" />
      {/* Far outer left leaf */}
      <ellipse cx="20" cy="56" rx="5" ry="12" transform="rotate(-75 20 56)" fill="#F9A826" />
      {/* Far outer right leaf */}
      <ellipse cx="80" cy="56" rx="5" ry="12" transform="rotate(75 80 56)" fill="#F9A826" />
    </svg>
  );

  // New Relic Logo SVG - Official geometric angular shape
  const NewRelicLogo = ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="#1CE783"
    >
      <path d="M8.0015 14.3091v7.384L12.0008 24V12.0008L1.6078 5.9996v4.6167ZM12.0008 0 2.8232 5.2976 6.8209 7.606l5.1799-2.9893 6.3936 3.6913v7.384l-5.1783 2.9908v4.6167l9.176-5.2991V5.9996Z" />
    </svg>
  );

  // Coralogix Logo SVG - Green circles (official brand mark)
  const CoralogixLogo = ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 116 116"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Solid filled circle */}
      <ellipse cx="58" cy="58" rx="52" ry="52" fill="#3CC48F" />
      {/* Ring outline */}
      <path
        fill="#AEFFDC"
        d="M58,116C26,116,0,90,0,58C0,26,26,0,58,0s58,26,58,58C116,90,90,116,58,116z M58,11c-26,0-47,21-47,47c0,26,21,47,47,47s47-21,47-47C105,32,84,11,58,11z"
      />
    </svg>
  );

  // Metabase Logo SVG - White circle with blue border and M-shaped dot pattern
  const MetabaseLogo = ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* White circle with blue border */}
      <circle cx="32" cy="32" r="28" fill="white" stroke="#509EE3" strokeWidth="4" />
      {/* Light blue background dots */}
      <g fill="#A5D4F3">
        {/* Row 1 */}
        <circle cx="24" cy="16" r="2.5" />
        <circle cx="32" cy="16" r="2.5" />
        <circle cx="40" cy="16" r="2.5" />
        {/* Row 2 */}
        <circle cx="32" cy="23" r="2.5" />
        {/* Row 3 */}
        <circle cx="32" cy="30" r="2.5" />
        {/* Row 5 */}
        <circle cx="24" cy="44" r="2.5" />
        <circle cx="32" cy="44" r="2.5" />
        <circle cx="40" cy="44" r="2.5" />
      </g>
      {/* Dark blue M-shaped dots */}
      <g fill="#509EE3">
        {/* Row 1 - top of M */}
        <circle cx="16" cy="16" r="2.5" />
        <circle cx="48" cy="16" r="2.5" />
        {/* Row 2 - M arms going down */}
        <circle cx="16" cy="23" r="2.5" />
        <circle cx="24" cy="23" r="2.5" />
        <circle cx="40" cy="23" r="2.5" />
        <circle cx="48" cy="23" r="2.5" />
        {/* Row 3 - M middle */}
        <circle cx="16" cy="30" r="2.5" />
        <circle cx="24" cy="30" r="2.5" />
        <circle cx="40" cy="30" r="2.5" />
        <circle cx="48" cy="30" r="2.5" />
        {/* Row 4 - M legs */}
        <circle cx="16" cy="37" r="2.5" />
        <circle cx="32" cy="37" r="2.5" />
        <circle cx="48" cy="37" r="2.5" />
        {/* Row 5 - M bottom */}
        <circle cx="16" cy="44" r="2.5" />
        <circle cx="48" cy="44" r="2.5" />
      </g>
    </svg>
  );

  // Only return null if we're in a truly empty state AND a panel is active that needs data
  // The main integration icons should always show when no panel is active
  // if (!filteredData && !loading && !error) return null;

  const totalFiltered = filteredData
    ? filteredData.stories.length + filteredData.tasks.length + filteredData.bugs.length
    : 0;

  const todoCount = epicFilteredItems.filter(t => t.status.toLowerCase() === 'to do').length;
  const backlogCount = epicFilteredItems.filter(t => t.status.toLowerCase() === 'backlog').length;
  const codeReviewCount = epicFilteredItems.filter(t => t.status.toLowerCase() === 'code review').length;
  const inProgressCount = epicFilteredItems.filter(t => t.status.toLowerCase() === 'in progress').length;
  const doneCount = epicFilteredItems.filter(t => t.statusCategory === 'done').length;

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 min-h-0">
      {/* Dashboard Header */}
      <div className="flex-none pt-4">
        <div className="flex items-center justify-center gap-3">
          <span className="text-[var(--md-accent)] text-4xl">✺</span>
          <h1 className="text-4xl font-serif text-[var(--md-on-surface)]">
            AA-Ron returns!
          </h1>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center pt-6 pb-16">
        {/* Integration Icons Row - When No Panel is Active */}
        {!activePanel && (
          <div className="flex flex-col items-center">
            {/* Primary Integrations Row */}
            <div className="flex items-center gap-8 py-8">
              {/* Jira Icon */}
              <button
                onClick={() => {
                  setActivePanel('jira');
                  if (!data && !loading) {
                    fetchIssues();
                  }
                }}
                className="group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 hover:shadow-2xl cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #2684FF 0%, #0052CC 100%)',
                  boxShadow: '0 8px 32px rgba(38, 132, 255, 0.5)',
                }}
                aria-label="Open Jira Tasks & Stories"
              >
                <JiraLogo size={64} />
                {totalFiltered > 0 && (
                  <span
                    className="absolute -top-2 -right-2 min-w-[32px] h-[32px] px-2 rounded-full text-sm font-bold flex items-center justify-center bg-[var(--md-error)] text-[var(--md-on-error)]"
                    style={{
                      boxShadow: '0 4px 12px color-mix(in srgb, var(--md-error) 50%, transparent)',
                    }}
                  >
                    {totalFiltered > 99 ? '99+' : totalFiltered}
                  </span>
                )}
                <span
                  className="absolute top-full mt-6 px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]"
                  style={{
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--md-shadow) 30%, transparent)',
                  }}
                >
                  Tasks & Stories
                </span>
              </button>

              {/* Slack Icon */}
              <button
                onClick={() => setActivePanel('slack')}
                className="group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 hover:shadow-2xl cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #4A154B 0%, #611f69 100%)',
                  boxShadow: '0 8px 32px rgba(74, 21, 75, 0.5)',
                }}
                aria-label="Open Slack"
              >
                <SlackLogo size={64} />
                <span
                  className="absolute top-full mt-6 px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]"
                  style={{
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--md-shadow) 30%, transparent)',
                  }}
                >
                  Slack
                </span>
              </button>

              {/* Confluence Icon */}
              <button
                onClick={() => setActivePanel('confluence')}
                className="group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 hover:shadow-2xl cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F4F5F7 100%)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                }}
                aria-label="Open Confluence"
              >
                <ConfluenceLogo size={64} />
                <span
                  className="absolute top-full mt-6 px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]"
                  style={{
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--md-shadow) 30%, transparent)',
                  }}
                >
                  Confluence
                </span>
              </button>

              {/* Rootly Icon */}
              <button
                onClick={() => setActivePanel('rootly')}
                className="group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 hover:shadow-2xl cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #1E1A33 0%, #2D2750 100%)',
                  boxShadow: '0 8px 32px rgba(30, 26, 51, 0.6)',
                }}
                aria-label="Open Rootly Incidents"
              >
                <RootlyLogo size={72} />
                <span
                  className="absolute top-full mt-6 px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]"
                  style={{
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--md-shadow) 30%, transparent)',
                  }}
                >
                  Rootly Incidents
                </span>
              </button>
            </div>

            {/* Horizontal Divider */}
            <div className="w-full max-w-2xl flex items-center gap-4 py-4">
              <div className="flex-1 h-px bg-[var(--md-outline-variant)]" />
              <span className="text-sm font-medium text-[var(--md-on-surface-variant)]">Observability</span>
              <div className="flex-1 h-px bg-[var(--md-outline-variant)]" />
            </div>

            {/* Observability Integrations Row */}
            <div className="flex items-center gap-8 py-8">
              {/* New Relic Icon */}
              <button
                onClick={() => setActivePanel('newrelic')}
                className="group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 hover:shadow-2xl cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #008C99 0%, #00AC69 100%)',
                  boxShadow: '0 8px 32px rgba(0, 172, 105, 0.5)',
                }}
                aria-label="Open New Relic"
              >
                <NewRelicLogo size={64} />
                <span
                  className="absolute top-full mt-6 px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]"
                  style={{
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--md-shadow) 30%, transparent)',
                  }}
                >
                  New Relic
                </span>
              </button>

              {/* Coralogix Icon */}
              <button
                onClick={() => setActivePanel('coralogix')}
                className="group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 hover:shadow-2xl cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #2D8B6F 0%, #1A5A45 100%)',
                  boxShadow: '0 8px 32px rgba(60, 196, 143, 0.5)',
                }}
                aria-label="Open Coralogix"
              >
                <CoralogixLogo size={64} />
                <span
                  className="absolute top-full mt-6 px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]"
                  style={{
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--md-shadow) 30%, transparent)',
                  }}
                >
                  Coralogix
                </span>
              </button>

              {/* Metabase Icon */}
              <button
                onClick={() => setActivePanel('metabase')}
                className="group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 hover:shadow-2xl cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #509EE3 0%, #2E78C7 100%)',
                  boxShadow: '0 8px 32px rgba(80, 158, 227, 0.5)',
                }}
                aria-label="Open Metabase"
              >
                <MetabaseLogo size={64} />
                <span
                  className="absolute top-full mt-6 px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]"
                  style={{
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--md-shadow) 30%, transparent)',
                  }}
                >
                  Metabase
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Expanded State */}
        {activePanel === 'jira' && (
          <div
            className="w-full max-w-xl h-full rounded-2xl p-6 flex flex-col bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
            style={{
              boxShadow: '0 8px 32px color-mix(in srgb, var(--md-shadow) 40%, transparent), inset 0 1px 0 color-mix(in srgb, var(--md-surface-container-highest) 5%, transparent)',
            }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setActivePanel(null)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 bg-[var(--md-primary)]"
                  style={{
                    boxShadow: '0 4px 16px color-mix(in srgb, var(--md-primary) 40%, transparent)',
                  }}
                >
                  <JiraLogo size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--md-on-surface)]">
                    Tasks & Stories
                  </h2>
                  <p className="text-sm text-[var(--md-on-surface-variant)]">
                    {totalFiltered} items filtered
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchIssues}
                  disabled={loading}
                  className="p-2.5 rounded-xl transition-all hover:bg-[var(--md-surface-container-high)] disabled:opacity-50 active:scale-95 border-[var(--md-outline-variant)]"
                  title="Refresh"
                >
                  <svg
                    className={`w-5 h-5 text-[var(--md-on-surface-variant)] ${loading ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-2.5 rounded-xl transition-all hover:bg-[var(--md-surface-container-high)] active:scale-95 border-[var(--md-outline-variant)]"
                  title="Minimize"
                >
                  <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && !data && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[var(--md-surface-container-high)]"
                  >
                    <div className="w-8 h-8 border-3 border-[var(--md-outline)] border-t-[var(--md-accent)] rounded-full animate-spin" />
                  </div>
                  <p className="text-[var(--md-on-surface-variant)] font-medium">Loading Jira issues...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex-1 flex items-center justify-center">
                <div
                  className="text-center p-8 rounded-2xl max-w-md bg-[var(--md-error-container)] border-[var(--md-error)]"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'color-mix(in srgb, var(--md-error) 20%, transparent)' }}
                  >
                    <svg className="w-8 h-8 text-[var(--md-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[var(--md-on-error-container)]">
                    {error}
                  </h3>
                  <p className="text-sm text-[var(--md-on-surface-variant)] mb-4">
                    Check your Jira API credentials in .env.local
                  </p>
                  <button
                    onClick={fetchIssues}
                    className="px-5 py-2.5 rounded-xl font-semibold transition-all hover:shadow-lg active:scale-95 bg-[var(--md-accent)] text-[var(--md-on-accent)]"
                    style={{
                      boxShadow: '0 4px 12px color-mix(in srgb, var(--md-accent) 30%, transparent)',
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Main Content */}
            {!loading && !error && data && (
              <>
                {/* Epic Selector */}
                <div className="mb-4 flex-shrink-0" data-epic-selector>
                  <div className="relative">
                    <button
                      onClick={() => setShowEpicDropdown(!showEpicDropdown)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-[var(--md-surface-container-high)] bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--md-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedEpic === ALL_EPICS ? "M4 6h16M4 10h16M4 14h16M4 18h16" : "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"} />
                        </svg>
                        <span className="font-medium text-[var(--md-on-surface)]">
                          {selectedEpic === ALL_EPICS ? 'All Stories' : selectedEpic || 'Select Epic'}
                        </span>
                        {selectedEpic && selectedEpic !== ALL_EPICS && data.epics.find(e => e.key === selectedEpic) && (
                          <span className="text-sm text-[var(--md-on-surface-variant)]">
                            - {data.epics.find(e => e.key === selectedEpic)?.title}
                          </span>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showEpicDropdown ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showEpicDropdown && (
                      <div
                        className="absolute z-10 w-full mt-2 rounded-xl shadow-lg overflow-hidden bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
                        style={{
                          maxHeight: '400px',
                          overflowY: 'auto',
                        }}
                      >
                        {/* All Stories Option */}
                        <div className="p-2 border-b border-[var(--md-outline-variant)]">
                          <div
                            className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-[var(--md-surface-container-high)] cursor-pointer"
                            onClick={() => {
                              setSelectedEpic(ALL_EPICS);
                              setShowEpicDropdown(false);
                            }}
                            style={{
                              background: selectedEpic === ALL_EPICS ? 'color-mix(in srgb, var(--md-accent) 20%, transparent)' : 'transparent',
                            }}
                          >
                            <svg className="w-5 h-5 text-[var(--md-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span className="font-semibold text-[var(--md-on-surface)]">
                              All Stories
                            </span>
                            <span className="text-xs ml-auto text-[var(--md-on-surface-variant)]">
                              Show all epics
                            </span>
                          </div>
                        </div>

                        {/* Epics List */}
                        <div className="p-2">
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs font-semibold text-[var(--md-on-surface-variant)]">
                              EPICS (by story count)
                            </span>
                            {doneEpicsCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDoneEpics(!showDoneEpics);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all hover:bg-[var(--md-surface-container-high)]"
                                style={{
                                  color: showDoneEpics ? 'var(--md-accent)' : 'var(--md-outline)',
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDoneEpics ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"} />
                                </svg>
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
                                className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--md-surface-container-high)] cursor-pointer"
                                style={{
                                  background: selectedEpic === epic.key ? 'color-mix(in srgb, var(--md-accent) 20%, transparent)' : 'transparent',
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
                                      color: selectedEpic === epic.key ? 'var(--md-accent)' : isDone ? 'var(--md-outline)' : 'var(--md-on-surface)',
                                      textDecoration: isDone ? 'line-through' : 'none',
                                    }}
                                  >
                                    {epic.key}
                                  </span>
                                  <span
                                    className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                                    style={{
                                      background: isDone ? 'color-mix(in srgb, var(--md-outline) 13%, transparent)' : 'color-mix(in srgb, var(--md-accent) 20%, transparent)',
                                      color: isDone ? 'var(--md-outline)' : 'var(--md-accent)',
                                    }}
                                  >
                                    {storyCount}
                                  </span>
                                  <span
                                    className="text-sm truncate"
                                    style={{
                                      color: selectedEpic === epic.key ? 'var(--md-warning)' : isDone ? 'var(--md-outline)' : 'var(--md-on-surface-variant)',
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

                {/* Filter Chips */}
                <div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
                  {[
                    { mode: 'todo' as FilterMode, label: 'To Do', count: todoCount, cssVar: 'var(--md-on-surface-variant)' },
                    { mode: 'backlog' as FilterMode, label: 'Backlog', count: backlogCount, cssVar: 'var(--md-info)' },
                    { mode: 'codereview' as FilterMode, label: 'Code Review', count: codeReviewCount, cssVar: 'var(--md-info)' },
                    { mode: 'inprogress' as FilterMode, label: 'In Progress', count: inProgressCount, cssVar: 'var(--md-warning)' },
                    { mode: 'done' as FilterMode, label: 'Done', count: doneCount, cssVar: 'var(--md-success)' },
                  ].map(({ mode, label, count, cssVar }) => {
                    const isActive = filterMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setFilterMode(mode)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 ${isActive ? 'shadow-lg' : 'hover:bg-[var(--md-surface-container-high)]'}`}
                        style={isActive ? {
                          background: cssVar,
                          color: (mode === 'inprogress' || mode === 'done') ? 'var(--md-on-warning)' : 'var(--md-on-primary)',
                          boxShadow: `0 4px 12px color-mix(in srgb, ${cssVar} 40%, transparent)`,
                        } : {
                          background: 'var(--md-surface-container)',
                          color: 'var(--md-on-surface-variant)',
                          border: '1px solid var(--md-outline-variant)',
                        }}
                      >
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Issues List */}
                <div
                  className="flex-1 overflow-y-auto space-y-3 pr-2"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--md-outline) var(--md-surface-container)',
                  }}
                >
                  {/* Stories */}
                  {(filteredData?.stories ?? []).map((story) => {
                    const priority = getPriorityConfig(story.priority);
                    return (
                      <div
                        key={story.key}
                        className="group rounded-xl p-4 transition-all duration-200 cursor-pointer bg-[var(--md-surface-container)] border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)] hover:border-[var(--md-accent)]"
                        onClick={() => window.open(story.url, '_blank')}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                background: getStatusColor(story.statusCategory),
                                boxShadow: `0 0 8px ${getStatusColor(story.statusCategory)}60`,
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getIssueTypeIcon('story')}
                              <span className="text-xs font-mono font-bold text-[var(--md-accent)]">
                                {story.key}
                              </span>

                              {/* Status with dropdown */}
                              <div className="relative status-dropdown-container">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStatusDropdown(story.key);
                                  }}
                                  disabled={updatingStatus === story.key}
                                  className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50"
                                  style={{
                                    background: `${getStatusColor(story.statusCategory)}22`,
                                    color: getStatusColor(story.statusCategory),
                                  }}
                                >
                                  {updatingStatus === story.key ? (
                                    <>
                                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      {story.status}
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </>
                                  )}
                                </button>

                                {/* Transitions dropdown */}
                                {statusDropdown === story.key && transitions[story.key] && (
                                  <div
                                    className="absolute z-20 mt-1 rounded-lg shadow-lg overflow-hidden min-w-[150px] bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {transitions[story.key].map((transition) => (
                                      <button
                                        key={transition.id}
                                        onClick={() => handleStatusUpdate(story.key, transition.id)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--md-surface-container-high)] transition-colors text-[var(--md-on-surface)]"
                                      >
                                        {transition.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {story.parentKey && (
                                <span className="text-xs text-[var(--md-on-surface-variant)]">
                                  → {story.parentKey}
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-semibold text-[var(--md-on-surface)] mb-2 group-hover:text-[var(--md-on-surface)] transition-colors">
                              {story.title}
                            </h3>

                            <div className="flex items-center justify-between">
                              {story.assignee ? (
                                <div className="flex items-center gap-2">
                                  {story.assignee.avatar ? (
                                    <img
                                      src={story.assignee.avatar}
                                      alt={story.assignee.name}
                                      className="w-6 h-6 rounded-full ring-2 ring-[var(--md-outline)]"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]">
                                      {story.assignee.name.charAt(0)}
                                    </div>
                                  )}
                                  <span className="text-sm text-[var(--md-on-surface-variant)]">
                                    {story.assignee.name}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-sm text-[var(--md-on-surface-variant)] italic">Unassigned</div>
                              )}

                              <span
                                className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                                style={{
                                  background: `${priority.color}22`,
                                  color: priority.color,
                                }}
                              >
                                <span>{priority.icon}</span>
                                {priority.label}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCommentModal(story.key, story.title);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors"
                              title="Add comment"
                            >
                              <svg className="w-4 h-4 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </button>
                            <svg className="w-4 h-4 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Tasks */}
                  {(filteredData?.tasks ?? []).map((task) => {
                    const priority = getPriorityConfig(task.priority);
                    return (
                      <div
                        key={task.key}
                        className="group rounded-xl p-4 transition-all duration-200 cursor-pointer bg-[var(--md-surface-container)] border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)] hover:border-[var(--md-accent)]"
                        onClick={() => window.open(task.url, '_blank')}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                background: getStatusColor(task.statusCategory),
                                boxShadow: `0 0 8px ${getStatusColor(task.statusCategory)}60`,
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getIssueTypeIcon('task')}
                              <span className="text-xs font-mono font-bold text-[var(--md-info)]">
                                {task.key}
                              </span>

                              {/* Status with dropdown */}
                              <div className="relative status-dropdown-container">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStatusDropdown(task.key);
                                  }}
                                  disabled={updatingStatus === task.key}
                                  className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50"
                                  style={{
                                    background: `${getStatusColor(task.statusCategory)}22`,
                                    color: getStatusColor(task.statusCategory),
                                  }}
                                >
                                  {updatingStatus === task.key ? (
                                    <>
                                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      {task.status}
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </>
                                  )}
                                </button>

                                {/* Transitions dropdown */}
                                {statusDropdown === task.key && transitions[task.key] && (
                                  <div
                                    className="absolute z-20 mt-1 rounded-lg shadow-lg overflow-hidden min-w-[150px] bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {transitions[task.key].map((transition) => (
                                      <button
                                        key={transition.id}
                                        onClick={() => handleStatusUpdate(task.key, transition.id)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--md-surface-container-high)] transition-colors text-[var(--md-on-surface)]"
                                      >
                                        {transition.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <h3 className="text-base font-semibold text-[var(--md-on-surface)] mb-2 group-hover:text-[var(--md-on-surface)] transition-colors">
                              {task.title}
                            </h3>

                            <div className="flex items-center justify-between">
                              {task.assignee ? (
                                <div className="flex items-center gap-2">
                                  {task.assignee.avatar ? (
                                    <img
                                      src={task.assignee.avatar}
                                      alt={task.assignee.name}
                                      className="w-6 h-6 rounded-full ring-2 ring-[var(--md-outline)]"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]">
                                      {task.assignee.name.charAt(0)}
                                    </div>
                                  )}
                                  <span className="text-sm text-[var(--md-on-surface-variant)]">
                                    {task.assignee.name}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-sm text-[var(--md-on-surface-variant)] italic">Unassigned</div>
                              )}

                              <span
                                className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                                style={{
                                  background: `${priority.color}22`,
                                  color: priority.color,
                                }}
                              >
                                <span>{priority.icon}</span>
                                {priority.label}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCommentModal(task.key, task.title);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors"
                              title="Add comment"
                            >
                              <svg className="w-4 h-4 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </button>
                            <svg className="w-4 h-4 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Bugs */}
                  {(filteredData?.bugs ?? []).map((bug) => {
                    const priority = getPriorityConfig(bug.priority);
                    return (
                      <div
                        key={bug.key}
                        className="group rounded-xl p-4 transition-all duration-200 cursor-pointer"
                        style={{
                          background: 'color-mix(in srgb, var(--md-error) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--md-error) 30%, transparent)',
                        }}
                        onClick={() => window.open(bug.url, '_blank')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'color-mix(in srgb, var(--md-error) 20%, transparent)';
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--md-error) 50%, transparent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'color-mix(in srgb, var(--md-error) 10%, transparent)';
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--md-error) 30%, transparent)';
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5">
                            <svg className="w-5 h-5 text-[var(--md-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getIssueTypeIcon('bug')}
                              <span className="text-xs font-mono font-bold text-[var(--md-error)]">
                                {bug.key}
                              </span>

                              {/* Status with dropdown */}
                              <div className="relative status-dropdown-container">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStatusDropdown(bug.key);
                                  }}
                                  disabled={updatingStatus === bug.key}
                                  className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50"
                                  style={{
                                    background: `${getStatusColor(bug.statusCategory)}22`,
                                    color: getStatusColor(bug.statusCategory),
                                  }}
                                >
                                  {updatingStatus === bug.key ? (
                                    <>
                                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      {bug.status}
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </>
                                  )}
                                </button>

                                {/* Transitions dropdown */}
                                {statusDropdown === bug.key && transitions[bug.key] && (
                                  <div
                                    className="absolute z-20 mt-1 rounded-lg shadow-lg overflow-hidden min-w-[150px] bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {transitions[bug.key].map((transition) => (
                                      <button
                                        key={transition.id}
                                        onClick={() => handleStatusUpdate(bug.key, transition.id)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--md-surface-container-high)] transition-colors text-[var(--md-on-surface)]"
                                      >
                                        {transition.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <h3 className="text-base font-semibold text-[var(--md-on-surface)] mb-2 transition-colors">
                              {bug.title}
                            </h3>

                            <div className="flex items-center justify-between">
                              {bug.assignee ? (
                                <div className="flex items-center gap-2">
                                  {bug.assignee.avatar ? (
                                    <img
                                      src={bug.assignee.avatar}
                                      alt={bug.assignee.name}
                                      className="w-6 h-6 rounded-full ring-2 ring-[var(--md-error)]"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--md-error)] text-[var(--md-on-error)]">
                                      {bug.assignee.name.charAt(0)}
                                    </div>
                                  )}
                                  <span className="text-sm text-[var(--md-on-surface-variant)]">
                                    {bug.assignee.name}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-sm text-[var(--md-on-surface-variant)] italic">Unassigned</div>
                              )}

                              <span
                                className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                                style={{
                                  background: `${priority.color}22`,
                                  color: priority.color,
                                }}
                              >
                                <span>{priority.icon}</span>
                                {priority.label}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCommentModal(bug.key, bug.title);
                              }}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{
                                backgroundColor: 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-error) 30%, transparent)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Add comment"
                            >
                              <svg className="w-4 h-4 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </button>
                            <svg className="w-4 h-4 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty State */}
                  {totalFiltered === 0 && (
                    <div className="py-12 text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[var(--md-surface-container-high)]"
                      >
                        <svg className="w-8 h-8 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-[var(--md-on-surface-variant)]">
                        No {filterMode === 'todo' ? 'To Do' :
                            filterMode === 'backlog' ? 'Backlog' :
                            filterMode === 'codereview' ? 'Code Review' :
                            filterMode === 'inprogress' ? 'In Progress' : 'Done'} issues
                      </h3>
                      <p className="text-sm text-[var(--md-on-surface-variant)]">
                        Try selecting a different filter
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

        {/* Slack Panel */}
        {activePanel === 'slack' && (
          <div
            className="w-full max-w-xl h-full rounded-2xl p-6 flex flex-col bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
            style={{
              boxShadow: '0 8px 32px color-mix(in srgb, var(--md-shadow) 40%, transparent), inset 0 1px 0 color-mix(in srgb, var(--md-surface-container-highest) 5%, transparent)',
            }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setActivePanel(null)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #4A154B 0%, #611f69 100%)',
                    boxShadow: '0 4px 16px rgba(74, 21, 75, 0.4)',
                  }}
                >
                  <SlackLogo size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--md-on-surface)]">
                    Slack
                  </h2>
                  <p className="text-sm text-[var(--md-on-surface-variant)]">
                    Workspace Communication
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivePanel(null)}
                className="p-2.5 rounded-xl transition-all hover:bg-[var(--md-surface-container-high)] active:scale-95 border-[var(--md-outline-variant)]"
                title="Minimize"
              >
                <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Slack Content Placeholder */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'color-mix(in srgb, var(--md-surface-container-highest) 50%, transparent)' }}
                >
                  <SlackLogo size={40} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-[var(--md-on-surface-variant)]">
                  Slack Integration
                </h3>
                <p className="text-sm text-[var(--md-on-surface-variant)] max-w-sm">
                  Connect to your Slack workspace to view channels, messages, and team communication.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confluence Panel */}
        {activePanel === 'confluence' && (
          <div
            className="w-full max-w-xl h-full rounded-2xl p-6 flex flex-col bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
            style={{
              boxShadow: '0 8px 32px color-mix(in srgb, var(--md-shadow) 40%, transparent), inset 0 1px 0 color-mix(in srgb, var(--md-surface-container-highest) 5%, transparent)',
            }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setActivePanel(null)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #2684FF 0%, #0052CC 100%)',
                    boxShadow: '0 4px 16px rgba(38, 132, 255, 0.4)',
                  }}
                >
                  <ConfluenceLogo size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--md-on-surface)]">
                    Confluence
                  </h2>
                  <p className="text-sm text-[var(--md-on-surface-variant)]">
                    Documentation & Knowledge Base
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivePanel(null)}
                className="p-2.5 rounded-xl transition-all hover:bg-[var(--md-surface-container-high)] active:scale-95 border-[var(--md-outline-variant)]"
                title="Minimize"
              >
                <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Confluence Content Placeholder */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'color-mix(in srgb, var(--md-surface-container-highest) 50%, transparent)' }}
                >
                  <ConfluenceLogo size={40} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-[var(--md-on-surface-variant)]">
                  Confluence Integration
                </h3>
                <p className="text-sm text-[var(--md-on-surface-variant)] max-w-sm">
                  Access playbooks, runbooks, and documentation from your Confluence spaces.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rootly Panel */}
        {activePanel === 'rootly' && (
          <div className="w-full max-w-xl h-full overflow-auto">
            <RootlyPanel />
          </div>
        )}

        {/* New Relic Panel */}
        {activePanel === 'newrelic' && (
          <div
            className="w-full max-w-xl h-full rounded-2xl p-6 flex flex-col bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
            style={{
              boxShadow: '0 8px 32px color-mix(in srgb, var(--md-shadow) 40%, transparent), inset 0 1px 0 color-mix(in srgb, var(--md-surface-container-highest) 5%, transparent)',
            }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setActivePanel(null)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #008C99 0%, #00AC69 100%)',
                    boxShadow: '0 4px 16px rgba(0, 172, 105, 0.4)',
                  }}
                >
                  <NewRelicLogo size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--md-on-surface)]">
                    New Relic
                  </h2>
                  <p className="text-sm text-[var(--md-on-surface-variant)]">
                    Application Performance Monitoring
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivePanel(null)}
                className="p-2.5 rounded-xl transition-all hover:bg-[var(--md-surface-container-high)] active:scale-95 border-[var(--md-outline-variant)]"
                title="Minimize"
              >
                <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* New Relic Content Placeholder */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, #008C99 0%, #00AC69 100%)' }}
                >
                  <NewRelicLogo size={48} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-[var(--md-on-surface-variant)]">
                  New Relic APM
                </h3>
                <p className="text-sm text-[var(--md-on-surface-variant)] max-w-sm">
                  Monitor application performance, errors, and infrastructure health from New Relic.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Coralogix Panel */}
        {activePanel === 'coralogix' && (
          <div className="w-full max-w-xl h-full overflow-auto">
            {/* CoralogixPanel temporarily disabled */}
            <div className="p-8 text-center text-[var(--md-on-surface)]">Coralogix Panel - Coming Soon</div>
          </div>
        )}

        {/* Metabase Panel */}
        {activePanel === 'metabase' && (
          <div
            className="w-full max-w-xl h-full rounded-2xl p-6 flex flex-col bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
            style={{
              boxShadow: '0 8px 32px color-mix(in srgb, var(--md-shadow) 40%, transparent), inset 0 1px 0 color-mix(in srgb, var(--md-surface-container-highest) 5%, transparent)',
            }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setActivePanel(null)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #509EE3 0%, #2E78C7 100%)',
                    boxShadow: '0 4px 16px rgba(80, 158, 227, 0.4)',
                  }}
                >
                  <MetabaseLogo size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--md-on-surface)]">
                    Metabase
                  </h2>
                  <p className="text-sm text-[var(--md-on-surface-variant)]">
                    Business Intelligence & Analytics
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivePanel(null)}
                className="p-2.5 rounded-xl transition-all hover:bg-[var(--md-surface-container-high)] active:scale-95 border-[var(--md-outline-variant)]"
                title="Minimize"
              >
                <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Metabase Content Placeholder */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, #509EE3 0%, #2E78C7 100%)' }}
                >
                  <MetabaseLogo size={48} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-[var(--md-on-surface-variant)]">
                  Metabase Dashboards
                </h3>
                <p className="text-sm text-[var(--md-on-surface-variant)] max-w-sm">
                  View business dashboards, reports, and data visualizations from Metabase.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Comment Modal */}
      {commentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'color-mix(in srgb, var(--md-shadow) 50%, transparent)',
          }}
          onClick={() => setCommentModal(null)}
        >
          <div
            className="w-full max-w-lg m-4 rounded-2xl overflow-hidden shadow-2xl bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[var(--md-outline-variant)]"
            >
              <div>
                <h3 className="text-lg font-semibold text-[var(--md-on-surface)]">
                  Add Comment
                </h3>
                <p className="text-sm text-[var(--md-on-surface-variant)]">
                  {commentModal.issueKey}: {commentModal.title.length > 50 ? commentModal.title.substring(0, 50) + '...' : commentModal.title}
                </p>
              </div>
              <button
                onClick={() => setCommentModal(null)}
                className="p-2 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors"
              >
                <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your comment here..."
                className="w-full h-32 px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--md-accent)] text-[var(--md-on-surface)] bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]"
                autoFocus
              />

              {commentError && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--md-error-container)] border-[var(--md-error)]">
                  <p className="text-sm text-[var(--md-on-error-container)]">
                    {commentError}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--md-outline-variant)]"
            >
              <button
                onClick={() => setCommentModal(null)}
                className="px-4 py-2 rounded-lg font-medium transition-all hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmittingComment}
                className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--md-accent)] text-[var(--md-on-accent)]"
              >
                {isSubmittingComment ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Adding...
                  </span>
                ) : (
                  'Add Comment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
