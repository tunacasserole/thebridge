'use client';

import { useState, useEffect } from 'react';
import { AGENT_CONFIGS } from '@/lib/agents/configs';
import { useRole } from '@/contexts/RoleContext';

interface AgentFormData {
  slug: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
}

// Type for database agent
interface DbAgent {
  id: string;
  slug: string;
  role: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  icon: string | null;
  isDefault: boolean;
  isHidden: boolean;
  sortOrder: number;
}

// Sparkle icon component with optional animation
function SparkleIcon({ className = '', animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} ${animate ? 'animate-pulse' : ''}`}
      fill="currentColor"
    >
      {/* Main sparkle */}
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
      {/* Small sparkle top-right */}
      <path d="M19 0L19.75 2.25L22 3L19.75 3.75L19 6L18.25 3.75L16 3L18.25 2.25L19 0Z" opacity="0.6" />
      {/* Small sparkle bottom-left */}
      <path d="M5 16L5.5 17.5L7 18L5.5 18.5L5 20L4.5 18.5L3 18L4.5 17.5L5 16Z" opacity="0.6" />
    </svg>
  );
}

interface PromptEditorPanelProps {
  agentId: string | null; // null for create mode, agent ID for edit mode
  isOpen: boolean;
  isCreateMode?: boolean; // true for new agent, false for editing existing
  onClose: () => void;
  onSave: (agentId: string, prompt: string) => void;
  onCreateAgent?: (data: AgentFormData) => Promise<void>;
  onDelete?: (agentId: string) => Promise<void>; // Delete agent callback (custom agents only)
  onToggleHidden?: (agentId: string, isHidden: boolean) => Promise<void>; // Hide/show agent callback
}

const DEFAULT_ACCENT_COLOR = '#6366f1';

// Skeuomorphic icon components - classic macOS/iOS style
const SkeuomorphicIcon = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

// ~50 Skeuomorphic Icons for Agent Selection
const ICON_OPTIONS = [
  // AI & Robotics
  { id: 'robot', label: 'Robot', icon: <SkeuomorphicIcon><circle cx="12" cy="8" r="4"/><path d="M6 20v-4a6 6 0 0112 0v4"/><circle cx="9" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="7" r="1" fill="currentColor"/><path d="M12 4V2M8 4l-1-2M16 4l1-2"/></SkeuomorphicIcon> },
  { id: 'brain', label: 'Brain', icon: <SkeuomorphicIcon><path d="M12 4.5a2.5 2.5 0 00-4.96-.46 2.5 2.5 0 00-1.98 3 2.5 2.5 0 00.5 4.96v.5a2.5 2.5 0 002.96 2.46 2.5 2.5 0 004.96 0 2.5 2.5 0 002.96-2.46v-.5a2.5 2.5 0 00.5-4.96 2.5 2.5 0 00-1.98-3A2.5 2.5 0 0012 4.5"/><path d="M12 4.5V20"/></SkeuomorphicIcon> },
  { id: 'sparkles', label: 'Magic', icon: <SkeuomorphicIcon><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"/><path d="M19 5l.5 1.5L21 7l-1.5.5L19 9l-.5-1.5L17 7l1.5-.5L19 5z"/></SkeuomorphicIcon> },
  { id: 'cpu', label: 'CPU', icon: <SkeuomorphicIcon><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></SkeuomorphicIcon> },
  { id: 'chip', label: 'Chip', icon: <SkeuomorphicIcon><rect x="6" y="6" width="12" height="12" rx="1"/><path d="M6 10h-4M6 14h-4M18 10h4M18 14h4M10 6V2M14 6V2M10 18v4M14 18v4"/></SkeuomorphicIcon> },

  // Analysis & Data
  { id: 'chart', label: 'Chart', icon: <SkeuomorphicIcon><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 5-5"/><circle cx="20" cy="7" r="2"/></SkeuomorphicIcon> },
  { id: 'analytics', label: 'Analytics', icon: <SkeuomorphicIcon><path d="M21 12h-4l-3 9L9 3l-3 9H2"/></SkeuomorphicIcon> },
  { id: 'bar-chart', label: 'Bar Chart', icon: <SkeuomorphicIcon><rect x="3" y="12" width="4" height="9"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="3" width="4" height="18"/></SkeuomorphicIcon> },
  { id: 'pie', label: 'Pie Chart', icon: <SkeuomorphicIcon><path d="M21 12A9 9 0 1112 3"/><path d="M21 12L12 12V3a9 9 0 019 9z"/></SkeuomorphicIcon> },
  { id: 'trending', label: 'Trending', icon: <SkeuomorphicIcon><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></SkeuomorphicIcon> },

  // Search & Discovery
  { id: 'search', label: 'Search', icon: <SkeuomorphicIcon><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></SkeuomorphicIcon> },
  { id: 'magnify', label: 'Magnify', icon: <SkeuomorphicIcon><circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/><path d="M10 7v6M7 10h6"/></SkeuomorphicIcon> },
  { id: 'radar', label: 'Radar', icon: <SkeuomorphicIcon><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></SkeuomorphicIcon> },
  { id: 'scan', label: 'Scan', icon: <SkeuomorphicIcon><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></SkeuomorphicIcon> },
  { id: 'filter', label: 'Filter', icon: <SkeuomorphicIcon><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></SkeuomorphicIcon> },

  // Security & Protection
  { id: 'shield', label: 'Shield', icon: <SkeuomorphicIcon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></SkeuomorphicIcon> },
  { id: 'lock', label: 'Lock', icon: <SkeuomorphicIcon><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></SkeuomorphicIcon> },
  { id: 'key', label: 'Key', icon: <SkeuomorphicIcon><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78L15 9l.71-.71L19 5l2-2"/></SkeuomorphicIcon> },
  { id: 'fingerprint', label: 'Fingerprint', icon: <SkeuomorphicIcon><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 018 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6"/><path d="M18 12c0 4-2 6-4 6s-4-2-4-6"/><path d="M12 12c0 2 1 3 2 3"/></SkeuomorphicIcon> },
  { id: 'eye', label: 'Eye', icon: <SkeuomorphicIcon><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></SkeuomorphicIcon> },

  // Development & Code
  { id: 'code', label: 'Code', icon: <SkeuomorphicIcon><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></SkeuomorphicIcon> },
  { id: 'terminal', label: 'Terminal', icon: <SkeuomorphicIcon><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></SkeuomorphicIcon> },
  { id: 'bug', label: 'Bug', icon: <SkeuomorphicIcon><path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 016 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0112 0v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H3M6 17l-3 1M17.47 9c1.93-.2 3.53-1.9 3.53-4M18 13h3M18 17l3 1"/></SkeuomorphicIcon> },
  { id: 'git', label: 'Git', icon: <SkeuomorphicIcon><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/></SkeuomorphicIcon> },
  { id: 'database', label: 'Database', icon: <SkeuomorphicIcon><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></SkeuomorphicIcon> },

  // Communication & Alerts
  { id: 'bell', label: 'Bell', icon: <SkeuomorphicIcon><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></SkeuomorphicIcon> },
  { id: 'alert', label: 'Alert', icon: <SkeuomorphicIcon><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></SkeuomorphicIcon> },
  { id: 'message', label: 'Message', icon: <SkeuomorphicIcon><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></SkeuomorphicIcon> },
  { id: 'mail', label: 'Mail', icon: <SkeuomorphicIcon><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></SkeuomorphicIcon> },
  { id: 'phone', label: 'Phone', icon: <SkeuomorphicIcon><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></SkeuomorphicIcon> },

  // Tools & Settings
  { id: 'wrench', label: 'Wrench', icon: <SkeuomorphicIcon><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></SkeuomorphicIcon> },
  { id: 'gear', label: 'Gear', icon: <SkeuomorphicIcon><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></SkeuomorphicIcon> },
  { id: 'sliders', label: 'Sliders', icon: <SkeuomorphicIcon><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></SkeuomorphicIcon> },
  { id: 'hammer', label: 'Hammer', icon: <SkeuomorphicIcon><path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9"/><path d="M17.64 15L22 10.64a1 1 0 000-1.41l-6.34-6.35a1 1 0 00-1.41 0L10 7.12"/><path d="M14 4l6 6"/></SkeuomorphicIcon> },
  { id: 'compass', label: 'Compass', icon: <SkeuomorphicIcon><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></SkeuomorphicIcon> },

  // Files & Documents
  { id: 'file', label: 'File', icon: <SkeuomorphicIcon><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></SkeuomorphicIcon> },
  { id: 'folder', label: 'Folder', icon: <SkeuomorphicIcon><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></SkeuomorphicIcon> },
  { id: 'clipboard', label: 'Clipboard', icon: <SkeuomorphicIcon><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></SkeuomorphicIcon> },
  { id: 'book', label: 'Book', icon: <SkeuomorphicIcon><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></SkeuomorphicIcon> },
  { id: 'archive', label: 'Archive', icon: <SkeuomorphicIcon><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></SkeuomorphicIcon> },

  // Time & Calendar
  { id: 'clock', label: 'Clock', icon: <SkeuomorphicIcon><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SkeuomorphicIcon> },
  { id: 'calendar', label: 'Calendar', icon: <SkeuomorphicIcon><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SkeuomorphicIcon> },
  { id: 'timer', label: 'Timer', icon: <SkeuomorphicIcon><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6M22 6l-3-3M12 2v3"/></SkeuomorphicIcon> },
  { id: 'hourglass', label: 'Hourglass', icon: <SkeuomorphicIcon><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2"/></SkeuomorphicIcon> },

  // People & Users
  { id: 'user', label: 'User', icon: <SkeuomorphicIcon><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></SkeuomorphicIcon> },
  { id: 'users', label: 'Users', icon: <SkeuomorphicIcon><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></SkeuomorphicIcon> },
  { id: 'user-check', label: 'User Check', icon: <SkeuomorphicIcon><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></SkeuomorphicIcon> },

  // Cloud & Network
  { id: 'cloud', label: 'Cloud', icon: <SkeuomorphicIcon><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></SkeuomorphicIcon> },
  { id: 'server', label: 'Server', icon: <SkeuomorphicIcon><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></SkeuomorphicIcon> },
  { id: 'globe', label: 'Globe', icon: <SkeuomorphicIcon><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></SkeuomorphicIcon> },
  { id: 'wifi', label: 'WiFi', icon: <SkeuomorphicIcon><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></SkeuomorphicIcon> },

  // Nature & Environment
  { id: 'sun', label: 'Sun', icon: <SkeuomorphicIcon><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></SkeuomorphicIcon> },
  { id: 'moon', label: 'Moon', icon: <SkeuomorphicIcon><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></SkeuomorphicIcon> },
  { id: 'zap', label: 'Lightning', icon: <SkeuomorphicIcon><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></SkeuomorphicIcon> },
  { id: 'flame', label: 'Flame', icon: <SkeuomorphicIcon><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></SkeuomorphicIcon> },

  // Misc Objects
  { id: 'lightbulb', label: 'Lightbulb', icon: <SkeuomorphicIcon><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.9V17a1 1 0 001 1h6a1 1 0 001-1v-2.1A7 7 0 0012 2z"/></SkeuomorphicIcon> },
  { id: 'target', label: 'Target', icon: <SkeuomorphicIcon><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></SkeuomorphicIcon> },
  { id: 'flag', label: 'Flag', icon: <SkeuomorphicIcon><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></SkeuomorphicIcon> },
  { id: 'award', label: 'Award', icon: <SkeuomorphicIcon><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></SkeuomorphicIcon> },
  { id: 'star', label: 'Star', icon: <SkeuomorphicIcon><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SkeuomorphicIcon> },
  { id: 'heart', label: 'Heart', icon: <SkeuomorphicIcon><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></SkeuomorphicIcon> },
  { id: 'dollar', label: 'Dollar', icon: <SkeuomorphicIcon><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></SkeuomorphicIcon> },
  { id: 'package', label: 'Package', icon: <SkeuomorphicIcon><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></SkeuomorphicIcon> },
  { id: 'rocket', label: 'Rocket', icon: <SkeuomorphicIcon><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></SkeuomorphicIcon> },
];

export default function PromptEditorPanel({
  agentId,
  isOpen,
  isCreateMode = false,
  onClose,
  onSave,
  onCreateAgent,
  onDelete,
  onToggleHidden,
}: PromptEditorPanelProps) {
  const { currentRole } = useRole();
  const [editedPrompt, setEditedPrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTogglingHidden, setIsTogglingHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbAgent, setDbAgent] = useState<DbAgent | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);

  // Form fields for create mode
  const [formData, setFormData] = useState<AgentFormData>({
    slug: '',
    name: '',
    description: '',
    systemPrompt: '',
    icon: 'robot',
  });

  // Check built-in configs first
  const agentConfig = agentId && !isCreateMode ? AGENT_CONFIGS[agentId] : null;
  // Use DB agent if no built-in config exists
  const effectiveAgent = agentConfig || dbAgent;
  const accentColor = agentConfig?.accentColor || DEFAULT_ACCENT_COLOR;
  // Built-in agents cannot be deleted; DB agents can be deleted if they're not marked as default
  const canDelete = !agentConfig && dbAgent && !dbAgent.isDefault;

  // Fetch DB agent when agentId exists but no built-in config
  useEffect(() => {
    if (isOpen && agentId && !isCreateMode && !agentConfig) {
      setIsLoadingAgent(true);
      fetch(`/api/agents/${agentId}?role=${currentRole}`)
        .then(res => res.ok ? res.json() : null)
        .then(agent => {
          setDbAgent(agent);
          if (agent) {
            setEditedPrompt(agent.systemPrompt);
          }
          setHasChanges(false);
        })
        .catch(() => setDbAgent(null))
        .finally(() => setIsLoadingAgent(false));
    } else if (!isOpen) {
      setDbAgent(null);
    }
  }, [isOpen, agentId, isCreateMode, agentConfig, currentRole]);

  // Reset form when panel opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setShowDeleteConfirm(false);
      if (isCreateMode) {
        setFormData({
          slug: '',
          name: '',
          description: '',
          systemPrompt: '',
          icon: 'assistant',
        });
        setHasChanges(false);
      } else if (agentConfig) {
        setEditedPrompt(agentConfig.systemPrompt);
        setHasChanges(false);
      }
      // Note: DB agent prompt is set in the fetch effect above
    }
  }, [isOpen, isCreateMode, agentId, agentConfig]);

  const handlePromptChange = (value: string) => {
    if (isCreateMode) {
      setFormData(prev => ({ ...prev, systemPrompt: value }));
      setHasChanges(true);
    } else {
      setEditedPrompt(value);
      setHasChanges(value !== agentConfig?.systemPrompt);
    }
  };

  const handleFormChange = (field: keyof AgentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setError(null);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData(prev => ({ ...prev, name, slug }));
    setHasChanges(true);
    setError(null);
  };

  const handleSave = () => {
    if (agentId && hasChanges && !isCreateMode) {
      onSave(agentId, editedPrompt);
      setHasChanges(false);
    }
  };

  const handleCreate = async () => {
    if (!onCreateAgent) return;

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!formData.systemPrompt.trim()) {
      setError('System prompt is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreateAgent(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isCreateMode) {
      setFormData({
        slug: '',
        name: '',
        description: '',
        systemPrompt: '',
        icon: 'assistant',
      });
      setHasChanges(false);
    } else if (agentConfig) {
      setEditedPrompt(agentConfig.systemPrompt);
      setHasChanges(false);
    }
  };

  // Improve prompt with AI
  const handleImprovePrompt = async () => {
    const currentPrompt = isCreateMode ? formData.systemPrompt : editedPrompt;

    if (!currentPrompt.trim()) {
      setError('Please enter a prompt to improve');
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      const response = await fetch('/api/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          agentName: isCreateMode ? formData.name : agentConfig?.name,
          agentDescription: isCreateMode ? formData.description : agentConfig?.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to improve prompt');
      }

      const { improvedPrompt } = await response.json();

      // Update the prompt
      if (isCreateMode) {
        setFormData(prev => ({ ...prev, systemPrompt: improvedPrompt }));
      } else {
        setEditedPrompt(improvedPrompt);
      }
      setHasChanges(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve prompt');
    } finally {
      setIsImproving(false);
    }
  };

  // Delete agent handler
  const handleDelete = async () => {
    if (!agentId || !onDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(agentId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle visibility handler
  const handleToggleHidden = async () => {
    if (!agentId || !onToggleHidden || !dbAgent) return;

    setIsTogglingHidden(true);
    setError(null);

    try {
      await onToggleHidden(agentId, !dbAgent.isHidden);
      // Update local state to reflect the change
      setDbAgent(prev => prev ? { ...prev, isHidden: !prev.isHidden } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent visibility');
    } finally {
      setIsTogglingHidden(false);
    }
  };

  const isFormValid = isCreateMode
    ? formData.name.trim() && formData.slug.trim() && formData.systemPrompt.trim()
    : hasChanges;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`
          fixed inset-0 bg-black/30 z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Panel - wider for comfortable prompt editing */}
      <div
        className={`
          fixed right-0 top-0 h-full w-[40rem] z-50
          flex flex-col bg-[var(--md-surface)] border-l border-[var(--md-outline-variant)]
          shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-[var(--md-outline-variant)]"
          style={{
            background: `linear-gradient(to right, color-mix(in srgb, ${accentColor} 15%, transparent), transparent)`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <h2 className="text-sm font-semibold text-[var(--md-on-surface)]">
              {isCreateMode ? 'Create New Agent' : `${agentConfig?.name || dbAgent?.name || 'Agent'} Prompt`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors"
            title="Close"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-[var(--md-on-surface-variant)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-[var(--md-error-container)] border-b border-[var(--md-error)]">
            <p className="text-xs text-[var(--md-on-error-container)]">{error}</p>
          </div>
        )}

        {isCreateMode ? (
          // Create Mode Form
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Role indicator */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--md-surface-container)]">
                <span className="text-xs text-[var(--md-on-surface-variant)]">Creating agent for role:</span>
                <span className="text-xs font-medium text-[var(--md-accent)] uppercase">{currentRole}</span>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)] mb-1 block">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Log Analyzer"
                  className="w-full px-3 py-2 rounded-lg text-sm
                    bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                    border border-[var(--md-outline-variant)]
                    focus:outline-none focus:ring-2 focus:border-transparent
                    placeholder:text-[var(--md-on-surface-variant)]"
                  style={{
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': accentColor,
                  }}
                />
              </div>

              {/* Slug (auto-generated, editable) */}
              <div>
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)] mb-1 block">
                  Slug * <span className="text-[10px] opacity-60">(auto-generated from name)</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleFormChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="e.g., log-analyzer"
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono
                    bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                    border border-[var(--md-outline-variant)]
                    focus:outline-none focus:ring-2 focus:border-transparent
                    placeholder:text-[var(--md-on-surface-variant)]"
                  style={{
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': accentColor,
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)] mb-1 block">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Brief description of what this agent does"
                  className="w-full px-3 py-2 rounded-lg text-sm
                    bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                    border border-[var(--md-outline-variant)]
                    focus:outline-none focus:ring-2 focus:border-transparent
                    placeholder:text-[var(--md-on-surface-variant)]"
                  style={{
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': accentColor,
                  }}
                />
              </div>

              {/* Icon */}
              <div>
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)] mb-2 block">
                  Icon
                </label>
                <div className="grid grid-cols-8 gap-1.5 max-h-[180px] overflow-y-auto p-2 rounded-lg bg-[var(--md-surface-container)]">
                  {ICON_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleFormChange('icon', option.id)}
                      className={`
                        flex items-center justify-center p-2 rounded-lg
                        transition-all duration-150
                        ${formData.icon === option.id
                          ? 'bg-[var(--md-accent)] text-white scale-110 shadow-md'
                          : 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-highest)] hover:scale-105'
                        }
                      `}
                      title={option.label}
                    >
                      {option.icon}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--md-on-surface-variant)] mt-1.5">
                  Selected: {ICON_OPTIONS.find(o => o.id === formData.icon)?.label || 'Robot'}
                </p>
              </div>

              {/* System Prompt */}
              <div className="flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[var(--md-on-surface-variant)]">
                    System Prompt *
                  </label>
                  <button
                    type="button"
                    onClick={handleImprovePrompt}
                    disabled={isImproving || !formData.systemPrompt.trim()}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                      transition-all duration-200
                      ${isImproving
                        ? 'bg-[var(--md-accent)] text-white'
                        : formData.systemPrompt.trim()
                          ? 'bg-[var(--md-surface-container-high)] text-[var(--md-accent)] hover:bg-[var(--md-accent)] hover:text-white'
                          : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] opacity-50 cursor-not-allowed'
                      }
                    `}
                    title="Use AI to improve this prompt"
                  >
                    <SparkleIcon className="w-3.5 h-3.5" animate={isImproving} />
                    <span>{isImproving ? 'Improving...' : 'Improve with AI'}</span>
                  </button>
                </div>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  disabled={isImproving}
                  className={`flex-1 w-full p-3 rounded-lg text-sm font-mono
                    bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                    border border-[var(--md-outline-variant)]
                    focus:outline-none focus:ring-2 focus:border-transparent
                    resize-none min-h-[200px]
                    ${isImproving ? 'opacity-60' : ''}`}
                  style={{
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': accentColor,
                  }}
                  placeholder="Enter the system prompt that defines this agent's behavior..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--md-outline-variant)]">
              <div className="text-xs text-[var(--md-on-surface-variant)]">
                <span>* Required fields</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg
                    text-[var(--md-on-surface-variant)]
                    hover:bg-[var(--md-surface-container-high)]
                    transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!isFormValid || isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                  style={{
                    backgroundColor: isFormValid && !isSubmitting ? accentColor : 'var(--md-outline)',
                  }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </div>
          </>
        ) : isLoadingAgent ? (
          // Loading state for DB agent
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-sm text-[var(--md-on-surface-variant)]">Loading agent...</div>
          </div>
        ) : effectiveAgent ? (
          // Edit Mode (existing agent - built-in or DB)
          <>
            {/* Info */}
            <div className="px-4 py-3 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container)]">
              <p className="text-xs text-[var(--md-on-surface-variant)]">
                {agentConfig?.description || dbAgent?.description || 'No description'}
              </p>
              {agentConfig?.tools && agentConfig.tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {agentConfig.tools.slice(0, 5).map((tool) => (
                    <span
                      key={tool}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]"
                    >
                      {tool}
                    </span>
                  ))}
                  {agentConfig.tools.length > 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-[var(--md-on-surface-variant)]">
                      +{agentConfig.tools.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col min-h-0 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)]">
                  System Prompt
                </label>
                <button
                  type="button"
                  onClick={handleImprovePrompt}
                  disabled={isImproving || !editedPrompt.trim()}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                    transition-all duration-200
                    ${isImproving
                      ? 'bg-[var(--md-accent)] text-white'
                      : editedPrompt.trim()
                        ? 'bg-[var(--md-surface-container-high)] text-[var(--md-accent)] hover:bg-[var(--md-accent)] hover:text-white'
                        : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] opacity-50 cursor-not-allowed'
                    }
                  `}
                  title="Use AI to improve this prompt"
                >
                  <SparkleIcon className="w-3.5 h-3.5" animate={isImproving} />
                  <span>{isImproving ? 'Improving...' : 'Improve with AI'}</span>
                </button>
              </div>
              <textarea
                value={editedPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                disabled={isImproving}
                className={`flex-1 w-full p-3 rounded-lg text-sm font-mono
                  bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                  border border-[var(--md-outline-variant)]
                  focus:outline-none focus:ring-2 focus:border-transparent
                  resize-none
                  ${isImproving ? 'opacity-60' : ''}`}
                style={{
                  // @ts-expect-error CSS custom property
                  '--tw-ring-color': accentColor,
                }}
                placeholder="Enter the system prompt for this agent..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--md-outline-variant)]">
              {/* Left - Status */}
              <div className="text-xs text-[var(--md-on-surface-variant)] w-28">
                {hasChanges ? (
                  <span className="text-[var(--md-warning)]">Unsaved changes</span>
                ) : (
                  <span>No changes</span>
                )}
              </div>

              {/* Center - Agent Actions */}
              {/* Hide/Show for all DB agents, Delete only for non-default custom agents */}
              <div className="flex-1 flex justify-center gap-2">
                {/* Hide/Show Button - for all DB agents */}
                {onToggleHidden && dbAgent && (
                  <button
                    onClick={handleToggleHidden}
                    disabled={isTogglingHidden}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      ${dbAgent.isHidden
                        ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] hover:opacity-90'
                        : 'text-[var(--md-on-surface-variant)] border border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)]'
                      }`}
                    title={dbAgent.isHidden ? 'Show this agent in sidebar' : 'Hide this agent from sidebar'}
                  >
                    {dbAgent.isHidden ? (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{isTogglingHidden ? 'Showing...' : 'Show Agent'}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                        <span>{isTogglingHidden ? 'Hiding...' : 'Hide Agent'}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Delete Button - only for non-default custom DB agents */}
                {onDelete && canDelete && (
                  showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--md-error)]">Delete?</span>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg
                          bg-[var(--md-error)] text-[var(--md-on-error)]
                          hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg
                          text-[var(--md-on-surface-variant)]
                          hover:bg-[var(--md-surface-container-high)]
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                        text-[var(--md-error)] border border-[var(--md-error)]
                        hover:bg-[var(--md-error)] hover:text-[var(--md-on-error)]
                        transition-all"
                      title="Delete this agent permanently"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  )
                )}
              </div>

              {/* Right - Reset and Save buttons */}
              <div className="flex items-center gap-2 w-28 justify-end">
                <button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg
                    text-[var(--md-on-surface-variant)]
                    hover:bg-[var(--md-surface-container-high)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                  style={{
                    backgroundColor: hasChanges ? accentColor : 'var(--md-outline)',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
