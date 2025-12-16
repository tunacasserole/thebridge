/**
 * MCP Client - Dynamic Tool Loading from MCP Servers
 *
 * Connects to MCP servers from two sources:
 * 1. Database: Per-user configurations stored in UserMCPConfig
 * 2. Fallback: .mcp.json file for development/default configs
 *
 * Supports multiple transport types:
 * - SSE direct: type: "sse" with url
 * - HTTP: type: "http" with url and headers
 * - mcp-remote: command: "npx" with mcp-remote args
 * - stdio: command: "npx" with server package (NOT supported in serverless)
 *
 * NO HARDCODED TOOLS - all tools come from MCP servers.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { logMCPConnection } from '@/lib/logging/serverLogger';

// Type for MCP server config from .mcp.json
interface MCPServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  type?: 'stdio' | 'sse' | 'http';
  url?: string;
  headers?: Record<string, string>;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

// Store active MCP clients for this request
const mcpClients: Map<string, Client> = new Map();

/**
 * Load MCP config from .mcp.json
 */
function loadMCPConfig(): MCPConfig | null {
  const configPath = path.join(process.cwd(), '.mcp.json');

  if (!fs.existsSync(configPath)) {
    console.log('[MCP] No .mcp.json found');
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('[MCP] Failed to parse .mcp.json:', error);
    return null;
  }
}

/**
 * Extract SSE URL from mcp-remote args
 */
function extractSSEUrl(config: MCPServerConfig): string | null {
  // Check if it's using mcp-remote (SSE transport)
  if (config.args?.includes('mcp-remote')) {
    const urlIndex = config.args.findIndex(arg => arg.startsWith('http'));
    if (urlIndex !== -1) {
      return config.args[urlIndex];
    }
  }

  // Direct URL config
  if (config.url) {
    return config.url;
  }

  return null;
}

/**
 * Resolve environment variables in headers
 */
function resolveEnvVars(value: string, env: Record<string, string>): string {
  return value.replace(/\$\{(\w+)\}/g, (_, key) => env[key] || process.env[key] || '');
}

/**
 * Extract headers from mcp-remote args or direct headers config
 */
