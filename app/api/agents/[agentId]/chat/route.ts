import { query } from '@anthropic-ai/claude-agent-sdk';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getAgentConfig, AgentConfig } from '@/lib/agents/configs';
import { getAgent } from '@/lib/db';

// Helper to get API key - handles case where Claude Desktop sets empty ANTHROPIC_API_KEY
// which prevents Next.js from loading the value from .env.local
function getAnthropicApiKey(): string {
  // First try process.env (works when Next.js properly loads .env.local)
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 0) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // Fallback: read directly from .env.local if process.env value is empty
  // This handles the case where Claude Desktop sets ANTHROPIC_API_KEY="" in the environment
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match && match[1]) {
      console.log('Loaded ANTHROPIC_API_KEY from .env.local (process.env was empty)');
      return match[1].trim();
    }
  } catch (e) {
    console.error('Failed to read .env.local:', e);
  }

  return '';
}

// Cache the API key at module load time
const ANTHROPIC_API_KEY = getAnthropicApiKey();

// MCP Server configurations - MUST match main chat route for full functionality
// These are the same configs used in /api/chat/route.ts
const MCP_SERVERS: Record<string, any> = {
  metabase: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', '@easecloudio/mcp-metabase-server'],
    env: {
      METABASE_URL: process.env.METABASE_URL || '',
      METABASE_API_KEY: process.env.METABASE_API_KEY || '',
    },
  },
  newrelic: {
    type: 'stdio' as const,
    command: 'npx',
    args: [
      '-y',
      'mcp-remote',
      'https://mcp.newrelic.com/mcp/',
      '--header',
      `Api-Key:${process.env.NEW_RELIC_API_KEY || ''}`,
    ],
    env: {
      NEW_RELIC_API_KEY: process.env.NEW_RELIC_API_KEY || '',
    },
  },
  rootly: {
    type: 'stdio' as const,
    command: 'uvx',
    args: ['rootly-mcp-server'],
    env: {
      ROOTLY_API_KEY: process.env.ROOTLY_API_KEY || '',
    },
  },
  github: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    },
  },
  coralogix: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', '@nickholden/coralogix-mcp-server'],
    env: {
      CORALOGIX_API_KEY: process.env.CORALOGIX_API_KEY || '',
      CORALOGIX_REGION: process.env.CORALOGIX_REGION || 'auto',
      CORALOGIX_ENV: 'production',
    },
  },
  kubernetes: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', 'mcp-server-kubernetes'],
    env: {
      // Expand tilde to home directory properly
      KUBECONFIG: process.env.KUBECONFIG?.replace(/^~/, process.env.HOME || '')
        || `${process.env.HOME}/.kube/config`,
      // Pass through AWS config for EKS authentication
      AWS_CONFIG_FILE: `${process.env.HOME}/.aws/config`,
      AWS_SHARED_CREDENTIALS_FILE: `${process.env.HOME}/.aws/credentials`,
    },
  },
  atlassian: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', '@xuandev/atlassian-mcp'],
    env: {
      ATLASSIAN_DOMAIN: process.env.ATLASSIAN_DOMAIN || '',
      ATLASSIAN_EMAIL: process.env.ATLASSIAN_EMAIL || '',
      ATLASSIAN_API_TOKEN: process.env.ATLASSIAN_API_TOKEN || '',
    },
  },
  prometheus: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', 'prometheus-mcp@latest', 'stdio'],
    env: {
      PROMETHEUS_URL: process.env.PROMETHEUS_URL || '',
      ...(process.env.PROMETHEUS_USERNAME && {
        PROMETHEUS_USERNAME: process.env.PROMETHEUS_USERNAME,
      }),
      ...(process.env.PROMETHEUS_PASSWORD && {
        PROMETHEUS_PASSWORD: process.env.PROMETHEUS_PASSWORD,
      }),
      ...(process.env.PROMETHEUS_TOKEN && {
        PROMETHEUS_TOKEN: process.env.PROMETHEUS_TOKEN,
      }),
    },
  },
};

