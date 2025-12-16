'use client';

/**
 * Multi-Agent Context Provider
 *
 * Manages state for the multi-agent grid view including view mode,
 * agent positions, focus state, and transition animations.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ViewMode, GridCoordinates, GridAgent, AgentMessage } from '@/types/views';

// localStorage key for persisting view mode
const VIEW_MODE_STORAGE_KEY = 'thebridge-view-mode';
// MultiAgentState is exported from types for external consumers

/**
 * Multi-Agent Context Interface
 */
interface MultiAgentContextValue {
  // State
  viewMode: ViewMode;
  gridAgents: GridAgent[];
  focusedAgentId: string | null;
  expandedAgentId: string | null;
  isTransitioning: boolean;
  mainChatMessages: AgentMessage[];

  // Actions
  setViewMode: (mode: ViewMode) => void;
  spawnAgent: (agentId: string, isGeneralAgent?: boolean, initialMessages?: AgentMessage[]) => void;
  closeAgent: (agentId: string) => void;
  focusAgent: (agentId: string | null) => void;
  expandAgent: (agentId: string | null) => void;
  reorderAgents: (fromIndex: number, toIndex: number) => void;
  getNextGridPosition: () => GridCoordinates;
  setMainChatMessages: (messages: AgentMessage[]) => void;
}

const MultiAgentContext = createContext<MultiAgentContextValue | undefined>(undefined);

interface MultiAgentProviderProps {
  children: React.ReactNode;
}

/**
 * Multi-Agent Context Provider
 */