function extractHeaders(config: MCPServerConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  // Check for direct headers property first
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
 * Connect to an MCP server using appropriate transport
 */
async function connectToMCPServer(
  serverName: string,
  config: MCPServerConfig
): Promise<Client | null> {
  const transportType = getTransportType(config);
  const url = extractSSEUrl(config);

  if (transportType === 'stdio') {
    logMCPConnection({
      serverName,
      status: 'failed',
      error: 'stdio transport not supported in serverless',
    });
    return null;
  }

  if (transportType === 'unsupported' || !url) {
    logMCPConnection({
      serverName,
      status: 'failed',
      error: 'No compatible transport configuration',
    });
    return null;
  }

  try {
    logMCPConnection({
      serverName,
      status: 'connecting',
      url,
      transport: transportType,
    });

    const headers = extractHeaders(config);

    const client = new Client({
      name: `thebridge-${serverName}`,
      version: '1.0.0',
    });

    if (transportType === 'http') {
      // Use HTTP Streamable transport
      const transport = new StreamableHTTPClientTransport(new URL(url), {
        requestInit: {
          headers,
        },
      });
      await client.connect(transport);
    } else {
      // Use SSE transport
      const transport = new SSEClientTransport(new URL(url), {
        requestInit: {
          headers,
        },
      });
      await client.connect(transport);
    }

    logMCPConnection({
      serverName,
      status: 'connected',
      url,
      transport: transportType,
    });
    mcpClients.set(serverName, client);

    return client;
  } catch (error) {
    logMCPConnection({
      serverName,
      status: 'failed',
      url,
      transport: transportType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Convert MCP tool to Anthropic tool format
 */
function mcpToolToAnthropic(
  serverName: string,
  tool: { name: string; description?: string; inputSchema?: unknown }
): Anthropic.Tool {
  return {
    name: `${serverName}__${tool.name}`,
    description: tool.description || `Tool from ${serverName}`,
    input_schema: (tool.inputSchema as Anthropic.Tool['input_schema']) || {
      type: 'object',
      properties: {},
      required: [],
    },
  };
}

/**
 * Load tools from specified MCP servers only
 *
 * @param enabledServers - Array of server IDs to connect to (e.g., ['coralogix', 'newrelic'])
 *                         If empty, no tools are loaded
 */
export async function loadMCPTools(enabledServers: string[] = []): Promise<{
  tools: Anthropic.Tool[];
  serverNames: string[];
  failedServers: string[];
}> {
  const config = loadMCPConfig();

  if (!config) {
    return { tools: [], serverNames: [], failedServers: [] };
  }

  if (enabledServers.length === 0) {
    console.log('[MCP] No servers enabled');
    return { tools: [], serverNames: [], failedServers: [] };
  }

  // Filter to only include servers that exist in .mcp.json
  const availableServers = Object.keys(config.mcpServers);
  const validServers = enabledServers.filter(s => availableServers.includes(s));
  const skippedServers = enabledServers.filter(s => !availableServers.includes(s));

  if (skippedServers.length > 0) {
    // Only log once with count to reduce spam
    console.log(`[MCP] Skipped ${skippedServers.length} non-MCP tool IDs`);
  }

  if (validServers.length === 0) {
    console.log('[MCP] No valid MCP servers to connect');
    return { tools: [], serverNames: [], failedServers: [] };
  }

  const allTools: Anthropic.Tool[] = [];
  const connectedServers: string[] = [];
  const failedServers: string[] = [];

  for (const serverName of validServers) {
    const serverConfig = config.mcpServers[serverName];

    const client = await connectToMCPServer(serverName, serverConfig);

    if (client) {
      try {
        const toolsResult = await client.listTools();

        for (const tool of toolsResult.tools) {
          allTools.push(mcpToolToAnthropic(serverName, tool));
        }

        connectedServers.push(serverName);
        console.log(`[MCP] Loaded ${toolsResult.tools.length} tools from ${serverName}`);
      } catch (error) {
        console.error(`[MCP] Failed to list tools from ${serverName}:`, error);
        failedServers.push(serverName);
      }
    } else {
      failedServers.push(serverName);
    }
  }

  return { tools: allTools, serverNames: connectedServers, failedServers };
}

/**
 * Execute an MCP tool
 */
export async function executeMCPTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // Parse server name from tool name (format: serverName__toolName)
  const [serverName, ...toolParts] = toolName.split('__');
  const actualToolName = toolParts.join('__');

  const client = mcpClients.get(serverName);

  if (!client) {
    return {
      success: false,
      error: `MCP server not connected: ${serverName}`,
    };
  }

  try {
    console.log(`[MCP] Executing ${serverName}/${actualToolName}`);

    const result = await client.callTool({
      name: actualToolName,
      arguments: input,
    });

    // Extract content from result
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map(c => c.text)
        .join('\n');

      // Try to parse as JSON
      try {
        return { success: true, data: JSON.parse(textContent) };
      } catch {
        return { success: true, data: textContent };
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error(`[MCP] Tool execution failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Close all MCP connections
 */
export async function closeMCPConnections(): Promise<void> {
  for (const [name, client] of mcpClients) {
    try {
      await client.close();
      logMCPConnection({ serverName: name, status: 'disconnected' });
    } catch (error) {
      console.error(`[MCP] Error closing ${name}:`, error);
    }
  }
  mcpClients.clear();
}

/**
 * Get connected server names
 */
export function getConnectedServers(): string[] {
  return Array.from(mcpClients.keys());
}

/**
 * Get available MCP servers from config (for UI display)
 */
export function getAvailableMCPServers(): string[] {
  const config = loadMCPConfig();
  if (!config) {
    return [];
  }
  return Object.keys(config.mcpServers);
}

// ============================================
// Database-backed MCP Configuration
// ============================================

interface UserMCPConfigData {
  serverId: string;
  serverSlug: string;
  serverName: string;
  transportType: string;
  configTemplate: MCPServerConfig;
  userConfig: Record<string, unknown>;
  isEnabled: boolean;
}

/**
 * Load user's MCP configurations from database
 */
export async function loadUserMCPConfigs(userId: string): Promise<UserMCPConfigData[]> {
  try {
    const configs = await prisma.userMCPConfig.findMany({
      where: {
        userId,
        isEnabled: true,
      },
      include: {
        server: true,
      },
      orderBy: { priority: 'asc' },
    });

    return configs.map((config) => ({
      serverId: config.serverId,
      serverSlug: config.server.slug,
      serverName: config.server.name,
      transportType: config.server.transportType,
      configTemplate: JSON.parse(config.server.configTemplate),
      userConfig: JSON.parse(config.config),
      isEnabled: config.isEnabled,
    }));
  } catch (error) {
    console.error('[MCP] Failed to load user configs from database:', error);
    return [];
  }
}

/**
 * Merge user config with server template to create final config
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
 * Load MCP tools for a specific user from database
 *
 * @param userId - The user's ID to load configurations for
 * @param enabledServerSlugs - Optional array of server slugs to enable (filters user's configs)
 */
export async function loadUserMCPTools(
  userId: string,
  enabledServerSlugs?: string[]
): Promise<{
  tools: Anthropic.Tool[];
  serverNames: string[];
  failedServers: string[];
}> {
  const userConfigs = await loadUserMCPConfigs(userId);

  if (userConfigs.length === 0) {
    console.log(`[MCP] No MCP configs found for user ${userId}, falling back to .mcp.json`);
    // Fall back to file-based config with all servers
    return loadMCPTools(enabledServerSlugs || getAvailableMCPServers());
  }

  // Filter by enabled slugs if specified
  const filteredConfigs = enabledServerSlugs
    ? userConfigs.filter((c) => enabledServerSlugs.includes(c.serverSlug))
    : userConfigs;

  if (filteredConfigs.length === 0) {
    console.log('[MCP] No enabled servers match the requested slugs');
    return { tools: [], serverNames: [], failedServers: [] };
  }

  const allTools: Anthropic.Tool[] = [];
  const connectedServers: string[] = [];
  const failedServers: string[] = [];

  for (const config of filteredConfigs) {
    const mergedConfig = mergeConfigs(config.configTemplate, config.userConfig);
    const client = await connectToMCPServer(config.serverSlug, mergedConfig);

    if (client) {
      try {
        const toolsResult = await client.listTools();

        for (const tool of toolsResult.tools) {
          allTools.push(mcpToolToAnthropic(config.serverSlug, tool));
        }

        connectedServers.push(config.serverSlug);
        console.log(`[MCP] Loaded ${toolsResult.tools.length} tools from ${config.serverName}`);
      } catch (error) {
        console.error(`[MCP] Failed to list tools from ${config.serverName}:`, error);
        failedServers.push(config.serverSlug);
      }
    } else {
      failedServers.push(config.serverSlug);
    }
  }

  return { tools: allTools, serverNames: connectedServers, failedServers };
}

/**
 * Get available MCP servers for a user (from database)
 */
export async function getUserAvailableMCPServers(userId: string): Promise<string[]> {
  try {
    const configs = await prisma.userMCPConfig.findMany({
      where: { userId, isEnabled: true },
      include: { server: { select: { slug: true } } },
    });

    return configs.map((c) => c.server.slug);
  } catch (error) {
    console.error('[MCP] Failed to get user MCP servers:', error);
    return getAvailableMCPServers(); // Fall back to file config
  }
}