// List of all available MCP server IDs
const ALL_MCP_SERVER_IDS = Object.keys(MCP_SERVERS);

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    const {
      message,
      conversationHistory = [],
      sessionId,
      role = 'sre', // Default to SRE role if not provided
      model: modelOverride, // Optional model override (e.g., 'haiku' for General agent in multiagent mode)
    } = await request.json();

    // First try to get agent config from database
    const dbAgent = await getAgent(agentId, role);

    // Get hardcoded config for non-DB fields (model, tools, mcpServers, accentColor)
    // This maintains backward compatibility while allowing prompt customization via DB
    const hardcodedConfig = getAgentConfig(agentId);

    // Build the effective agent config
    let agentConfig: AgentConfig;

    if (dbAgent) {
      // Use DB agent with hardcoded fallbacks for model/tools/mcpServers
      agentConfig = {
        id: dbAgent.slug,
        name: dbAgent.name,
        description: dbAgent.description || '',
        systemPrompt: dbAgent.systemPrompt,
        // Use model override if provided, otherwise hardcoded config, then fallback to sonnet
        model: modelOverride || hardcodedConfig?.model || 'sonnet',
        tools: hardcodedConfig?.tools || ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch'],
        mcpServers: hardcodedConfig?.mcpServers || [],
        accentColor: hardcodedConfig?.accentColor || '#6366f1',
      };
    } else if (hardcodedConfig) {
      // Fallback to hardcoded config if not in DB, but still respect model override
      agentConfig = {
        ...hardcodedConfig,
        model: modelOverride || hardcodedConfig.model,
      };
    } else {
      return Response.json(
        { error: `Unknown agent: ${agentId}` },
        { status: 404 }
      );
    }

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build MCP servers for this agent
    // If agent has empty mcpServers array, it gets ALL available MCPs (e.g., General agent)
    // If agent has specific mcpServers, it only gets those (e.g., specialized agents)
    // IMPORTANT: Only include MCP servers that have valid configuration (required env vars set)
    const mcpServers: Record<string, any> = {};
    const mcpServerIds = agentConfig.mcpServers.length === 0
      ? ALL_MCP_SERVER_IDS  // General agent gets all MCPs
      : agentConfig.mcpServers;  // Specialized agents get their specific MCPs

    // Helper to check if an MCP server has valid configuration
    const isMcpServerConfigured = (mcpId: string): boolean => {
      switch (mcpId) {
        case 'metabase':
          return !!(process.env.METABASE_URL && process.env.METABASE_API_KEY);
        case 'newrelic':
          return !!process.env.NEW_RELIC_API_KEY;
        case 'rootly':
          return !!process.env.ROOTLY_API_KEY;
        case 'github':
          return !!process.env.GITHUB_TOKEN;
        case 'coralogix':
          return !!process.env.CORALOGIX_API_KEY;
        case 'kubernetes':
          // Kubernetes just needs kubeconfig which usually exists
          return true;
        case 'atlassian':
          return !!(process.env.ATLASSIAN_DOMAIN && process.env.ATLASSIAN_EMAIL && process.env.ATLASSIAN_API_TOKEN);
        case 'prometheus':
          return !!process.env.PROMETHEUS_URL;
        default:
          return true;
      }
    };

    for (const mcpId of mcpServerIds) {
      if (MCP_SERVERS[mcpId] && isMcpServerConfigured(mcpId)) {
        mcpServers[mcpId] = MCP_SERVERS[mcpId];
      }
    }

    console.log(`[Agent: ${agentId}] Configured MCP servers: ${Object.keys(mcpServers).join(', ') || 'none'}`);
    console.log(`[Agent: ${agentId}] Skipped unconfigured servers: ${mcpServerIds.filter(id => !isMcpServerConfigured(id)).join(', ') || 'none'}`);

    // Build the prompt with system context and conversation history
    let fullPrompt = `${agentConfig.systemPrompt}\n\n`;

    // Add conversation history
    for (const msg of conversationHistory as ConversationMessage[]) {
      if (msg.role === 'user') {
        fullPrompt += `Human: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `Assistant: ${msg.content}\n\n`;
      }
    }

    // Add current message
    fullPrompt += `Human: ${message}\n\nRespond helpfully and concisely.`;

    // Map model names to Claude model IDs
    const modelMap: Record<string, string> = {
      sonnet: 'claude-sonnet-4-20250514',
      opus: 'claude-opus-4-20250514',
      haiku: 'claude-3-5-haiku-latest',
    };
    const modelId = modelMap[agentConfig.model] || modelMap.sonnet;

    console.log(`[Agent: ${agentId}] Starting query with model: ${modelId}`);
    console.log(`[Agent: ${agentId}] MCP servers: ${Object.keys(mcpServers).join(', ') || 'none'}`);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const responseParts: string[] = [];
        const toolCalls: string[] = [];
        let capturedSessionId: string | undefined;

        // Heartbeat to keep connection alive
        const HEARTBEAT_INTERVAL = 15000;
        const heartbeatInterval = setInterval(() => {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        }, HEARTBEAT_INTERVAL);

        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            status: 'thinking'
          })}\n\n`));

          // All agents use the Claude Agent SDK with MCP servers
          // General agent gets ALL MCPs, specialized agents get their specific MCPs
          console.log(`[Agent: ${agentId}] Using Agent SDK with MCP servers: ${Object.keys(mcpServers).join(', ')}`);

          // Log whether API key is present (not the key itself for security)
          const hasApiKey = !!ANTHROPIC_API_KEY;
          const apiKeyPrefix = ANTHROPIC_API_KEY?.substring(0, 10) || 'NOT SET';
          console.log(`[Agent: ${agentId}] ANTHROPIC_API_KEY present: ${hasApiKey}, prefix: ${apiKeyPrefix}...`);

          for await (const event of query({
            prompt: fullPrompt,
            options: {
              model: modelId,
              maxTurns: 20,
              allowedTools: undefined,
              mcpServers: mcpServers,
              cwd: process.cwd(),
              permissionMode: 'bypassPermissions',
              // Pass API key explicitly and CLEAR OAuth tokens to force API key auth
              // The parent process (Claude Desktop) sets CLAUDE_CODE_OAUTH_TOKEN which
              // causes the subprocess to try OAuth auth instead of API key auth
              env: {
                // Essential system paths
                HOME: process.env.HOME || '',
                PATH: process.env.PATH || '',
                NODE_ENV: process.env.NODE_ENV || 'development',
                // Force API key authentication - MUST be set, MUST clear OAuth token
                ANTHROPIC_API_KEY: ANTHROPIC_API_KEY,
                CLAUDE_CODE_OAUTH_TOKEN: '', // Clear OAuth token to prevent OAuth auth
                // MCP server credentials
                METABASE_URL: process.env.METABASE_URL || '',
                METABASE_API_KEY: process.env.METABASE_API_KEY || '',
                NEW_RELIC_API_KEY: process.env.NEW_RELIC_API_KEY || '',
                ROOTLY_API_KEY: process.env.ROOTLY_API_KEY || '',
                GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
                CORALOGIX_API_KEY: process.env.CORALOGIX_API_KEY || '',
                CORALOGIX_REGION: process.env.CORALOGIX_REGION || 'auto',
                ATLASSIAN_DOMAIN: process.env.ATLASSIAN_DOMAIN || '',
                ATLASSIAN_EMAIL: process.env.ATLASSIAN_EMAIL || '',
                ATLASSIAN_API_TOKEN: process.env.ATLASSIAN_API_TOKEN || '',
                PROMETHEUS_URL: process.env.PROMETHEUS_URL || '',
                // AWS credentials for Kubernetes EKS
                AWS_CONFIG_FILE: `${process.env.HOME}/.aws/config`,
                AWS_SHARED_CREDENTIALS_FILE: `${process.env.HOME}/.aws/credentials`,
                KUBECONFIG: process.env.KUBECONFIG?.replace(/^~/, process.env.HOME || '') || `${process.env.HOME}/.kube/config`,
              },
              // Capture stderr to see subprocess errors (auth failures, etc.)
              stderr: (message: string) => {
                console.error(`[Agent: ${agentId}] SDK stderr: ${message}`);
              },
              ...(sessionId && { resume: sessionId }),
            },
          })) {
            // Capture session ID from init event
            if (event.type === 'system' && 'subtype' in event && event.subtype === 'init') {
              capturedSessionId = (event as { session_id?: string }).session_id;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'session',
                sessionId: capturedSessionId
              })}\n\n`));
            }

            if (event.type === 'assistant' && event.message?.content) {
              for (const block of event.message.content) {
                if ('text' in block && block.text) {
                  if (responseParts.length === 0) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'status',
                      status: 'responding'
                    })}\n\n`));
                  }
                  responseParts.push(block.text);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'text',
                    content: block.text
                  })}\n\n`));
                }
                if ('type' in block && block.type === 'tool_use') {
                  const toolName = (block as { name?: string }).name || 'tool';
                  toolCalls.push(toolName);

                  if (toolCalls.length === 1) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'status',
                      status: 'tool_calling'
                    })}\n\n`));
                  }

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'tool',
                    name: toolName,
                    status: 'start'
                  })}\n\n`));

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'tool',
                    name: toolName,
                    status: 'end'
                  })}\n\n`));
                }
              }
            }
          }

          // Send completion event
          const responseText = responseParts.join('').trim();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            response: responseText || "Request completed.",
            toolCalls,
            sessionId: capturedSessionId,
          })}\n\n`));

        } catch (error) {
          console.error(`[Agent: ${agentId}] Stream error:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // If Agent SDK failed, provide a more helpful message
          const isAgentSdkError = errorMessage.includes('process exited') ||
                                  errorMessage.includes('Claude Code');

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: isAgentSdkError
              ? 'Agent process failed to start. This may be due to environment configuration.'
              : errorMessage
          })}\n\n`));
        } finally {
          clearInterval(heartbeatInterval);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Agent route error:', error);
    return Response.json(
      {
        error: 'Agent request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
