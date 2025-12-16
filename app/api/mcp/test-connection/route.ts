/**
 * MCP Server Connection Test API
 *
 * POST /api/mcp/test-connection - Test connection to an MCP server
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

interface MCPServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  type?: 'stdio' | 'sse' | 'http';
  url?: string;
  headers?: Record<string, string>;
}

/**
 * Resolve environment variables in a string
 */
function resolveEnvVars(value: string, env: Record<string, string>): string {
  return value.replace(/\$\{(\w+)\}/g, (_, key) => env[key] || process.env[key] || '');
}

/**
 * Extract SSE URL from config
 */
function extractSSEUrl(config: MCPServerConfig): string | null {
  // Check if it's using mcp-remote (SSE transport)
  if (config.args?.includes('mcp-remote')) {
    const urlIndex = config.args.findIndex(arg => arg.startsWith('http'));
    if (urlIndex !== -1) {
      return resolveEnvVars(config.args[urlIndex], config.env || {});
    }
  }

  // Direct URL config
  if (config.url) {
    return resolveEnvVars(config.url, config.env || {});
  }

  return null;
}

/**
 * Extract headers from config
 */
function extractHeaders(config: MCPServerConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  // Check for direct headers property
  if (config.headers) {
    for (const [key, value] of Object.entries(config.headers)) {
      headers[key] = resolveEnvVars(value, config.env || {});
    }
  }

  // Check for headers in mcp-remote args
  if (config.args) {
    for (let i = 0; i < config.args.length; i++) {
      if (config.args[i] === '--header' && config.args[i + 1]) {
        const [key, ...valueParts] = config.args[i + 1].split(':');
        const value = valueParts.join(':');
        headers[key] = resolveEnvVars(value, config.env || {});
      }
    }
  }

  return headers;
}

/**
 * Determine transport type from config
 */
function getTransportType(config: MCPServerConfig): 'sse' | 'http' | 'stdio' | 'unsupported' {
  // Explicit type takes precedence
  if (config.type === 'http') return 'http';
  if (config.type === 'sse') return 'sse';
  if (config.type === 'stdio') return 'stdio';

  // Infer from config structure
  if (config.url) {
    // Direct URL means SSE or HTTP
    return config.headers ? 'http' : 'sse';
  }

  if (config.command && config.args) {
    // Check if using mcp-remote (SSE proxy)
    if (config.args.some(arg => arg.includes('mcp-remote'))) {
      return 'sse';
    }
    // Other commands are stdio (not supported in serverless)
    return 'stdio';
  }

  return 'unsupported';
}

/**
 * Merge user config with server template
 */
function mergeConfigs(
  template: MCPServerConfig,
  userConfig: Record<string, unknown>
): MCPServerConfig {
  const merged: MCPServerConfig = { ...template };

  // Merge env vars
  if (userConfig.env && typeof userConfig.env === 'object') {
    merged.env = { ...merged.env, ...(userConfig.env as Record<string, string>) };
  }

  // Override URL if provided
  if (userConfig.url && typeof userConfig.url === 'string') {
    merged.url = userConfig.url;
  }

  // Merge headers
  if (userConfig.headers && typeof userConfig.headers === 'object') {
    merged.headers = { ...merged.headers, ...(userConfig.headers as Record<string, string>) };
  }

  return merged;
}

/**
 * Test connection to MCP server
 */
async function testMCPConnection(
  serverName: string,
  config: MCPServerConfig
): Promise<{ success: boolean; error?: string; toolCount?: number }> {
  const transportType = getTransportType(config);
  const url = extractSSEUrl(config);

  if (transportType === 'stdio') {
    return {
      success: false,
      error: 'stdio transport not supported in serverless environment',
    };
  }

  if (transportType === 'unsupported' || !url) {
    return {
      success: false,
      error: 'No compatible transport configuration found',
    };
  }

  let client: Client | null = null;

  try {
    const headers = extractHeaders(config);

    client = new Client({
      name: `thebridge-test-${serverName}`,
      version: '1.0.0',
    });

    // Set a timeout for the connection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000);
    });

    const connectPromise = (async () => {
      if (transportType === 'http') {
        const transport = new StreamableHTTPClientTransport(new URL(url), {
          requestInit: { headers },
        });
        await client!.connect(transport);
      } else {
        const transport = new SSEClientTransport(new URL(url), {
          requestInit: { headers },
        });
        await client!.connect(transport);
      }
    })();

    await Promise.race([connectPromise, timeoutPromise]);

    // Try to list tools to verify connection
    const toolsResult = await client.listTools();

    return {
      success: true,
      toolCount: toolsResult.tools.length,
    };
  } catch (error) {
    console.error(`[MCP Test] Failed to connect to ${serverName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // Close connection
    if (client) {
      try {
        await client.close();
      } catch (err) {
        console.error(`[MCP Test] Error closing connection:`, err);
      }
    }
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serverId } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: 'Missing serverId parameter' },
        { status: 400 }
      );
    }

    // Get user's config for this server
    const userConfig = await prisma.userMCPConfig.findUnique({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId,
        },
      },
      include: {
        server: true,
      },
    });

    if (!userConfig) {
      return NextResponse.json(
        { error: 'Server configuration not found' },
        { status: 404 }
      );
    }

    // Parse configs
    const configTemplate = JSON.parse(userConfig.server.configTemplate);
    const userConfigData = JSON.parse(userConfig.config);

    // Merge configs
    const mergedConfig = mergeConfigs(configTemplate, userConfigData);

    // Test connection
    const result = await testMCPConnection(userConfig.server.slug, mergedConfig);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully connected to ${userConfig.server.name}`,
        toolCount: result.toolCount,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Connection failed',
      });
    }
  } catch (error) {
    console.error('[MCP Test API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test connection', success: false },
      { status: 500 }
    );
  }
}
