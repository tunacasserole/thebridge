'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { DashboardPanelId } from '@/components/dashboard/DashboardRadialLauncher';

interface DashboardContextValue {
  // Active panels (can have multiple open)
  activePanels: DashboardPanelId[];
  // Whether the launcher has been "activated" (moved to header)
  launcherInHeader: boolean;
  // Whether the mini launcher popup is open
  isLauncherOpen: boolean;
  setIsLauncherOpen: (open: boolean) => void;
  // Add a panel to the grid
  launchPanel: (panelId: DashboardPanelId) => void;
  // Close a specific panel
  closePanel: (panelId: DashboardPanelId) => void;
  // Close all panels and reset launcher to center
  resetLauncher: () => void;
  // Maximize a specific panel
  maximizedPanel: DashboardPanelId | null;
  setMaximizedPanel: (panelId: DashboardPanelId | null) => void;
  // Whether we're currently viewing dashboard mode
  isDashboardView: boolean;
  setIsDashboardView: (view: boolean) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activePanels, setActivePanels] = useState<DashboardPanelId[]>([]);
  const [launcherInHeader, setLauncherInHeader] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [maximizedPanel, setMaximizedPanel] = useState<DashboardPanelId | null>(null);
  const [isDashboardView, setIsDashboardView] = useState(false);

  const launchPanel = useCallback((panelId: DashboardPanelId) => {
    setActivePanels((prev) => {
      // Don't add duplicates
      if (prev.includes(panelId)) return prev;
      return [...prev, panelId];
    });
    // Move launcher to header on first panel launch
    setLauncherInHeader(true);
    // Close the launcher popup after selecting
    setIsLauncherOpen(false);
    // If a panel is maximized, restore it to grid view so the new panel fits
    setMaximizedPanel(null);
  }, []);

  const closePanel = useCallback((panelId: DashboardPanelId) => {
    setActivePanels((prev) => {
      const newPanels = prev.filter((id) => id !== panelId);
      // If no panels left, move launcher back to center
      if (newPanels.length === 0) {
        setLauncherInHeader(false);
      }
      return newPanels;
    });
    // If maximized panel is closed, clear maximized state
    setMaximizedPanel((current) => (current === panelId ? null : current));
  }, []);

  const resetLauncher = useCallback(() => {
    setActivePanels([]);
    setLauncherInHeader(false);
    setIsLauncherOpen(false);
    setMaximizedPanel(null);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        activePanels,
        launcherInHeader,
        isLauncherOpen,
        setIsLauncherOpen,
        launchPanel,
        closePanel,
        resetLauncher,
        maximizedPanel,
        setMaximizedPanel,
        isDashboardView,
        setIsDashboardView,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
