/**
 * Seed MCP Server Definitions
 *
 * Run with: npx tsx prisma/seed-mcp.ts
 *
 * Transport Types:
 * - 'http': Direct HTTP JSON-RPC (works in serverless)
 * - 'sse': Server-Sent Events (works in serverless)
 * - 'stdio': Standard I/O (requires MCP Hub for serverless)
 *
 * For stdio servers, deploy the MCP Hub and update MCP_HUB_URL below.
 * See packages/mcp-hub/README.md for deployment instructions.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Set this to your deployed MCP Hub URL (e.g., https://thebridge-mcp-hub.fly.dev)
// Leave empty to keep stdio servers as-is (for local development only)
const MCP_HUB_URL = process.env.MCP_HUB_URL || '';

const MCP_SERVER_DEFINITIONS = [
  // ============================================
  // OBSERVABILITY MCPs
  // ============================================
  {
    slug: 'coralogix',
    name: 'Coralogix',
    description: 'Log management and observability platform with DataPrime query support',
    icon: 'monitoring',
    category: 'observability',
    transportType: 'http',
    configTemplate: {
      type: 'http',
      url: 'https://api.${CORALOGIX_REGION}.coralogix.com/mgmt/api/v1/mcp',
      headers: {
        Authorization: 'Bearer ${CORALOGIX_API_KEY}',
      },
      env: {
        CORALOGIX_API_KEY: '',
        CORALOGIX_REGION: 'coralogix.us',
      },
    },
    docsUrl: 'https://coralogix.com/docs/user-guides/mcp-server/overview/',
    isOfficial: true,
  },
  {
    slug: 'newrelic',
    name: 'New Relic',
    description: 'APM, infrastructure monitoring, and observability platform',
    icon: 'analytics',
    category: 'observability',
    transportType: 'http',
    configTemplate: {
      type: 'http',
      url: 'https://mcp.newrelic.com/mcp/',
      headers: {
        'Api-Key': '${NEW_RELIC_API_KEY}',
      },
      env: {
        NEW_RELIC_API_KEY: '',
      },
    },
    docsUrl: 'https://docs.newrelic.com/docs/mcp/',
    isOfficial: true,
  },
  {
    slug: 'rootly',
    name: 'Rootly',
    description: 'Incident management and response platform',
    icon: 'emergency',
    category: 'observability',
    transportType: 'sse',
    configTemplate: {
      command: 'npx',
      args: [
        '-y',
        'mcp-remote',
        'https://mcp.rootly.com/sse',
        '--header',
        'Authorization:Bearer ${ROOTLY_API_KEY}',
      ],
      env: {
        ROOTLY_API_KEY: '',
      },
    },
    docsUrl: 'https://rootly.com/docs/mcp',
    isOfficial: true,
  },
  {
    slug: 'prometheus',
    name: 'Prometheus',
    description: 'Metrics monitoring - execute PromQL queries, analyze time series data',
    icon: 'show_chart',
    category: 'observability',
    transportType: 'stdio',
    configTemplate: {
      command: 'uvx',
      args: ['prometheus-mcp-server'],
      env: {
        PROMETHEUS_URL: '',
      },
    },
    docsUrl: 'https://github.com/pab1it0/prometheus-mcp-server',
    isOfficial: false,
  },
  // ============================================
  // INFRASTRUCTURE MCPs
  // ============================================
  {
    slug: 'kubernetes',
    name: 'Kubernetes',
    description: 'Container orchestration - manage pods, deployments, services via kubectl',
    icon: 'cloud',
    category: 'infrastructure',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', 'mcp-server-kubernetes'],
      env: {
        KUBECONFIG: '~/.kube/config',
      },
    },
    docsUrl: 'https://github.com/Flux159/mcp-server-kubernetes',
    isOfficial: false,
  },
  {
    slug: 'shell',
    name: 'Shell / Terminal',
    description: 'Execute shell commands, manage terminal sessions, process control',
    icon: 'terminal',
    category: 'infrastructure',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', 'mcp-shell-server'],
      env: {
        MCP_SHELL_SECURITY_MODE: 'restrictive',
      },
    },
    docsUrl: 'https://github.com/mako10k/mcp-shell-server',
    isOfficial: false,
  },
  // ============================================
  // PRODUCTIVITY MCPs
  // ============================================
  {
    slug: 'jira',
    name: 'Jira',
    description: 'Issue and project tracking by Atlassian',
    icon: 'task_alt',
    category: 'productivity',
    transportType: 'sse',
    configTemplate: {
      type: 'sse',
      url: 'https://mcp.atlassian.com/v1/sse',
    },
    docsUrl: 'https://developer.atlassian.com/cloud/mcp/',
    isOfficial: true,
  },
  {
    slug: 'confluence',
    name: 'Confluence',
    description: 'Team workspace and documentation by Atlassian',
    icon: 'article',
    category: 'productivity',
    transportType: 'sse',
    configTemplate: {
      type: 'sse',
      url: 'https://mcp.atlassian.com/v1/sse',
    },
    docsUrl: 'https://developer.atlassian.com/cloud/mcp/',
    isOfficial: true,
  },
  {
    slug: 'github',
    name: 'GitHub',
    description: 'Code hosting and version control (requires stdio - dev only)',
    icon: 'code',
    category: 'productivity',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: '',
      },
    },
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    isOfficial: true,
  },
  {
    slug: 'slack',
    name: 'Slack',
    description: 'Team communication and messaging (requires stdio - dev only)',
    icon: 'chat',
    category: 'productivity',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', '@anthropic/mcp-server-slack'],
      env: {
        SLACK_BOT_TOKEN: '',
        SLACK_TEAM_ID: '',
      },
    },
    docsUrl: 'https://github.com/anthropics/mcp-server-slack',
    isOfficial: true,
  },
  // ============================================
  // DATA & ANALYTICS MCPs
  // ============================================
  {
    slug: 'metabase',
    name: 'Metabase',
    description: 'Business intelligence and analytics platform - query databases, manage dashboards',
    icon: 'bar_chart',
    category: 'data',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', '@cognitionai/metabase-mcp-server'],
      env: {
        METABASE_URL: '',
        METABASE_API_KEY: '',
      },
    },
    docsUrl: 'https://www.npmjs.com/package/@cognitionai/metabase-mcp-server',
    isOfficial: false,
  },
  // ============================================
  // INFRASTRUCTURE MCPs - Cloudflare
  // ============================================
  {
    slug: 'cloudflare-observability',
    name: 'Cloudflare Observability',
    description: 'Cloudflare observability - metrics, analytics, and monitoring for your zones and workers',
    icon: 'monitoring',
    category: 'infrastructure',
    transportType: 'http',
    configTemplate: {
      type: 'http',
      url: 'https://observability.mcp.cloudflare.com/mcp',
      headers: {
        'Authorization': 'Bearer ${CLOUDFLARE_API_TOKEN}',
      },
      env: {
        CLOUDFLARE_API_TOKEN: '',
      },
    },
    docsUrl: 'https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/',
    isOfficial: true,
  },
  {
    slug: 'cloudflare-dns',
    name: 'Cloudflare DNS Analytics',
    description: 'DNS analytics and insights for your Cloudflare zones',
    icon: 'dns',
    category: 'infrastructure',
    transportType: 'http',
    configTemplate: {
      type: 'http',
      url: 'https://dns-analytics.mcp.cloudflare.com/mcp',
      headers: {
        'Authorization': 'Bearer ${CLOUDFLARE_API_TOKEN}',
      },
      env: {
        CLOUDFLARE_API_TOKEN: '',
      },
    },
    docsUrl: 'https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/',
    isOfficial: true,
  },
  {
    slug: 'cloudflare-workers',
    name: 'Cloudflare Workers',
    description: 'Workers bindings - manage KV, R2, D1, Durable Objects, and other Worker bindings',
    icon: 'cloud_sync',
    category: 'infrastructure',
    transportType: 'http',
    configTemplate: {
      type: 'http',
      url: 'https://bindings.mcp.cloudflare.com/mcp',
      headers: {
        'Authorization': 'Bearer ${CLOUDFLARE_API_TOKEN}',
      },
      env: {
        CLOUDFLARE_API_TOKEN: '',
      },
    },
    docsUrl: 'https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/',
    isOfficial: true,
  },
  {
    slug: 'cloudflare-logs',
    name: 'Cloudflare Logs',
    description: 'Logpush - access and analyze Cloudflare logs',
    icon: 'description',
    category: 'infrastructure',
    transportType: 'http',
    configTemplate: {
      type: 'http',
      url: 'https://logs.mcp.cloudflare.com/mcp',
      headers: {
        'Authorization': 'Bearer ${CLOUDFLARE_API_TOKEN}',
      },
      env: {
        CLOUDFLARE_API_TOKEN: '',
      },
    },
    docsUrl: 'https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/',
    isOfficial: true,
  },
  {
    slug: 'cloudflare-audit',
    name: 'Cloudflare Audit Logs',
    description: 'Audit logs - track account activity and changes',
    icon: 'history',
    category: 'infrastructure',
    transportType: 'http',
    configTemplate: {
      type: 'http',
      url: 'https://auditlogs.mcp.cloudflare.com/mcp',
      headers: {
        'Authorization': 'Bearer ${CLOUDFLARE_API_TOKEN}',
      },
      env: {
        CLOUDFLARE_API_TOKEN: '',
      },
    },
    docsUrl: 'https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/',
    isOfficial: true,
  },
  {
    slug: 'cloudflare-graphql',
    name: 'Cloudflare GraphQL',
    description: 'GraphQL API - flexible queries for zones, analytics, and more',
    icon: 'data_object',
    category: 'infrastructure',
    transportType: 'http',
    configTemplate: {
      type: 'http',
      url: 'https://graphql.mcp.cloudflare.com/mcp',
      headers: {
        'Authorization': 'Bearer ${CLOUDFLARE_API_TOKEN}',
      },
      env: {
        CLOUDFLARE_API_TOKEN: '',
      },
    },
    docsUrl: 'https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/',
    isOfficial: true,
  },
  // ============================================
  // PRODUCTIVITY MCPs - Google & Communication
  // ============================================
  {
    slug: 'gmail',
    name: 'Gmail',
    description: 'Email management - send, read, search, and organize Gmail messages',
    icon: 'mail',
    category: 'productivity',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', '@gongrzhe/server-gmail-autoauth-mcp'],
      env: {
        GMAIL_OAUTH_CLIENT_ID: '',
        GMAIL_OAUTH_CLIENT_SECRET: '',
      },
    },
    docsUrl: 'https://github.com/GongRzhe/Gmail-MCP-Server',
    isOfficial: false,
  },
  {
    slug: 'google-calendar',
    name: 'Google Calendar',
    description: 'Calendar management - create, update, delete events, check availability',
    icon: 'calendar_today',
    category: 'productivity',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', '@nspady/google-calendar-mcp'],
      env: {
        GOOGLE_OAUTH_CLIENT_ID: '',
        GOOGLE_OAUTH_CLIENT_SECRET: '',
      },
    },
    docsUrl: 'https://github.com/nspady/google-calendar-mcp',
    isOfficial: false,
  },
  {
    slug: 'figma',
    name: 'Figma',
    description: 'Design platform - access layouts, components, variables, and design tokens',
    icon: 'palette',
    category: 'productivity',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', '@anthropic-ai/figma-mcp-server'],
      env: {
        FIGMA_PERSONAL_ACCESS_TOKEN: '',
      },
    },
    docsUrl: 'https://developers.figma.com/docs/figma-mcp-server/',
    isOfficial: true,
  },
  {
    slug: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing - create meetings, manage recordings, view participants',
    icon: 'video_call',
    category: 'productivity',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', '@anthropic-ai/zoom-mcp-server'],
      env: {
        ZOOM_ACCOUNT_ID: '',
        ZOOM_CLIENT_ID: '',
        ZOOM_CLIENT_SECRET: '',
      },
    },
    docsUrl: 'https://github.com/echelon-ai-labs/zoom-mcp',
    isOfficial: false,
  },
  // ============================================
  // DATA & ANALYTICS MCPs
  // ============================================
  {
    slug: 'snowflake',
    name: 'Snowflake',
    description: 'Data warehouse - run SQL queries, manage objects, access Cortex AI features',
    icon: 'ac_unit',
    category: 'data',
    transportType: 'stdio',
    configTemplate: {
      command: 'uvx',
      args: ['mcp-snowflake-server'],
      env: {
        SNOWFLAKE_ACCOUNT: '',
        SNOWFLAKE_USER: '',
        SNOWFLAKE_PASSWORD: '',
        SNOWFLAKE_WAREHOUSE: '',
        SNOWFLAKE_DATABASE: '',
        SNOWFLAKE_SCHEMA: '',
      },
    },
    docsUrl: 'https://github.com/isaacwasserman/mcp-snowflake-server',
    isOfficial: false,
  },
  {
    slug: 'airbyte',
    name: 'Airbyte',
    description: 'Data integration - create pipelines, manage connectors, sync data sources',
    icon: 'sync_alt',
    category: 'data',
    transportType: 'stdio',
    configTemplate: {
      command: 'uvx',
      args: ['airbyte-mcp'],
      env: {
        AIRBYTE_API_KEY: '',
        AIRBYTE_CLOUD_MCP_SAFE_MODE: 'true',
      },
    },
    docsUrl: 'https://docs.airbyte.com/ai-agents/pyairbyte-mcp',
    isOfficial: true,
  },
  // ============================================
  // DEVOPS MCPs
  // ============================================
  {
    slug: 'argocd',
    name: 'Argo CD',
    description: 'GitOps continuous delivery - manage applications, sync deployments, view status',
    icon: 'rocket_launch',
    category: 'devops',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', 'argocd-mcp'],
      env: {
        ARGOCD_SERVER: '',
        ARGOCD_AUTH_TOKEN: '',
      },
    },
    docsUrl: 'https://github.com/akuity/argocd-mcp',
    isOfficial: false,
  },
  {
    slug: 'grafana',
    name: 'Grafana',
    description: 'Observability platform - query dashboards, metrics, logs, alerts, and traces',
    icon: 'insert_chart',
    category: 'observability',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', '@grafana/mcp-grafana'],
      env: {
        GRAFANA_URL: '',
        GRAFANA_API_KEY: '',
      },
    },
    docsUrl: 'https://github.com/grafana/mcp-grafana',
    isOfficial: true,
  },
  {
    slug: 'sidekiq',
    name: 'Sidekiq',
    description: 'Ruby background jobs - monitor queues, view stats, manage failed jobs',
    icon: 'queue',
    category: 'devops',
    transportType: 'sse',
    configTemplate: {
      type: 'sse',
      url: '${SIDEKIQ_MCP_URL}',
      headers: {
        'Authorization': 'Bearer ${SIDEKIQ_MCP_TOKEN}',
      },
      env: {
        SIDEKIQ_MCP_URL: '',
        SIDEKIQ_MCP_TOKEN: '',
      },
    },
    docsUrl: 'https://github.com/andrew/sidekiq-mcp',
    isOfficial: false,
  },
  {
    slug: 'chrome-devtools',
    name: 'Chrome DevTools',
    description: 'Browser debugging - inspect pages, record traces, analyze network, take screenshots',
    icon: 'web',
    category: 'devops',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', 'chrome-devtools-mcp@latest'],
      env: {},
    },
    docsUrl: 'https://github.com/ChromeDevTools/chrome-devtools-mcp',
    isOfficial: true,
  },
];

/**
 * Transform stdio server to use MCP Hub if URL is configured
 */
