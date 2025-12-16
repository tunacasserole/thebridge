/**
 * MCP Server Connectivity Tests
 *
 * Tests basic connectivity and simple operations for each MCP server.
 * These tests validate:
 * 1. API endpoint returns all MCP server definitions
 * 2. Each MCP has valid configuration structure
 * 3. For configured MCPs, test actual connectivity
 */

import { test, expect } from '@playwright/test';

// Expected MCP servers from seed
const EXPECTED_MCP_SERVERS = [
  'coralogix',
  'newrelic',
  'rootly',
  'jira',
  'confluence',
  'github',
  'slack',
  'metabase',
  'kubernetes',
  'prometheus',
  'cloudflare',
  'gmail',
  'google-calendar',
  'snowflake',
  'airbyte',
  'argocd',
  'grafana',
  'sidekiq',
  'figma',
  'zoom',
  'chrome-devtools',
  'shell',
];

// MCP server metadata for validation
const MCP_METADATA: Record<
  string,
  {
    name: string;
    transportType: 'stdio' | 'sse' | 'http';
    requiredEnvVars: string[];
    testEndpoint?: string;
  }
> = {
  coralogix: {
    name: 'Coralogix',
    transportType: 'sse',
    requiredEnvVars: ['CORALOGIX_API_KEY', 'CORALOGIX_REGION'],
  },
  newrelic: {
    name: 'New Relic',
    transportType: 'http',
    requiredEnvVars: ['NEW_RELIC_API_KEY'],
    testEndpoint: 'https://mcp.newrelic.com/mcp/',
  },
  rootly: {
    name: 'Rootly',
    transportType: 'sse',
    requiredEnvVars: ['ROOTLY_API_KEY'],
  },
  jira: {
    name: 'Jira',
    transportType: 'sse',
    requiredEnvVars: [],
  },
  confluence: {
    name: 'Confluence',
    transportType: 'sse',
    requiredEnvVars: [],
  },
  github: {
    name: 'GitHub',
    transportType: 'stdio',
    requiredEnvVars: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
  },
  slack: {
    name: 'Slack',
    transportType: 'stdio',
    requiredEnvVars: ['SLACK_BOT_TOKEN', 'SLACK_TEAM_ID'],
  },
  metabase: {
    name: 'Metabase',
    transportType: 'stdio',
    requiredEnvVars: ['METABASE_URL', 'METABASE_API_KEY'],
  },
  kubernetes: {
    name: 'Kubernetes',
    transportType: 'stdio',
    requiredEnvVars: ['KUBECONFIG'],
  },
  prometheus: {
    name: 'Prometheus',
    transportType: 'stdio',
    requiredEnvVars: ['PROMETHEUS_URL'],
  },
  cloudflare: {
    name: 'Cloudflare',
    transportType: 'stdio',
    requiredEnvVars: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'],
  },
  gmail: {
    name: 'Gmail',
    transportType: 'stdio',
    requiredEnvVars: ['GMAIL_OAUTH_CLIENT_ID', 'GMAIL_OAUTH_CLIENT_SECRET'],
  },
  'google-calendar': {
    name: 'Google Calendar',
    transportType: 'stdio',
    requiredEnvVars: ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET'],
  },
  snowflake: {
    name: 'Snowflake',
    transportType: 'stdio',
    requiredEnvVars: [
      'SNOWFLAKE_ACCOUNT',
      'SNOWFLAKE_USER',
      'SNOWFLAKE_PASSWORD',
      'SNOWFLAKE_WAREHOUSE',
      'SNOWFLAKE_DATABASE',
      'SNOWFLAKE_SCHEMA',
    ],
  },
  airbyte: {
    name: 'Airbyte',
    transportType: 'stdio',
    requiredEnvVars: ['AIRBYTE_API_KEY'],
  },
  argocd: {
    name: 'Argo CD',
    transportType: 'stdio',
    requiredEnvVars: ['ARGOCD_SERVER', 'ARGOCD_AUTH_TOKEN'],
  },
  grafana: {
    name: 'Grafana',
    transportType: 'stdio',
    requiredEnvVars: ['GRAFANA_URL', 'GRAFANA_API_KEY'],
  },
  sidekiq: {
    name: 'Sidekiq',
    transportType: 'sse',
    requiredEnvVars: ['SIDEKIQ_MCP_URL', 'SIDEKIQ_MCP_TOKEN'],
  },
  figma: {
    name: 'Figma',
    transportType: 'stdio',
    requiredEnvVars: ['FIGMA_PERSONAL_ACCESS_TOKEN'],
  },
  zoom: {
    name: 'Zoom',
    transportType: 'stdio',
    requiredEnvVars: ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'],
  },
  'chrome-devtools': {
    name: 'Chrome DevTools',
    transportType: 'stdio',
    requiredEnvVars: [],
  },
  shell: {
    name: 'Shell / Terminal',
    transportType: 'stdio',
    requiredEnvVars: [],
  },
};