export function MultiAgentProvider({ children }: MultiAgentProviderProps) {
  const [viewMode, setViewModeState] = useState<ViewMode>('chat');
  const [gridAgents, setGridAgents] = useState<GridAgent[]>([]);
  const [focusedAgentId, setFocusedAgentId] = useState<string | null>(null);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mainChatMessages, setMainChatMessagesState] = useState<AgentMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved view mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved && (saved === 'chat' || saved === 'dashboard' || saved === 'multiagent')) {
      // Only restore chat or dashboard - multiagent requires agents to be spawned
      if (saved === 'chat' || saved === 'dashboard') {
        setViewModeState(saved as ViewMode);
      }
    }
    setIsHydrated(true);
  }, []);

  // Persist view mode changes to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }
  }, [viewMode, isHydrated]);

  /**
   * Set main chat messages (called before transitioning to preserve conversation)
   */
  const setMainChatMessages = useCallback((messages: AgentMessage[]) => {
    setMainChatMessagesState(messages);
  }, []);

  /**
   * Maximum grid dimensions
   */
  const MAX_AGENTS = 9; // 3x3 grid
  const COLS = 3;

  /**
   * Calculate next available grid position
   */
  const getNextGridPosition = useCallback((): GridCoordinates => {
    if (gridAgents.length === 0) {
      return { row: 0, col: 0 };
    }

    // Fill left-to-right, then new rows
    const occupiedPositions = new Set(
      gridAgents.map(agent => `${agent.row},${agent.col}`)
    );

    let row = 0;
    let col = 0;

    while (occupiedPositions.has(`${row},${col}`)) {
      col++;
      if (col >= COLS) {
        col = 0;
        row++;
      }
    }

    return { row, col };
  }, [gridAgents]);

  /**
   * Change view mode with transition handling
   */
  const setViewMode = useCallback((mode: ViewMode) => {
    setIsTransitioning(true);
    setViewModeState(mode);

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400); // Match animation duration
  }, []);

  /**
   * Spawn a new agent in the grid
   * @param agentId - The agent ID to spawn
   * @param isGeneralAgent - Whether this is the general agent
   * @param initialMessages - Messages to initialize the general agent with (passed directly to avoid async state issues)
   */
  const spawnAgent = useCallback((agentId: string, isGeneralAgent = false, initialMessages?: AgentMessage[]) => {
    // Use functional update to ensure we have the latest gridAgents state
    setGridAgents(currentAgents => {
      // Check if agent already exists
      if (currentAgents.some(agent => agent.id === agentId)) {
        // Focus existing agent instead (do this outside the updater)
        setTimeout(() => setFocusedAgentId(agentId), 0);
        return currentAgents; // Return unchanged
      }

      // Check maximum agents limit
      if (currentAgents.length >= MAX_AGENTS) {
        console.warn(`Maximum agent limit (${MAX_AGENTS}) reached`);
        return currentAgents; // Return unchanged
      }

      // Auto-transition to multiagent view on first non-general agent spawn
      if (viewMode === 'chat' && !isGeneralAgent && currentAgents.length === 0) {
        setIsTransitioning(true);

        // Use passed initialMessages (preferred) or fall back to mainChatMessages state
        const messagesToPreserve = initialMessages || mainChatMessages;

        // First, add General agent at [0,0] - preserve main chat messages!
        const generalAgent: GridAgent = {
          id: 'general',
          row: 0,
          col: 0,
          isGeneralAgent: true,
          status: 'idle',
          messages: messagesToPreserve, // Preserve the conversation from main chat
          name: 'General',
        };

        // Then add the new agent at [0,1]
        const newAgent: GridAgent = {
          id: agentId,
          row: 0,
          col: 1,
          isGeneralAgent: false,
          status: 'idle',
          messages: [],
          name: agentId,
        };

        setViewModeState('multiagent');
        setTimeout(() => setFocusedAgentId(agentId), 0);

        // Clear main chat messages after transition (they're now in the general agent)
        setMainChatMessagesState([]);

        setTimeout(() => {
          setIsTransitioning(false);
        }, 400);

        return [generalAgent, newAgent];
      }

      // Regular agent spawn - calculate position based on current agents
      const getPosition = () => {
        for (let row = 0; row < MAX_AGENTS; row++) {
          for (let col = 0; col < COLS; col++) {
            const isOccupied = currentAgents.some(
              agent => agent.row === row && agent.col === col
            );
            if (!isOccupied) {
              return { row, col };
            }
          }
        }
        return { row: Math.floor(currentAgents.length / COLS), col: currentAgents.length % COLS };
      };

      const position = getPosition();
      const newAgent: GridAgent = {
        id: agentId,
        row: position.row,
        col: position.col,
        isGeneralAgent,
        status: 'idle',
        messages: [],
        name: agentId,
      };

      setTimeout(() => setFocusedAgentId(agentId), 0);

      // If this is the first agent, transition to multiagent view
      if (currentAgents.length === 0 && viewMode === 'chat') {
        setTimeout(() => setViewMode('multiagent'), 0);
      }

      return [...currentAgents, newAgent];
    });
  }, [viewMode, setViewMode, mainChatMessages]);

  /**
   * Close an agent and reflow the grid
   */
  const closeAgent = useCallback((agentId: string) => {
    setGridAgents(prev => {
      const filtered = prev.filter(agent => agent.id !== agentId);

      // Reflow positions: fill left-to-right, top-to-bottom
      const reflowed = filtered.map((agent, index) => ({
        ...agent,
        row: Math.floor(index / COLS),
        col: index % COLS,
      }));

      // If we're closing the last non-general agent, transition back to chat
      if (reflowed.length === 1 && reflowed[0].isGeneralAgent) {
        setTimeout(() => {
          setViewMode('chat');
          setGridAgents([]);
        }, 300); // Delay for close animation
      }

      return reflowed;
    });

    // Clear focus if we closed the focused agent
    if (focusedAgentId === agentId) {
      setFocusedAgentId(null);
    }

    // Clear expand if we closed the expanded agent
    if (expandedAgentId === agentId) {
      setExpandedAgentId(null);
    }
  }, [focusedAgentId, expandedAgentId, setViewMode]);

  /**
   * Focus an agent (or clear focus)
   */
  const focusAgent = useCallback((agentId: string | null) => {
    setFocusedAgentId(agentId);
  }, []);

  /**
   * Expand an agent to full width (or clear expansion)
   */
  const expandAgent = useCallback((agentId: string | null) => {
    setExpandedAgentId(agentId);

    // When expanding, also focus the agent
    if (agentId) {
      setFocusedAgentId(agentId);
    }
  }, []);

  /**
   * Reorder agents (for drag-drop support)
   */
  const reorderAgents = useCallback((fromIndex: number, toIndex: number) => {
    setGridAgents(prev => {
      const reordered = [...prev];
      const [movedAgent] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, movedAgent);

      // Update positions after reorder
      return reordered.map((agent, index) => ({
        ...agent,
        row: Math.floor(index / COLS),
        col: index % COLS,
      }));
    });
  }, []);

  const value = useMemo<MultiAgentContextValue>(
    () => ({
      viewMode,
      gridAgents,
      focusedAgentId,
      expandedAgentId,
      isTransitioning,
      mainChatMessages,
      setViewMode,
      spawnAgent,
      closeAgent,
      focusAgent,
      expandAgent,
      reorderAgents,
      getNextGridPosition,
      setMainChatMessages,
    }),
    [
      viewMode,
      gridAgents,
      focusedAgentId,
      expandedAgentId,
      isTransitioning,
      mainChatMessages,
      setViewMode,
      spawnAgent,
      closeAgent,
      focusAgent,
      expandAgent,
      reorderAgents,
      getNextGridPosition,
      setMainChatMessages,
    ]
  );

  return <MultiAgentContext.Provider value={value}>{children}</MultiAgentContext.Provider>;
}

/**
 * Hook to use multi-agent context
 */
export function useMultiAgent(): MultiAgentContextValue {
  const context = useContext(MultiAgentContext);

  if (!context) {
    throw new Error('useMultiAgent must be used within a MultiAgentProvider');
  }

  return context;
}

/**
 * Export context for advanced usage
 */
export { MultiAgentContext };
