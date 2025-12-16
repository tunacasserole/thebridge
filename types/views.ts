/**
 * Multi-Agent View System Types
 *
 * Type definitions for TheBridge's multi-agent dashboard and grid layout system.
 * Supports up to 9 agents in a 3x3 grid configuration with real-time status tracking.
 */

/**
 * Available view modes in TheBridge
 */
export type ViewMode = 'chat' | 'dashboard' | 'multiagent';

/**
 * Agent status states
 */
export type AgentStatus = 'idle' | 'connecting' | 'streaming' | 'error';

/**
 * Grid position for an agent in the 3x3 layout
 */
export interface AgentGridPosition {
  /** Unique identifier for the agent */
  id: string;

  /** Row position (0-2) */
  row: number;

  /** Column position (0-2) */
  col: number;

  /** Whether this is the general/main agent */
  isGeneralAgent: boolean;
}

/**
 * Message structure for agent conversations
 */
export interface AgentMessage {
  /** Unique message identifier */
  id: string;

  /** Message role */
  role: 'user' | 'assistant' | 'system';

  /** Message content */
  content: string;

  /** Timestamp */
  timestamp: number;
}

/**
 * Complete agent state including position, status, and messages
 */
export interface GridAgent extends AgentGridPosition {
  /** Current agent status */
  status: AgentStatus;

  /** Agent's conversation messages */
  messages: AgentMessage[];

  /** Agent's assigned role or specialty */
  role?: string;

  /** Display name for the agent */
  name: string;

  /** Current streaming message (if streaming) */
  streamingMessage?: string;

  /** Error message (if status is 'error') */
  errorMessage?: string;
}

/**
 * Global state for the multi-agent view system
 */
export interface MultiAgentState {
  /** Current view mode */
  viewMode: ViewMode;

  /** All active agents in the grid */
  agents: GridAgent[];

  /** ID of the currently selected/focused agent */
  selectedAgentId: string | null;

  /** Whether the grid is in fullscreen mode */
  isFullscreen: boolean;

  /** Grid layout configuration */
  gridConfig: {
    rows: number;
    columns: number;
  };
}

/**
 * Maximum number of agents supported in the grid (3x3)
 */
export const MAX_AGENTS = 9;

/**
 * Number of columns in the grid layout
 */
export const GRID_COLUMNS = 3;

/**
 * Number of rows in the grid layout
 */
export const GRID_ROWS = 3;

/**
 * Helper type for grid coordinates
 */
export type GridCoordinates = {
  row: number;
  col: number;
};

/**
 * Agent configuration for initialization
 */
export interface AgentConfig {
  /** Agent role/specialty */
  role: string;

  /** Display name */
  name: string;

  /** Grid position */
  position: GridCoordinates;

  /** Whether this is the general agent */
  isGeneralAgent?: boolean;
}