function transformForHub(server: (typeof MCP_SERVER_DEFINITIONS)[0]) {
  // If no hub URL or server isn't stdio, return as-is
  if (!MCP_HUB_URL || server.transportType !== 'stdio') {
    return server;
  }

  // Transform to use HTTP via the hub
  return {
    ...server,
    description: server.description.replace(' (requires stdio - dev only)', ''),
    transportType: 'http' as const,
    configTemplate: {
      type: 'http',
      url: `${MCP_HUB_URL}/rpc/${server.slug}`,
      // SSE alternative: `${MCP_HUB_URL}/sse/${server.slug}`
    },
  };
}

async function main() {
  console.log('Seeding MCP server definitions...');

  if (MCP_HUB_URL) {
    console.log(`Using MCP Hub at: ${MCP_HUB_URL}`);
    console.log('stdio servers will be converted to use the hub.\n');
  } else {
    console.log('No MCP_HUB_URL set - stdio servers will remain as-is.');
    console.log('These will only work in local development.\n');
  }

  let stdioCount = 0;
  let httpCount = 0;
  let sseCount = 0;

  for (const serverDef of MCP_SERVER_DEFINITIONS) {
    const server = transformForHub(serverDef);

    // Count by transport type
    if (server.transportType === 'stdio') stdioCount++;
    else if (server.transportType === 'http') httpCount++;
    else if (server.transportType === 'sse') sseCount++;

    const result = await prisma.mCPServerDefinition.upsert({
      where: { slug: server.slug },
      update: {
        name: server.name,
        description: server.description,
        icon: server.icon,
        category: server.category,
        transportType: server.transportType,
        configTemplate: JSON.stringify(server.configTemplate),
        docsUrl: server.docsUrl,
        isOfficial: server.isOfficial,
      },
      create: {
        slug: server.slug,
        name: server.name,
        description: server.description,
        icon: server.icon,
        category: server.category,
        transportType: server.transportType,
        configTemplate: JSON.stringify(server.configTemplate),
        docsUrl: server.docsUrl,
        isOfficial: server.isOfficial,
      },
    });

    const hubBadge = MCP_HUB_URL && serverDef.transportType === 'stdio' ? ' [via hub]' : '';
    console.log(`  ✓ ${result.name} (${result.slug}) - ${server.transportType}${hubBadge}`);
  }

  console.log('\nSummary:');
  console.log(`  HTTP servers: ${httpCount}`);
  console.log(`  SSE servers: ${sseCount}`);
  console.log(`  stdio servers: ${stdioCount}${stdioCount > 0 && !MCP_HUB_URL ? ' (local dev only!)' : ''}`);
  console.log(`\nDone! Seeded ${MCP_SERVER_DEFINITIONS.length} MCP server definitions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
