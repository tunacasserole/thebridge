/**
 * Analyze MCP Tools - Measure token usage and tool characteristics
 *
 * This script connects to configured MCP servers and analyzes:
 * - Total tool count
 * - Token usage per tool (approximate)
 * - Tool description lengths
 * - Input schema complexity
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import fs from 'fs';
import path from 'path';

// Rough token estimation (GPT-3 tokenizer approximation)
function estimateTokens(text: string): number {
  // Average: 1 token ≈ 4 characters for English text
  // More accurate for JSON: ~1 token per 3 characters
  return Math.ceil(text.length / 3.5);
}

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

function loadMCPConfig(): MCPConfig | null {
  const configPath = path.join(process.cwd(), '.mcp.json');

  if (!fs.existsSync(configPath)) {
    console.error('No .mcp.json found');
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse .mcp.json:', error);
    return null;
  }
}

function extractSSEUrl(config: MCPServerConfig): string | null {
  if (config.args?.includes('mcp-remote')) {
    const urlIndex = config.args.findIndex(arg => arg.startsWith('http'));
    if (urlIndex !== -1) {
      return config.args[urlIndex];
    }
  }

  if (config.url) {
    return config.url;
  }

  return null;
}

function resolveEnvVars(value: string, env: Record<string, string>): string {
  return value.replace(/\$\{(\w+)\}/g, (_, key) => env[key] || process.env[key] || '');
}

function extractHeaders(config: MCPServerConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.headers) {
    for (const [key, value] of Object.entries(config.headers)) {
      headers[key] = resolveEnvVars(value, config.env || {});
    }
  }

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

function getTransportType(config: MCPServerConfig): 'sse' | 'http' | 'stdio' | 'unsupported' {
  if (config.type === 'http') return 'http';
  if (config.type === 'sse') return 'sse';
  if (config.type === 'stdio') return 'stdio';

  if (config.url) {
    return config.headers ? 'http' : 'sse';
  }

  if (config.command && config.args) {
    if (config.args.some(arg => arg.includes('mcp-remote'))) {
      return 'sse';
    }
    return 'stdio';
  }

  return 'unsupported';
}

async function connectToMCPServer(
  serverName: string,
  config: MCPServerConfig
): Promise<Client | null> {
  const transportType = getTransportType(config);
  const url = extractSSEUrl(config);

  if (transportType === 'stdio') {
    console.log(`${serverName}: stdio not supported in this script`);
    return null;
  }

  if (transportType === 'unsupported' || !url) {
    console.log(`${serverName}: No compatible transport`);
    return null;
  }

  try {
    console.log(`Connecting to ${serverName} at ${url} (${transportType})...`);

    const headers = extractHeaders(config);
    const client = new Client({
      name: `thebridge-analyzer`,
      version: '1.0.0',
    });

    if (transportType === 'http') {
      const transport = new StreamableHTTPClientTransport(new URL(url), {
        requestInit: { headers },
      });
      await client.connect(transport);
    } else {
      const transport = new SSEClientTransport(new URL(url), {
        requestInit: { headers },
      });
      await client.connect(transport);
    }

    console.log(`✓ Connected to ${serverName}`);
    return client;
  } catch (error) {
    console.error(`✗ Failed to connect to ${serverName}:`, error);
    return null;
  }
}

async function analyzeTools() {
  const config = loadMCPConfig();

  if (!config) {
    console.error('Failed to load MCP config');
    return;
  }

  console.log('\n=== MCP Tool Analysis ===\n');

  const results: {
    server: string;
    toolCount: number;
    totalTokens: number;
    avgTokensPerTool: number;
    tools: Array<{
      name: string;
      descriptionTokens: number;
      schemaTokens: number;
      totalTokens: number;
    }>;
  }[] = [];

  for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
    const client = await connectToMCPServer(serverName, serverConfig);

    if (!client) {
      continue;
    }

    try {
      const toolsResult = await client.listTools();

      let serverTotalTokens = 0;
      const toolDetails: Array<{
        name: string;
        descriptionTokens: number;
        schemaTokens: number;
        totalTokens: number;
      }> = [];

      for (const tool of toolsResult.tools) {
        const descriptionTokens = estimateTokens(tool.description || '');
        const schemaTokens = estimateTokens(JSON.stringify(tool.inputSchema || {}));
        const totalTokens = descriptionTokens + schemaTokens + estimateTokens(tool.name);

        serverTotalTokens += totalTokens;
        toolDetails.push({
          name: tool.name,
          descriptionTokens,
          schemaTokens,
          totalTokens,
        });
      }

      results.push({
        server: serverName,
        toolCount: toolsResult.tools.length,
        totalTokens: serverTotalTokens,
        avgTokensPerTool: Math.round(serverTotalTokens / toolsResult.tools.length),
        tools: toolDetails,
      });

      console.log(`\n${serverName}:`);
      console.log(`  Tools: ${toolsResult.tools.length}`);
      console.log(`  Total tokens: ~${serverTotalTokens}`);
      console.log(`  Avg tokens/tool: ~${Math.round(serverTotalTokens / toolsResult.tools.length)}`);

      // Show top 5 most expensive tools
      const sorted = [...toolDetails].sort((a, b) => b.totalTokens - a.totalTokens);
      console.log(`  Top 5 most expensive tools:`);
      sorted.slice(0, 5).forEach((t, i) => {
        console.log(`    ${i + 1}. ${t.name}: ~${t.totalTokens} tokens (desc: ${t.descriptionTokens}, schema: ${t.schemaTokens})`);
      });

      await client.close();
    } catch (error) {
      console.error(`Failed to analyze ${serverName}:`, error);
    }
  }

  // Summary
  console.log('\n=== Summary ===\n');

  const totalTools = results.reduce((sum, r) => sum + r.toolCount, 0);
  const totalTokens = results.reduce((sum, r) => sum + r.totalTokens, 0);

  console.log(`Total servers analyzed: ${results.length}`);
  console.log(`Total tools: ${totalTools}`);
  console.log(`Total tokens (all tools): ~${totalTokens}`);
  console.log(`Average tokens per tool: ~${Math.round(totalTokens / totalTools)}`);

  // Save detailed results
  const outputPath = path.join(process.cwd(), 'tool-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);
}

analyzeTools().catch(console.error);
