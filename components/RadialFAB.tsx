'use client';

import { useState, useCallback } from 'react';
import type { ViewMode } from '@/types/views';

interface RadialFABProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

/**
 * Mode configurations for the radial FAB
 * Each mode has a unique color scheme and icon
 */
const modeConfigs = {
  chat: {
    label: 'Chat',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)', // Yellow
    shadow: '0 4px 20px rgba(251, 191, 36, 0.5)',
    ring: 'rgba(251, 191, 36, 0.5)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  dashboard: {
    label: 'Dashboard',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)', // Orange
    shadow: '0 4px 20px rgba(249, 115, 22, 0.5)',
    ring: 'rgba(249, 115, 22, 0.5)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  learn: {
    label: 'Learn',
    gradient: 'linear-gradient(135deg, #a67c52, #8f6641)', // Brown (Mocha theme primary)
    shadow: '0 4px 20px rgba(166, 124, 82, 0.5)',
    ring: 'rgba(166, 124, 82, 0.5)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  multiagent: {
    label: 'Agents',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', // Indigo
    shadow: '0 4px 20px rgba(99, 102, 241, 0.5)',
    ring: 'rgba(99, 102, 241, 0.5)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
};

// Available modes to switch to (excluding multiagent as it's auto-triggered)
const availableModes: ViewMode[] = ['chat', 'dashboard', 'learn'];

export default function RadialFAB({ currentMode, onModeChange }: RadialFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainClick = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleModeSelect = useCallback((mode: ViewMode) => {
    onModeChange(mode);
    setIsExpanded(false);
  }, [onModeChange]);

  // Get modes to show in radial (exclude current mode)
  const otherModes = availableModes.filter((m) => m !== currentMode);

  // Current mode config for the main button
  const currentConfig = modeConfigs[currentMode] || modeConfigs.chat;

  return (
    <div className="fixed bottom-9 right-6 z-50">
      {/* Radial buttons - appear in arc when expanded */}
      {otherModes.map((mode, index) => {
        const config = modeConfigs[mode];
        // Calculate position in an arc (spread 90 degrees from bottom-right)
        // Start from top-left quadrant relative to main button
        const totalModes = otherModes.length;
        const startAngle = 180; // Start from left
        const endAngle = 270; // End at top
        const angleStep = (endAngle - startAngle) / (totalModes - 1 || 1);
        const angle = startAngle + index * angleStep;
        const radians = (angle * Math.PI) / 180;
        const distance = 70; // Distance from main button
        const x = Math.cos(radians) * distance;
        const y = Math.sin(radians) * distance;

        return (
          <button
            key={mode}
            onClick={() => handleModeSelect(mode)}
            className={`
              absolute w-12 h-12 rounded-full
              flex items-center justify-center
              transition-all duration-300 ease-out
              hover:scale-110 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-offset-2
              shadow-lg hover:shadow-xl
              ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}
            `}
            style={{
              background: config.gradient,
              boxShadow: `${config.shadow}, var(--elevation-2)`,
              transform: isExpanded
                ? `translate(${x}px, ${y}px) scale(1)`
                : 'translate(0, 0) scale(0)',
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
              // @ts-expect-error CSS custom property
              '--tw-ring-color': config.ring,
              '--tw-ring-offset-color': 'var(--md-surface)',
            }}
            aria-label={`Switch to ${config.label}`}
            title={config.label}
          >
            <span className="text-white">{config.icon}</span>
          </button>
        );
      })}

      {/* Main FAB button */}
      <button
        onClick={handleMainClick}
        className={`
          relative w-14 h-14 rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-offset-2
          shadow-lg hover:shadow-xl
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}
        style={{
          background: currentConfig.gradient,
          boxShadow: `${currentConfig.shadow}, var(--elevation-3)`,
          // @ts-expect-error CSS custom property
          '--tw-ring-color': currentConfig.ring,
          '--tw-ring-offset-color': 'var(--md-surface)',
        }}
        aria-label={isExpanded ? 'Close mode selector' : `Current mode: ${currentConfig.label}`}
        title={isExpanded ? 'Close' : currentConfig.label}
      >
        <span className="text-white transition-transform duration-300">
          {isExpanded ? (
            // Plus icon (rotated to X)
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          ) : (
            currentConfig.icon
          )}
        </span>
      </button>

      {/* Backdrop to close when clicking outside */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
