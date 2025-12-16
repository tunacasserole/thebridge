'use client';

import { useRef, useEffect, useState } from 'react';
import {
  RootlyLogo,
  CoralogixLogo,
  NewRelicLogo,
  JiraLogo,
  GitHubLogo,
  SlackLogo,
} from '@/components/logos';
import { useDashboard } from '@/contexts/DashboardContext';
import type { DashboardPanelId } from './DashboardRadialLauncher';

interface PanelConfig {
  id: DashboardPanelId;
  name: string;
  icon: React.ReactNode;
  gradient: string;
}

const PANEL_CONFIGS: PanelConfig[] = [
  {
    id: 'rootly',
    name: 'Rootly',
    icon: <RootlyLogo width={18} height={18} />,
    gradient: 'linear-gradient(135deg, #1E1A33 0%, #2D2750 100%)',
  },
  {
    id: 'coralogix',
    name: 'Coralogix',
    icon: <CoralogixLogo width={18} height={18} />,
    gradient: 'linear-gradient(135deg, #2D8B6F 0%, #1A5A45 100%)',
  },
  {
    id: 'newrelic',
    name: 'New Relic',
    icon: <NewRelicLogo width={18} height={18} />,
    gradient: 'linear-gradient(135deg, #008C99 0%, #00AC69 100%)',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: <GitHubLogo size={18} />,
    gradient: 'linear-gradient(135deg, #24292e 0%, #1b1f23 100%)',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: <SlackLogo size={18} />,
    gradient: 'linear-gradient(135deg, #4A154B 0%, #611f69 100%)',
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: <JiraLogo width={18} height={18} />,
    gradient: 'linear-gradient(135deg, #0052CC 0%, #2684FF 100%)',
  },
];

// Animation delay before header button appears (ms)
const ENTRANCE_DELAY = 400;
// Animation duration for the entrance (ms)
const ENTRANCE_DURATION = 500;

export default function HeaderLauncherButton() {
  const {
    activePanels,
    launcherInHeader,
    isLauncherOpen,
    setIsLauncherOpen,
    launchPanel,
    isDashboardView,
  } = useDashboard();

  const containerRef = useRef<HTMLDivElement>(null);

  // Track visibility state for entrance animation
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle delayed entrance animation when launcherInHeader becomes true
  useEffect(() => {
    // Only show in dashboard view with launcher in header
    const shouldShow = launcherInHeader && isDashboardView;

    if (shouldShow) {
      // Start rendering but invisible
      setShouldRender(true);
      // Delay before starting the fade-in animation
      const delayTimer = setTimeout(() => {
        setIsVisible(true);
      }, ENTRANCE_DELAY);

      return () => clearTimeout(delayTimer);
    } else {
      // When hiding, fade out first then stop rendering
      setIsVisible(false);
      // If not in dashboard view, hide immediately without animation delay
      if (!isDashboardView) {
        setShouldRender(false);
      } else {
        // Still in dashboard but no panels - animate out
        const hideTimer = setTimeout(() => {
          setShouldRender(false);
        }, ENTRANCE_DURATION);
        return () => clearTimeout(hideTimer);
      }
    }
  }, [launcherInHeader, isDashboardView]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsLauncherOpen(false);
      }
    };

    if (isLauncherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLauncherOpen, setIsLauncherOpen]);

  // Only render when shouldRender is true
  if (!shouldRender) {
    return null;
  }

  const handlePanelClick = (panelId: DashboardPanelId) => {
    launchPanel(panelId);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-8px)',
        transition: `opacity ${ENTRANCE_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1), transform ${ENTRANCE_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
      }}
    >
      {/* Launcher button - orange for dashboard */}
      <button
        onClick={() => setIsLauncherOpen(!isLauncherOpen)}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          ${isLauncherOpen ? 'scale-110' : ''}
        `}
        style={{
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          boxShadow: isLauncherOpen
            ? '0 0 20px rgba(249, 115, 22, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
        aria-label="Launch dashboard panel"
        title="Launch dashboard panel"
      >
        <svg
          className={`w-5 h-5 text-white transition-transform duration-300 ${isLauncherOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>

      {/* Dropdown menu with panel options */}
      {isLauncherOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-2 rounded-xl z-50"
          style={{
            backgroundColor: 'var(--md-surface-container-high)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(249, 115, 22, 0.2)',
            minWidth: '200px',
          }}
        >
          {/* Title */}
          <p
            className="text-xs font-semibold px-2 py-1 mb-1"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            Launch Panel
          </p>

          {/* Panel options */}
          <div className="space-y-1">
            {PANEL_CONFIGS.map((panel) => {
              const isActive = activePanels.includes(panel.id);

              return (
                <button
                  key={panel.id}
                  onClick={() => handlePanelClick(panel.id)}
                  disabled={isActive}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[var(--md-surface-container-highest)] active:scale-98'
                    }
                  `}
                  style={{ color: 'var(--md-on-surface)' }}
                >
                  {/* Icon with gradient background */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: panel.gradient }}
                  >
                    {panel.icon}
                  </div>

                  {/* Name */}
                  <span className="text-sm font-medium">{panel.name}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <div
                      className="ml-auto w-2 h-2 rounded-full bg-green-500"
                      style={{ boxShadow: '0 0 4px rgba(34, 197, 94, 0.5)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
