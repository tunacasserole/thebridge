'use client';

import React, { useEffect, useCallback } from 'react';
import DashboardPanel from './DashboardPanel';
import DashboardRadialLauncher, { type DashboardPanelId } from './DashboardRadialLauncher';
import RootlyPanel from './RootlyPanel';
import CoralogixPanel from './CoralogixPanel';
import JiraPanel from './JiraPanel';
import GitHubPanel from './GitHubPanel';
import SlackPanel from './SlackPanel';
import NewRelicPanel from './NewRelicPanel';
import { useDashboard } from '@/contexts/DashboardContext';
import { RootlyLogo, CoralogixLogo, JiraLogo, GitHubLogo, SlackLogo, NewRelicLogo } from '@/components/logos';

// Panel configuration - use the same type from radial launcher
type PanelId = DashboardPanelId;

interface PanelConfig {
  id: PanelId;
  title: string;
  iconBackground: string;
  iconShadow?: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ compact?: boolean; embedded?: boolean }>;
}

const PANEL_CONFIGS: PanelConfig[] = [
  {
    id: 'rootly',
    title: 'Rootly',
    iconBackground: 'linear-gradient(135deg, #1E1A33 0%, #2D2750 100%)',
    iconShadow: '0 4px 12px rgba(30, 26, 51, 0.6)',
    icon: <RootlyLogo width={24} height={24} />,
    component: RootlyPanel,
  },
  {
    id: 'coralogix',
    title: 'Coralogix',
    iconBackground: 'linear-gradient(135deg, #2D8B6F 0%, #1A5A45 100%)',
    iconShadow: '0 4px 12px rgba(60, 196, 143, 0.5)',
    icon: <CoralogixLogo width={24} height={24} />,
    component: CoralogixPanel,
  },
  {
    id: 'newrelic',
    title: 'New Relic',
    iconBackground: 'linear-gradient(135deg, #008C99 0%, #00AC69 100%)',
    iconShadow: '0 4px 12px rgba(0, 172, 105, 0.5)',
    icon: <NewRelicLogo width={24} height={24} />,
    component: NewRelicPanel,
  },
  {
    id: 'github',
    title: 'GitHub',
    iconBackground: 'linear-gradient(135deg, #24292e 0%, #1b1f23 100%)',
    iconShadow: '0 4px 12px rgba(36, 41, 46, 0.5)',
    icon: <GitHubLogo size={24} />,
    component: GitHubPanel,
  },
  {
    id: 'slack',
    title: 'Slack',
    iconBackground: 'linear-gradient(135deg, #4A154B 0%, #611f69 100%)',
    iconShadow: '0 4px 12px rgba(74, 21, 75, 0.5)',
    icon: <SlackLogo size={24} />,
    component: SlackPanel,
  },
  {
    id: 'jira',
    title: 'Jira',
    iconBackground: 'linear-gradient(135deg, #0052CC 0%, #2684FF 100%)',
    iconShadow: '0 4px 12px rgba(0, 82, 204, 0.5)',
    icon: <JiraLogo width={24} height={24} />,
    component: JiraPanel,
  },
];

interface DashboardGridProps {
  className?: string;
}

export default function DashboardGrid({ className = '' }: DashboardGridProps) {
  // Use dashboard context for state management
  const {
    activePanels,
    launchPanel,
    closePanel,
    maximizedPanel,
    setMaximizedPanel,
    setIsDashboardView,
  } = useDashboard();

  // Track that we're in dashboard view
  useEffect(() => {
    setIsDashboardView(true);
    return () => setIsDashboardView(false);
  }, [setIsDashboardView]);

  const handleSelectPanel = useCallback((panelId: PanelId) => {
    launchPanel(panelId);
  }, [launchPanel]);

  const handleMaximize = useCallback((panelId: PanelId) => {
    setMaximizedPanel(panelId);
  }, [setMaximizedPanel]);

  const handleMinimize = useCallback((panelId: PanelId) => {
    // If maximized, restore to grid
    if (maximizedPanel === panelId) {
      setMaximizedPanel(null);
    }
  }, [maximizedPanel, setMaximizedPanel]);

  const handleClose = useCallback((panelId: PanelId) => {
    closePanel(panelId);
  }, [closePanel]);

  // Show radial launcher when no panels are open
  if (activePanels.length === 0) {
    return (
      <div className={`h-full ${className}`}>
        <DashboardRadialLauncher
          onSelectPanel={handleSelectPanel}
          activePanelId={null}
        />
      </div>
    );
  }

  // If a panel is maximized, show only that panel
  if (maximizedPanel) {
    const config = PANEL_CONFIGS.find((p) => p.id === maximizedPanel);
    if (!config) return null;

    const PanelComponent = config.component;

    return (
      <div className={`h-full p-4 ${className}`}>
        <DashboardPanel
          id={config.id}
          title={config.title}
          icon={config.icon}
          iconBackground={config.iconBackground}
          iconShadow={config.iconShadow}
          isMaximized={true}
          onMaximize={() => handleMaximize(config.id)}
          onMinimize={() => handleMinimize(config.id)}
          onRefresh={() => {}}
          className="h-full"
        >
          <PanelComponent compact={false} embedded={true} />
        </DashboardPanel>
      </div>
    );
  }

  // Calculate grid layout based on number of active panels
  // Always use 2x2 grid - panels are half width, half height each
  const getGridStyle = () => {
    const count = activePanels.length;
    // Always maintain 2-column layout for consistent half-width sizing
    // Single panel: still half-width, half-height (top-left of 2x2)
    // 2 panels: side by side (top row of 2x2)
    // 3-4 panels: 2x2 grid
    // 5-6 panels: 2x3 grid
    if (count <= 4) {
      return { gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)' };
    } else {
      return { gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' };
    }
  };

  // Show grid of active panels (half width, half height each in 2x2)
  return (
    <div className={`h-full p-4 ${className}`}>
      {/* Dynamic grid based on panel count */}
      <div
        className="h-full grid gap-4"
        style={getGridStyle()}
      >
        {activePanels.map((panelId) => {
          const config = PANEL_CONFIGS.find((p) => p.id === panelId);
          if (!config) return null;

          const PanelComponent = config.component;
          return (
            <DashboardPanel
              key={config.id}
              id={config.id}
              title={config.title}
              icon={config.icon}
              iconBackground={config.iconBackground}
              iconShadow={config.iconShadow}
              isMaximized={false}
              onMaximize={() => handleMaximize(config.id)}
              onMinimize={() => handleClose(config.id)}
              onRefresh={() => {}}
              className="h-full overflow-hidden"
            >
              <PanelComponent compact={true} embedded={true} />
            </DashboardPanel>
          );
        })}
      </div>
    </div>
  );
}