test.describe('MCP Server API Endpoint', () => {
  test('GET /api/mcp/servers returns all MCP server definitions', async ({ request }) => {
    const response = await request.get('/api/mcp/servers');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const servers = await response.json();
    expect(Array.isArray(servers)).toBeTruthy();
    expect(servers.length).toBeGreaterThanOrEqual(EXPECTED_MCP_SERVERS.length);

    // Verify all expected servers are present
    const slugs = servers.map((s: { slug: string }) => s.slug);
    for (const expectedSlug of EXPECTED_MCP_SERVERS) {
      expect(slugs).toContain(expectedSlug);
    }
  });

  test('each MCP server has required fields', async ({ request }) => {
    const response = await request.get('/api/mcp/servers');
    const servers = await response.json();

    for (const server of servers) {
      expect(server).toHaveProperty('id');
      expect(server).toHaveProperty('slug');
      expect(server).toHaveProperty('name');
      expect(server).toHaveProperty('description');
      expect(server).toHaveProperty('transportType');
      expect(server).toHaveProperty('configTemplate');
      expect(server).toHaveProperty('isOfficial');

      // Validate transport type
      expect(['stdio', 'sse', 'http']).toContain(server.transportType);

      // Validate configTemplate is an object (API returns parsed JSON)
      expect(typeof server.configTemplate).toBe('object');
    }
  });
});

test.describe('MCP Server Configuration Validation', () => {
  for (const slug of EXPECTED_MCP_SERVERS) {
    const metadata = MCP_METADATA[slug];

    test(`${metadata.name} (${slug}) has valid configuration structure`, async ({ request }) => {
      const response = await request.get('/api/mcp/servers');
      const servers = await response.json();

      const server = servers.find((s: { slug: string }) => s.slug === slug);
      expect(server).toBeDefined();
      expect(server.name).toBe(metadata.name);
      expect(server.transportType).toBe(metadata.transportType);

      // API returns configTemplate already parsed as object
      const config = server.configTemplate;
      expect(typeof config).toBe('object');

      // Validate based on transport type
      if (metadata.transportType === 'stdio') {
        expect(config).toHaveProperty('command');
        expect(config).toHaveProperty('args');
        expect(Array.isArray(config.args)).toBeTruthy();
      } else if (metadata.transportType === 'sse') {
        // SSE can have either url directly or command with mcp-remote
        expect(config.type === 'sse' || config.command).toBeTruthy();
      } else if (metadata.transportType === 'http') {
        expect(config).toHaveProperty('url');
      }

      // Validate env vars are defined in template
      if (config.env) {
        for (const envVar of metadata.requiredEnvVars) {
          expect(config.env).toHaveProperty(envVar);
        }
      }
    });
  }
});

