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
  commander: {
    id: 'commander',
    name: 'Incident Commander',
    description:
      'Lead incident response, coordinate teams, and manage critical situations',
    icon: 'Campaign', // Material UI icon (megaphone/command)
    color: '#ef4444', // Red
    shortName: 'IC',
  },
  pm: {
    id: 'pm',
    name: 'Product Manager',
    description:
      'Define product roadmap, prioritize features, and align stakeholders',
    icon: 'Assignment', // Material UI icon (clipboard/task)
    color: '#8b5cf6', // Purple
    shortName: 'PM',
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
  commander: {
    homeLabel: 'Command Center',
    homeSublabel: 'Incident response and coordination',
    agentFloorLabel: 'Agent Command',
    agentDeployAction: 'Dispatch Agent',
    systemsLabel: 'Services',
    healthLabel: 'Status',
    knowledgeBaseLabel: 'Incident Playbooks',
    playbookLabel: 'Response Plans',
  },
  pm: {
    homeLabel: 'Product Hub',
    homeSublabel: 'Roadmap and feature planning',
    agentFloorLabel: 'Product Agents',
    agentDeployAction: 'Launch Agent',
    systemsLabel: 'Products',
    healthLabel: 'Feature Status',
    knowledgeBaseLabel: 'Product Docs',
    playbookLabel: 'Playbooks',
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

  commander: {
    role: 'commander',
    showHomeDashboard: false, // Commander goes straight to agent floor
    showAgentFloor: true,
    showBuilderWorkspace: false,
    visibleIntegrations: [
      'rootly',
      'newrelic',
      'uptimekuma',
      'coralogix',
      'slack',
      'confluence',
    ],
    defaultAgents: [
      'rootly-incident-investigator',
      'rootly-timeline-builder',
      'nr-impact-analyzer',
      'log-correlator',
      'team-notifier',
      'status-updater',
      'confluence-postmortem',
    ],
    recommendedAgents: [
      'escalation-coordinator',
      'vendor-liaison',
      'customer-impact-assessor',
      'rollback-advisor',
      'communication-coordinator',
    ],
    knowledgeBaseCategories: [
      'incident-response',
      'communication',
      'escalation',
      'leadership',
      'postmortems',
    ],
    playbookTypes: ['incident-response', 'communication', 'escalation'],
    terminology: ROLE_TERMINOLOGY.commander,
  },

  pm: {
    role: 'pm',
    showHomeDashboard: true,
    showAgentFloor: true,
    showBuilderWorkspace: false,
    visibleIntegrations: ['confluence', 'slack', 'github'],
    defaultAgents: [
      'roadmap-planner',
      'feature-prioritizer',
      'stakeholder-communicator',
      'confluence-writer',
      'slack-notifier',
    ],
    recommendedAgents: [
      'requirements-analyzer',
      'user-feedback-summarizer',
      'release-coordinator',
      'metrics-reporter',
    ],
    knowledgeBaseCategories: [
      'product-strategy',
      'roadmapping',
      'user-research',
      'stakeholder-management',
      'release-planning',
    ],
    playbookTypes: ['planning', 'communication', 'analysis'],
    terminology: ROLE_TERMINOLOGY.pm,
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
