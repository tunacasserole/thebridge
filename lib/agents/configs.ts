// Agent configurations for specialized AI agents
// Each agent has its own system prompt, tools, and MCP servers

import {
  GENERAL_PROMPT,
  INCIDENT_PROMPT,
  QUOTA_PROMPT,
} from '@/lib/prompts/agents';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: 'sonnet' | 'opus' | 'haiku';
  tools: string[];
  mcpServers: string[]; // IDs of MCP servers to enable
  accentColor: string; // Unique color for the agent panel
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'general': {
    id: 'general',
    name: 'General Assistant',
    description: 'Multi-purpose AI assistant for general tasks',
    accentColor: '#6366f1', // Indigo
    model: 'sonnet',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch', 'Memory', 'Task'],
    mcpServers: [], // Uses whatever MCPs are enabled in main chat
    systemPrompt: GENERAL_PROMPT,
  },

  'incident': {
    id: 'incident',
    name: 'Incident Investigator',
    description: 'Root cause analysis and incident investigation',
    accentColor: '#f59e0b', // Amber
    model: 'sonnet',
    tools: ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch'],
    mcpServers: ['coralogix', 'newrelic', 'rootly', 'kubernetes'],
    systemPrompt: INCIDENT_PROMPT,
  },

  'quota': {
    id: 'quota',
    name: 'Quota Manager',
    description: 'Observability cost optimization and quota monitoring',
    accentColor: '#10b981', // Emerald
    model: 'sonnet',
    tools: ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch'],
    mcpServers: ['coralogix', 'newrelic', 'prometheus'],
    systemPrompt: QUOTA_PROMPT,
  },
};

// Get agent config by ID with fallback to general
export function getAgentConfig(agentId: string): AgentConfig | null {
  return AGENT_CONFIGS[agentId] || null;
}

// Get all available agent IDs
export function getAgentIds(): string[] {
  return Object.keys(AGENT_CONFIGS);
}

// Type for agent IDs
export type AgentId = keyof typeof AGENT_CONFIGS;
