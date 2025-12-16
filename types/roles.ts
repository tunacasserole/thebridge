/**
 * Role System Types
 *
 * Defines the role-based system for TheBridge, supporting different user personas
 * with tailored content, agents, and workflows.
 */

/**
 * Available user roles in TheBridge
 */
export type UserRole = 'sre' | 'commander' | 'pm';

/**
 * Role metadata and configuration
 */
export interface RoleDefinition {
  id: UserRole;
  name: string;
  description: string;
  icon: string; // Material UI icon name
  color: string; // Theme color for role badge
  shortName: string; // For compact displays
}

/**
 * Role-specific configuration for UI elements
 */
export interface RoleConfig {
  role: UserRole;

  // Navigation & Layout
  showHomeDashboard: boolean; // Traditional SRE dashboard
  showAgentFloor: boolean; // Agent command center
  showBuilderWorkspace: boolean; // Development workspace

  // Integration visibility (which third-party systems to show)
  visibleIntegrations: IntegrationId[];

  // Agent preferences
  defaultAgents: string[]; // Agent IDs that should appear by default
  recommendedAgents: string[]; // Suggested agents for this role

  // Content preferences
  knowledgeBaseCategories: string[]; // Which KB categories to show
  playbookTypes: string[]; // Which playbook types are relevant

  // Terminology overrides (optional - for role-specific language)
  terminology?: Partial<TerminologyMap>;
}

/**
 * Supported third-party integrations
 */
export type IntegrationId =
  | 'newrelic'
  | 'rootly'
  | 'uptimekuma'
  | 'coralogix'
  | 'cloudflare'
  | 'datadome'
  | 'confluence'
  | 'slack'
  | 'github'
  | 'claude';

/**
 * Terminology that changes based on role
 */
export interface TerminologyMap {
  // Home view naming
  homeLabel: string; // "Operations", "Command Center", "Workspace"
  homeSublabel: string;

  // Agent terminology
  agentFloorLabel: string; // "Agent Floor", "Agent Command", "Code Assistants"
  agentDeployAction: string; // "Deploy Agent", "Dispatch", "Spawn"

  // System references
  systemsLabel: string; // "Systems", "Services", "Projects"
  healthLabel: string; // "Health", "Status", "Build Status"

  // Documentation
  knowledgeBaseLabel: string; // "SRE Wisdom", "Incident Playbooks", "Dev Guides"
  playbookLabel: string; // "Runbooks", "Response Plans", "Recipes"
}

/**
 * User preferences stored in localStorage
 */
export interface UserRolePreferences {
  // Current role
  currentRole: UserRole;

  // Role-specific agent favorites and recents
  favoriteAgents: Record<UserRole, string[]>;
  recentAgents: Record<UserRole, string[]>;

  // Role-specific view preferences
  roleViewPreferences: Record<UserRole, RoleViewPreferences>;

  // Role-specific theme preferences
  roleThemes: Record<UserRole, string>; // Maps role to theme ID

  // Last updated timestamp
  lastUpdated: string;
}

/**
 * View preferences per role
 */
export interface RoleViewPreferences {
  // Dashboard layout
  dashboardLayout?: 'compact' | 'detailed' | 'grid';

  // Agent floor preferences
  agentFloorLayout?: 'cards' | 'list' | 'grid';
  agentFloorSortBy?: 'recent' | 'favorites' | 'category' | 'alphabetical';

  // Panel visibility (which panels are expanded/collapsed)
  expandedPanels?: string[];

  // Custom orderings
  panelOrder?: string[];
  integrationOrder?: IntegrationId[];
}

/**
 * Agent definition with role-specific metadata
 */
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  icon: string;
  color: string;

  // Role targeting
  roles: UserRole[]; // Which roles should see this agent
  isPrimary?: boolean; // Should this appear in default set for these roles

  // Integration requirements
  requiredIntegrations?: IntegrationId[];

  // Capabilities
  capabilities: AgentCapability[];

  // Usage metadata
  estimatedDuration?: string; // "2-5 minutes"
  complexity?: 'simple' | 'moderate' | 'complex';

  // Documentation
  documentationUrl?: string;
  exampleUseCases?: string[];
}

export type AgentCategory =
  | 'monitoring' // SRE: System monitoring and alerting
  | 'incident' // Commander: Incident investigation
  | 'deployment' // SRE/Builder: Deployment and infrastructure
  | 'development' // Builder: Code and development
  | 'productivity' // All: Slack, Confluence, etc.
  | 'analysis' // All: Data analysis and reporting
  | 'automation'; // All: Workflow automation

export type AgentCapability =
  | 'read-metrics'
  | 'write-code'
  | 'execute-commands'
  | 'create-incidents'
  | 'update-documentation'
  | 'send-notifications'
  | 'analyze-logs'
  | 'generate-reports';

/**
 * Role context passed to components
 */
export interface RoleContext {
  currentRole: UserRole;
  roleConfig: RoleConfig;
  roleDefinition: RoleDefinition;
  switchRole: (newRole: UserRole) => void;
  preferences: UserRolePreferences;
  updatePreferences: (updates: Partial<UserRolePreferences>) => void;
  /** True after client-side hydration (safe to use localStorage values) */
  isHydrated: boolean;
}
