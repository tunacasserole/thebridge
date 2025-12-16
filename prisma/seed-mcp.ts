/**
 * Seed MCP Server Definitions
 *
 * Run with: npx tsx prisma/seed-mcp.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MCP_SERVER_DEFINITIONS = [
  {
    slug: 'coralogix',
    name: 'Coralogix',
    description: 'Log management and observability platform with DataPrime query support',
    icon: 'monitoring',
    transportType: 'sse',
    configTemplate: {
      command: 'npx',
      args: [
        '-y',
        'mcp-remote',
        'https://api.${CORALOGIX_REGION}.coralogix.com/mgmt/api/v1/mcp',
        '--header',
        'Authorization:Bearer ${CORALOGIX_API_KEY}',
      ],
      env: {
        CORALOGIX_API_KEY: '',
        CORALOGIX_REGION: 'us1',
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
    slug: 'jira',
    name: 'Jira',
    description: 'Issue and project tracking by Atlassian',
    icon: 'task_alt',
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
  // Additional MCP servers
  {
    slug: 'metabase',
    name: 'Metabase',
    description: 'Business intelligence and analytics platform - query databases, manage dashboards',
    icon: 'bar_chart',
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
  {
    slug: 'kubernetes',
    name: 'Kubernetes',
    description: 'Container orchestration - manage pods, deployments, services via kubectl',
    icon: 'cloud',
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
    slug: 'prometheus',
    name: 'Prometheus',
    description: 'Metrics monitoring - execute PromQL queries, analyze time series data',
    icon: 'show_chart',
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
  {
    slug: 'cloudflare',
    name: 'Cloudflare',
    description: 'CDN, DNS, Workers, R2, D1, KV - manage Cloudflare services',
    icon: 'public',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', '@cloudflare/mcp-server-cloudflare'],
      env: {
        CLOUDFLARE_API_TOKEN: '',
        CLOUDFLARE_ACCOUNT_ID: '',
      },
    },
    docsUrl: 'https://github.com/cloudflare/mcp-server-cloudflare',
    isOfficial: true,
  },
  // Google Services
  {
    slug: 'gmail',
    name: 'Gmail',
    description: 'Email management - send, read, search, and organize Gmail messages',
    icon: 'mail',
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
  // Data & Analytics
  {
    slug: 'snowflake',
    name: 'Snowflake',
    description: 'Data warehouse - run SQL queries, manage objects, access Cortex AI features',
    icon: 'ac_unit',
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
  // DevOps & CI/CD
  {
    slug: 'argocd',
    name: 'Argo CD',
    description: 'GitOps continuous delivery - manage applications, sync deployments, view status',
    icon: 'rocket_launch',
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
  // Design & Collaboration
  {
    slug: 'figma',
    name: 'Figma',
    description: 'Design platform - access layouts, components, variables, and design tokens',
    icon: 'palette',
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
  // Browser & Terminal
  {
    slug: 'chrome-devtools',
    name: 'Chrome DevTools',
    description: 'Browser debugging - inspect pages, record traces, analyze network, take screenshots',
    icon: 'web',
    transportType: 'stdio',
    configTemplate: {
      command: 'npx',
      args: ['-y', 'chrome-devtools-mcp@latest'],
      env: {},
    },
    docsUrl: 'https://github.com/ChromeDevTools/chrome-devtools-mcp',
    isOfficial: true,
  },
  {
    slug: 'shell',
    name: 'Shell / Terminal',
    description: 'Execute shell commands, manage terminal sessions, process control',
    icon: 'terminal',
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
];

async function main() {
  console.log('Seeding MCP server definitions...');

  for (const server of MCP_SERVER_DEFINITIONS) {
    const result = await prisma.mCPServerDefinition.upsert({
      where: { slug: server.slug },
      update: {
        name: server.name,
        description: server.description,
        icon: server.icon,
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
        transportType: server.transportType,
        configTemplate: JSON.stringify(server.configTemplate),
        docsUrl: server.docsUrl,
        isOfficial: server.isOfficial,
      },
    });

    console.log(`  ✓ ${result.name} (${result.slug})`);
  }

  console.log('\nDone! Seeded', MCP_SERVER_DEFINITIONS.length, 'MCP server definitions.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
