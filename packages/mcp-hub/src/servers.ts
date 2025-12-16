/**
 * MCP Server Definitions
 *
 * All stdio-based MCP servers that the hub can spawn
 */

import type { MCPServerConfig } from './types.js';

export const MCP_SERVERS: MCPServerConfig[] = [
  {
    slug: 'github',
    name: 'GitHub',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
    },
  },
  {
    slug: 'slack',
    name: 'Slack',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-slack'],
    env: {
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
      SLACK_TEAM_ID: process.env.SLACK_TEAM_ID || '',
    },
  },
  {
    slug: 'metabase',
    name: 'Metabase',
    command: 'npx',
    args: ['-y', '@cognitionai/metabase-mcp-server'],
    env: {
      METABASE_URL: process.env.METABASE_URL || '',
      METABASE_API_KEY: process.env.METABASE_API_KEY || '',
    },
  },
  {
    slug: 'kubernetes',
    name: 'Kubernetes',
    command: 'npx',
    args: ['-y', 'mcp-server-kubernetes'],
    env: {
      KUBECONFIG: process.env.KUBECONFIG || '~/.kube/config',
    },
  },
  {
    slug: 'prometheus',
    name: 'Prometheus',
    command: 'uvx',
    args: ['prometheus-mcp-server'],
    env: {
      PROMETHEUS_URL: process.env.PROMETHEUS_URL || '',
    },
  },
  {
    slug: 'gmail',
    name: 'Gmail',
    command: 'npx',
    args: ['-y', '@gongrzhe/server-gmail-autoauth-mcp'],
    env: {
      GMAIL_OAUTH_CLIENT_ID: process.env.GMAIL_OAUTH_CLIENT_ID || '',
      GMAIL_OAUTH_CLIENT_SECRET: process.env.GMAIL_OAUTH_CLIENT_SECRET || '',
    },
  },
  {
    slug: 'google-calendar',
    name: 'Google Calendar',
    command: 'npx',
    args: ['-y', '@nspady/google-calendar-mcp'],
    env: {
      GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    },
  },
  {
    slug: 'snowflake',
    name: 'Snowflake',
    command: 'uvx',
    args: ['mcp-snowflake-server'],
    env: {
      SNOWFLAKE_ACCOUNT: process.env.SNOWFLAKE_ACCOUNT || '',
      SNOWFLAKE_USER: process.env.SNOWFLAKE_USER || '',
      SNOWFLAKE_PASSWORD: process.env.SNOWFLAKE_PASSWORD || '',
      SNOWFLAKE_WAREHOUSE: process.env.SNOWFLAKE_WAREHOUSE || '',
      SNOWFLAKE_DATABASE: process.env.SNOWFLAKE_DATABASE || '',
      SNOWFLAKE_SCHEMA: process.env.SNOWFLAKE_SCHEMA || '',
    },
  },
  {
    slug: 'airbyte',
    name: 'Airbyte',
    command: 'uvx',
    args: ['airbyte-mcp'],
    env: {
      AIRBYTE_API_KEY: process.env.AIRBYTE_API_KEY || '',
      AIRBYTE_CLOUD_MCP_SAFE_MODE: 'true',
    },
  },
  {
    slug: 'argocd',
    name: 'Argo CD',
    command: 'npx',
    args: ['-y', 'argocd-mcp'],
    env: {
      ARGOCD_SERVER: process.env.ARGOCD_SERVER || '',
      ARGOCD_AUTH_TOKEN: process.env.ARGOCD_AUTH_TOKEN || '',
    },
  },
  {
    slug: 'grafana',
    name: 'Grafana',
    command: 'npx',
    args: ['-y', '@grafana/mcp-grafana'],
    env: {
      GRAFANA_URL: process.env.GRAFANA_URL || '',
      GRAFANA_API_KEY: process.env.GRAFANA_API_KEY || '',
    },
  },
  {
    slug: 'figma',
    name: 'Figma',
    command: 'npx',
    args: ['-y', '@anthropic-ai/figma-mcp-server'],
    env: {
      FIGMA_PERSONAL_ACCESS_TOKEN: process.env.FIGMA_PERSONAL_ACCESS_TOKEN || '',
    },
  },
  {
    slug: 'zoom',
    name: 'Zoom',
    command: 'npx',
    args: ['-y', '@anthropic-ai/zoom-mcp-server'],
    env: {
      ZOOM_ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID || '',
      ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID || '',
      ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET || '',
    },
  },
  {
    slug: 'chrome-devtools',
    name: 'Chrome DevTools',
    command: 'npx',
    args: ['-y', 'chrome-devtools-mcp@latest'],
    env: {},
  },
  {
    slug: 'shell',
    name: 'Shell / Terminal',
    command: 'npx',
    args: ['-y', 'mcp-shell-server'],
    env: {
      MCP_SHELL_SECURITY_MODE: process.env.MCP_SHELL_SECURITY_MODE || 'restrictive',
    },
  },
];

export function getServerConfig(slug: string): MCPServerConfig | undefined {
  return MCP_SERVERS.find((s) => s.slug === slug);
}

export function getAllServerSlugs(): string[] {
  return MCP_SERVERS.map((s) => s.slug);
}