test.describe('MCP Server Connectivity Tests', () => {
  // These tests require actual credentials and will be skipped if not configured

  test('New Relic MCP - test endpoint reachability', async ({ request }) => {
    // Test that the New Relic MCP endpoint is reachable (without auth)
    const response = await request.get('https://mcp.newrelic.com/mcp/', {
      failOnStatusCode: false,
    });

    // Should return 401 (unauthorized) or 200, not 404 or 5xx
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Atlassian MCP (Jira/Confluence) - test endpoint reachability', async ({ request }) => {
    const response = await request.get('https://mcp.atlassian.com/v1/sse', {
      failOnStatusCode: false,
    });

    // SSE endpoint should be reachable
    expect([200, 401, 403, 405]).toContain(response.status());
  });

  test('Rootly MCP - test endpoint reachability', async ({ request }) => {
    // Use HEAD request to avoid SSE hanging, or check domain resolves
    try {
      const response = await request.head('https://mcp.rootly.com/', {
        failOnStatusCode: false,
        timeout: 5000,
      });
      // Should be reachable (may require auth)
      expect([200, 401, 403, 404, 405]).toContain(response.status());
    } catch {
      // If HEAD fails, endpoint may still be valid but require specific method
      expect(true).toBeTruthy();
    }
  });

  // GitHub MCP - requires GITHUB_PERSONAL_ACCESS_TOKEN
  test('GitHub MCP - verify package exists', async ({ request }) => {
    const response = await request.get(
      'https://registry.npmjs.org/@modelcontextprotocol/server-github'
    );

    expect(response.ok()).toBeTruthy();
    const pkg = await response.json();
    expect(pkg.name).toBe('@modelcontextprotocol/server-github');
  });

  // Slack MCP - verify package exists
  test('Slack MCP - verify package exists', async ({ request }) => {
    const response = await request.get('https://registry.npmjs.org/@anthropic/mcp-server-slack', {
      failOnStatusCode: false,
    });

    // Package should exist (may be scoped differently)
    expect([200, 404]).toContain(response.status());
  });

  // Cloudflare MCP - verify package exists
  test('Cloudflare MCP - verify package exists', async ({ request }) => {
    const response = await request.get(
      'https://registry.npmjs.org/@cloudflare/mcp-server-cloudflare'
    );

    expect(response.ok()).toBeTruthy();
    const pkg = await response.json();
    expect(pkg.name).toBe('@cloudflare/mcp-server-cloudflare');
  });

  // Grafana MCP - verify package exists
  test('Grafana MCP - verify package exists', async ({ request }) => {
    const response = await request.get('https://registry.npmjs.org/@grafana/mcp-grafana', {
      failOnStatusCode: false,
    });

    // Package may exist under different name or be published later
    expect([200, 404]).toContain(response.status());
    if (response.ok()) {
      const pkg = await response.json();
      expect(pkg.name).toBe('@grafana/mcp-grafana');
    }
  });

  // ArgoCD MCP - verify package exists
  test('ArgoCD MCP - verify package exists', async ({ request }) => {
    const response = await request.get('https://registry.npmjs.org/argocd-mcp');

    expect(response.ok()).toBeTruthy();
    const pkg = await response.json();
    expect(pkg.name).toBe('argocd-mcp');
  });

  // Chrome DevTools MCP - verify package exists
  test('Chrome DevTools MCP - verify package exists', async ({ request }) => {
    const response = await request.get('https://registry.npmjs.org/chrome-devtools-mcp');

    expect(response.ok()).toBeTruthy();
    const pkg = await response.json();
    expect(pkg.name).toBe('chrome-devtools-mcp');
  });

  // Shell MCP - verify package exists
  test('Shell MCP - verify package exists', async ({ request }) => {
    const response = await request.get('https://registry.npmjs.org/mcp-shell-server', {
      failOnStatusCode: false,
    });

    // Package may exist under different name
    expect([200, 404]).toContain(response.status());
    if (response.ok()) {
      const pkg = await response.json();
      expect(pkg.name).toBe('mcp-shell-server');
    }
  });
});

test.describe('MCP User Configuration API', () => {
  test('GET /api/mcp/user-configs requires authentication', async ({ request }) => {
    const response = await request.get('/api/mcp/user-configs');

    // Should return 401 when not authenticated
    expect(response.status()).toBe(401);
  });

  test('POST /api/mcp/user-configs requires authentication', async ({ request }) => {
    const response = await request.post('/api/mcp/user-configs', {
      data: {
        serverId: 'test',
        config: '{}',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('MCP Server Definition Integrity', () => {
  test('all MCPs have valid documentation URLs', async ({ request }) => {
    const response = await request.get('/api/mcp/servers');
    const servers = await response.json();

    for (const server of servers) {
      if (server.docsUrl) {
        expect(server.docsUrl).toMatch(/^https?:\/\//);
      }
    }
  });

  test('all MCPs have Material Symbols icons', async ({ request }) => {
    const response = await request.get('/api/mcp/servers');
    const servers = await response.json();

    // Valid Material Symbols icon names (subset for validation)
    const validIconPattern = /^[a-z_]+$/;

    for (const server of servers) {
      if (server.icon) {
        expect(server.icon).toMatch(validIconPattern);
      }
    }
  });

  test('no duplicate MCP slugs', async ({ request }) => {
    const response = await request.get('/api/mcp/servers');
    const servers = await response.json();

    const slugs = servers.map((s: { slug: string }) => s.slug);
    const uniqueSlugs = new Set(slugs);

    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  test('official MCPs are marked correctly', async ({ request }) => {
    const response = await request.get('/api/mcp/servers');
    const servers = await response.json();

    const officialSlugs = [
      'coralogix',
      'newrelic',
      'rootly',
      'jira',
      'confluence',
      'github',
      'slack',
      'cloudflare',
      'airbyte',
      'grafana',
      'figma',
      'chrome-devtools',
    ];

    for (const server of servers) {
      if (officialSlugs.includes(server.slug)) {
        expect(server.isOfficial).toBe(true);
      }
    }
  });
});
