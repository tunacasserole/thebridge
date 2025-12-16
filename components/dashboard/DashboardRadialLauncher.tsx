'use client';

/**
 * DashboardRadialLauncher Component
 * Radial menu for accessing dashboard panels with animated expansion
 */

import { useMemo } from 'react';
import {
  RootlyLogo,
  CoralogixLogo,
  NewRelicLogo,
  JiraLogo,
  GitHubLogo,
  SlackLogo,
} from '@/components/logos';

export type DashboardPanelId = 'rootly' | 'coralogix' | 'newrelic' | 'github' | 'slack' | 'jira';

interface DashboardPanelConfig {
  id: DashboardPanelId;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

interface DashboardRadialLauncherProps {
  onSelectPanel: (panelId: DashboardPanelId) => void;
  activePanelId: DashboardPanelId | null;
}

const PANEL_CONFIGS: DashboardPanelConfig[] = [
  {
    id: 'rootly',
    name: 'Rootly',
    description: 'Incident management and alerts',
    icon: <RootlyLogo width={32} height={32} />,
    gradient: 'linear-gradient(135deg, #1E1A33 0%, #2D2750 100%)',
  },
  {
    id: 'coralogix',
    name: 'Coralogix',
    description: 'Log analytics and monitoring',
    icon: <CoralogixLogo width={32} height={32} />,
    gradient: 'linear-gradient(135deg, #2D8B6F 0%, #1A5A45 100%)',
  },
  {
    id: 'newrelic',
    name: 'New Relic',
    description: 'Application monitoring and APM',
    icon: <NewRelicLogo width={32} height={32} />,
    gradient: 'linear-gradient(135deg, #008C99 0%, #00AC69 100%)',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Pull requests and code review',
    icon: <GitHubLogo size={32} />,
    gradient: 'linear-gradient(135deg, #24292e 0%, #1b1f23 100%)',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication hub',
    icon: <SlackLogo size={32} />,
    gradient: 'linear-gradient(135deg, #4A154B 0%, #611f69 100%)',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Tasks, stories, and epics',
    icon: <JiraLogo width={32} height={32} />,
    gradient: 'linear-gradient(135deg, #0052CC 0%, #2684FF 100%)',
  },
];

export default function DashboardRadialLauncher({
  onSelectPanel,
  activePanelId,
}: DashboardRadialLauncherProps) {
  // Calculate positions for radial layout
  const itemPositions = useMemo(() => {
    const radius = 180; // Distance from center
    const angleStep = (2 * Math.PI) / PANEL_CONFIGS.length;
    const startAngle = -Math.PI / 2; // Start from top

    return PANEL_CONFIGS.map((panel, index) => {
      const angle = startAngle + angleStep * index;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      return {
        panel,
        x,
        y,
        delay: index * 50,
      };
    });
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full">
      {/* Container for radial elements (500px) */}
      <div
        className="relative"
        style={{
          width: '500px',
          height: '500px',
        }}
      >
        {/* Central Hub (w-28 h-28) - Orange for Dashboard */}
        <div
          className="absolute w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: '0 0 60px rgba(249, 115, 22, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3)',
            zIndex: 10,
          }}
        >
          <div className="text-center">
            <svg
              className="w-10 h-10 mx-auto mb-1 text-white"
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
            <p className="text-sm font-bold text-white">
              Launch
            </p>
          </div>
        </div>

        {/* Connecting Lines (500px) */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            height: '500px',
            zIndex: 5,
          }}
        >
          <defs>
            {/* Individual gradients for each line, pointing from center to edge */}
            {itemPositions.map(({ x, y }, index) => {
              // Use userSpaceOnUse with absolute coordinates for proper gradient direction
              const endX = 250 + x;
              const endY = 250 + y;

              return (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`launcherLineGradient-${index}`}
                  gradientUnits="userSpaceOnUse"
                  x1="250"
                  y1="250"
                  x2={endX}
                  y2={endY}
                >
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.15" />
                </linearGradient>
              );
            })}
          </defs>
          {itemPositions.map(({ panel, x, y }, index) => (
            <line
              key={`line-${panel.id}`}
              x1="250"
              y1="250"
              x2={250 + x}
              y2={250 + y}
              stroke={`url(#launcherLineGradient-${index})`}
              strokeWidth="2"
              strokeDasharray="6 6"
              className="animate-radial-line"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            />
          ))}
        </svg>

        {/* Radial Items - Square buttons like original design */}
        {itemPositions.map(({ panel, x, y, delay }) => {
          const isActive = activePanelId === panel.id;
          const leftPx = 250 + x;
          const topPx = 250 + y;

          return (
            <button
              key={panel.id}
              onClick={() => onSelectPanel(panel.id)}
              className={`
                absolute w-[100px] h-[90px] rounded-2xl
                transition-all duration-300
                hover:scale-110 hover:-translate-y-1
                group
                animate-radial-item
                ${isActive ? 'ring-2 ring-white/50 scale-105' : ''}
              `}
              style={{
                left: `${leftPx}px`,
                top: `${topPx}px`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${delay}ms`,
                boxShadow: isActive
                  ? '0 8px 32px rgba(255, 255, 255, 0.3)'
                  : '0 4px 20px rgba(0, 0, 0, 0.3)',
                zIndex: 10,
              }}
            >
              {/* Gradient Background */}
              <div
                className="absolute inset-0 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"
                style={{ background: panel.gradient }}
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {panel.icon}
                </div>
                <p
                  className="text-sm font-bold text-center leading-tight mt-2"
                  style={{ color: 'white', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                >
                  {panel.name}
                </p>
              </div>

              {/* Hover Glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  boxShadow: '0 0 40px rgba(249, 115, 22, 0.6)',
                }}
              />

              {/* Tooltip */}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--md-surface-container-high)',
                  color: 'var(--md-on-surface)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  zIndex: 20,
                }}
              >
                <p className="text-sm font-semibold">{panel.name}</p>
                <p className="text-xs text-[var(--md-on-surface-variant)]">
                  {panel.description}
                </p>
              </div>
            </button>
          );
        })}

      </div>
    </div>
  );
}
