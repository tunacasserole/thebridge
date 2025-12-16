/**
 * Tools Sidebar Types
 */

import type { UserRole } from '@/types/roles';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  roles?: UserRole[]; // Which roles can see this agent (undefined = all roles)
}

export interface OpenAgent {
  id: string;
  isMinimized: boolean;
}

export type SidebarMode = 'hidden' | 'mini' | 'full';

export interface ToolsSidebarProps {
  enabledTools: Set<string>;
  onToggleTool: (toolId: string) => void;
  isAgentActive?: boolean;
  activeAgents?: Set<string>;
  openAgents?: OpenAgent[];
  onAgentClick?: (agentId: string) => void;
  onPromptClick?: (prompt: string) => void;
  onAddAgent?: () => void; // Opens the create agent panel
  mode?: SidebarMode;
  onToggleMode?: () => void;
  agentRefreshKey?: number; // Increment to trigger agent list refresh
}
