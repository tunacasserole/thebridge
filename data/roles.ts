/**
 * Role Configuration Data
 *
 * Defines the specific configurations for each user role in TheBridge.
 */

import type {
  RoleDefinition,
  RoleConfig,
  UserRole,
  TerminologyMap,
} from '@/types/roles';

/**
 * Role definitions - metadata about each role
 */
export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  sre: {
    id: 'sre',
    name: 'Site Reliability Engineer',
    description:
      'Monitor systems, respond to incidents, and maintain operational excellence',
    icon: 'Speed', // Material UI icon
    color: '#10b981', // Green
    shortName: 'SRE',
  },
  fullstack: {
    id: 'fullstack',
    name: 'Full Stack Developer',
    description:
      'Build end-to-end features, debug issues, and ship quality code',
    icon: 'Code', // Material UI icon
    color: '#3b82f6', // Blue
    shortName: 'FS',
  },
  datascientist: {
    id: 'datascientist',
    name: 'Data Scientist',
    description:
      'Analyze data, build models, and derive insights from complex datasets',
    icon: 'Analytics', // Material UI icon
    color: '#f59e0b', // Amber
    shortName: 'DS',
  },
};

/**
 * Role-specific terminology
 */
export const ROLE_TERMINOLOGY: Record<UserRole, TerminologyMap> = {
  sre: {
    homeLabel: 'Operations Dashboard',
    homeSublabel: 'System health and monitoring',
    agentFloorLabel: 'Agent Floor',
    agentDeployAction: 'Deploy Agent',
    systemsLabel: 'Systems',
    healthLabel: 'Health',
    knowledgeBaseLabel: 'SRE Wisdom',
    playbookLabel: 'Runbooks',
  },
  fullstack: {
    homeLabel: 'Developer Hub',
    homeSublabel: 'Code, build, and ship',
    agentFloorLabel: 'Dev Agents',
    agentDeployAction: 'Spawn Agent',
    systemsLabel: 'Services',
    healthLabel: 'Build Status',
    knowledgeBaseLabel: 'Dev Docs',
    playbookLabel: 'Recipes',
  },
  datascientist: {
    homeLabel: 'Data Lab',
    homeSublabel: 'Analysis and insights',
    agentFloorLabel: 'Data Agents',
    agentDeployAction: 'Run Agent',
    systemsLabel: 'Datasets',
    healthLabel: 'Pipeline Status',
    knowledgeBaseLabel: 'Data Docs',
    playbookLabel: 'Notebooks',
  },
};

/**
 * Role-specific configurations
 */
export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  sre: {
    role: 'sre',
    showHomeDashboard: true,
    showAgentFloor: true,
    showBuilderWorkspace: false,
    visibleIntegrations: [
      'newrelic',
      'rootly',
      'uptimekuma',
      'coralogix',
      'cloudflare',
      'datadome',
      'confluence',
      'slack',
    ],
    defaultAgents: [
      'nr-golden-signals',
      'nr-error-analyzer',
      'rootly-incident-investigator',
      'uptime-checker',
      'log-analyzer',
      'confluence-writer',
      'slack-notifier',
    ],
    recommendedAgents: [
      'nr-trace-analyzer',
      'coralogix-query',
      'cloudflare-firewall',
      'datadome-analyzer',
      'runbook-executor',
    ],
    knowledgeBaseCategories: [
      'monitoring',
      'incident-response',
      'troubleshooting',
      'sli-slo',
      'on-call',
      'postmortems',
    ],
    playbookTypes: ['runbooks', 'troubleshooting', 'escalation'],
    terminology: ROLE_TERMINOLOGY.sre,
  },

  fullstack: {
    role: 'fullstack',
    showHomeDashboard: true,
    showAgentFloor: true,
    showBuilderWorkspace: true,
    visibleIntegrations: ['github', 'slack', 'confluence', 'newrelic'],
    defaultAgents: [
      'code-reviewer',
      'bug-investigator',
      'test-generator',
      'confluence-writer',
      'slack-notifier',
    ],
    recommendedAgents: [
      'refactoring-assistant',
      'api-designer',
      'performance-optimizer',
      'documentation-generator',
    ],
    knowledgeBaseCategories: [
      'architecture',
      'best-practices',
      'debugging',
      'testing',
      'deployment',
    ],
    playbookTypes: ['development', 'debugging', 'deployment'],
    terminology: ROLE_TERMINOLOGY.fullstack,
  },

  datascientist: {
    role: 'datascientist',
    showHomeDashboard: true,
    showAgentFloor: true,
    showBuilderWorkspace: true,
    visibleIntegrations: ['github', 'slack', 'confluence', 'newrelic'],
    defaultAgents: [
      'data-explorer',
      'model-trainer',
      'insight-generator',
      'confluence-writer',
      'slack-notifier',
    ],
    recommendedAgents: [
      'feature-engineer',
      'visualization-builder',
      'experiment-tracker',
      'pipeline-optimizer',
    ],
    knowledgeBaseCategories: [
      'data-analysis',
      'machine-learning',
      'statistics',
      'visualization',
      'pipelines',
    ],
    playbookTypes: ['analysis', 'modeling', 'experimentation'],
    terminology: ROLE_TERMINOLOGY.datascientist,
  },
};

/**
 * Get role configuration
 */
export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_CONFIGS[role];
}

/**
 * Get role definition
 */
export function getRoleDefinition(role: UserRole): RoleDefinition {
  return ROLE_DEFINITIONS[role];
}

/**
 * Get role terminology
 */
export function getRoleTerminology(role: UserRole): TerminologyMap {
  return ROLE_TERMINOLOGY[role];
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return Object.keys(ROLE_DEFINITIONS) as UserRole[];
}

/**
 * Default role for new users
 */
export const DEFAULT_ROLE: UserRole = 'sre';
