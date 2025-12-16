/**
 * Agent Chat API Route - Serverless Compatible
 *
 * Uses standard @anthropic-ai/sdk with custom agent loop.
 * Supports specialized agents with different system prompts.
 * ALL tools come from MCP servers dynamically - no hardcoded tools.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { getAgentConfig, AgentConfig } from '@/lib/agents/configs';
import { getAgent } from '@/lib/db';
import { loadMCPTools, executeMCPTool, closeMCPConnections } from '@/lib/mcp/client';
import {
  createCachedRequestConfig,
  updateCacheStats,
  logCacheStats,
} from '@/lib/cache/promptCache';
import {
  routeToModel,
  trackRoutingDecision,
  logRoutingStats,
} from '@/lib/routing/modelRouter';
import { filterTools, getDefaultLoadingStrategy } from '@/lib/tools/dynamicLoader';
import { recordToolUsage } from '@/lib/tools/analytics';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model mapping
const MODEL_MAP: Record<string, string> = {
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
  haiku: 'claude-3-5-haiku-latest',
};

// Max agent loop iterations
const MAX_ITERATIONS = 20;

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
      role = 'sre',
      model: modelOverride,
      enabledTools = [], // MCP server IDs enabled by user
    } = await request.json();

    // Get agent config from DB or fallback to hardcoded
    const dbAgent = await getAgent(agentId, role);
    const hardcodedConfig = getAgentConfig(agentId);

    let agentConfig: AgentConfig;

    if (dbAgent) {
      agentConfig = {
        id: dbAgent.slug,
        name: dbAgent.name,
        description: dbAgent.description || '',
        systemPrompt: dbAgent.systemPrompt,
        model: modelOverride || hardcodedConfig?.model || 'sonnet',
        tools: hardcodedConfig?.tools || [],
        mcpServers: hardcodedConfig?.mcpServers || [],
        accentColor: hardcodedConfig?.accentColor || '#6366f1',
      };
    } else if (hardcodedConfig) {
      agentConfig = {
        ...hardcodedConfig,
        model: modelOverride || hardcodedConfig.model,
      };
    } else {
      return Response.json({ error: `Unknown agent: ${agentId}` }, { status: 404 });
    }

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Determine which MCP servers to enable
    // Use agent's configured mcpServers if available, otherwise use what user enabled
    const serversToEnable = agentConfig.mcpServers.length > 0
      ? agentConfig.mcpServers
      : enabledTools;

    // Route to appropriate model based on query complexity
    const routingDecision = routeToModel(message, {
      conversationHistory,
      enabledTools: serversToEnable,
      agentId,
      userPreference: agentConfig.model as 'haiku' | 'sonnet' | 'opus' | undefined,
    });

    // Track routing decision
    trackRoutingDecision(routingDecision);

    // Use routed model
    const modelId = routingDecision.modelId;

    console.log(`[Agent: ${agentId}] Model routing:`, {
      requested: agentConfig.model,
      routed: routingDecision.model,
      reason: routingDecision.reason,
      costSavings: routingDecision.costSavings,
    });

    // Load tools from MCP servers
    const { tools: allTools, serverNames, failedServers } = await loadMCPTools(serversToEnable);

    // Apply dynamic tool filtering to reduce token usage
    const loadingStrategy = getDefaultLoadingStrategy(message, agentId);
    const { tools: mcpTools, metadata: filterMetadata } = await filterTools(
      allTools,
      serverNames,
      {
        ...loadingStrategy,
        query: message,
        agentId,
      }
    );

    console.log(`[Agent: ${agentId}] Starting with model: ${modelId}`);
    console.log(`[Agent: ${agentId}] MCP servers connected: ${serverNames.join(', ') || 'none'}`);
    if (failedServers.length > 0) {
      console.warn(`[Agent: ${agentId}] MCP servers failed to connect: ${failedServers.join(', ')}`);
    }
    console.log(`[Agent: ${agentId}] Tool filtering:`, {
      totalAvailable: filterMetadata.totalAvailable,
      loaded: filterMetadata.loaded,
      filtered: filterMetadata.filtered,
      tokensSaved: `~${filterMetadata.tokensSaved}`,
      categories: filterMetadata.categories.join(', '),
    });
    console.log(`[Agent: ${agentId}] Tools loaded: ${mcpTools.length > 10 ? `${mcpTools.length} tools` : mcpTools.map((t) => t.name).join(', ') || 'none'}`);

    // Build messages array
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history
    for (const msg of conversationHistory as ConversationMessage[]) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const toolCallsHistory: string[] = [];
        let iterations = 0;
        let finalResponse = '';

        // Heartbeat to keep connection alive
        const HEARTBEAT_INTERVAL = 15000;
        const heartbeatInterval = setInterval(() => {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        }, HEARTBEAT_INTERVAL);

        try {
          // Send initial status
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'status', status: 'thinking' })}\n\n`
            )
          );

          // Agent loop
          while (iterations < MAX_ITERATIONS) {
            iterations++;
            console.log(`[Agent: ${agentId}] Iteration ${iterations}`);

            // Create cached request configuration
            const requestConfig = createCachedRequestConfig({
              systemPrompt: agentConfig.systemPrompt,
              tools: mcpTools,
              messages,
              model: modelId,
              maxTokens: 8192,
            });

            // Call Claude with caching enabled
            const response = await anthropic.messages.create(requestConfig);

            // Update cache statistics
            updateCacheStats(response.usage);

            // Process response content
            const textBlocks: string[] = [];
            const toolUseBlocks: Anthropic.ToolUseBlock[] = [];

            for (const block of response.content) {
              if (block.type === 'text') {
                if (textBlocks.length === 0) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'status', status: 'responding' })}\n\n`
                    )
                  );
                }
                textBlocks.push(block.text);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'text', content: block.text })}\n\n`
                  )
                );
              } else if (block.type === 'tool_use') {
                toolUseBlocks.push(block);

                if (toolCallsHistory.length === 0) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'status', status: 'tool_calling' })}\n\n`
                    )
                  );
                }

                toolCallsHistory.push(block.name);

                // Stream tool start
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'tool',
                      name: block.name,
                      status: 'start',
                    })}\n\n`
                  )
                );
              }
            }

            // Store final text response
            if (textBlocks.length > 0) {
              finalResponse = textBlocks.join('');
            }

            // Check stop reason
            if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
              break;
            }

            // Execute tool calls
            if (toolUseBlocks.length > 0) {
              messages.push({
                role: 'assistant',
                content: response.content,
              });

              const toolResults: Anthropic.ToolResultBlockParam[] = [];

              for (const toolUse of toolUseBlocks) {
                console.log(`[Agent: ${agentId}] Executing tool: ${toolUse.name}`);

                // Measure tool execution time
                const executionStart = Date.now();

                // All tools are MCP tools
                const result = await executeMCPTool(
                  toolUse.name,
                  toolUse.input as Record<string, unknown>
                );

                const executionTime = Date.now() - executionStart;

                // Record tool usage for analytics
                recordToolUsage(
                  toolUse.name,
                  undefined, // userId not available in agent route
                  agentId,
                  executionTime,
                  result.success
                ).catch(err => console.error('[Analytics] Failed to record tool usage:', err));

                // Stream tool end
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'tool',
                      name: toolUse.name,
                      status: 'end',
                    })}\n\n`
                  )
                );

                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: result.success
                    ? JSON.stringify(result.data)
                    : `Error: ${result.error}`,
                  is_error: !result.success,
                });
              }

              messages.push({
                role: 'user',
                content: toolResults,
              });
            }
          }

          // Send done event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                response: finalResponse || 'Request completed.',
                toolCalls: toolCallsHistory,
              })}\n\n`
            )
          );

          // Log performance statistics
          logCacheStats(`[Agent: ${agentId} Cache]`);
          logRoutingStats();
        } catch (error) {
          console.error(`[Agent: ${agentId}] Error:`, error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
        } finally {
          clearInterval(heartbeatInterval);
          // Close MCP connections
          await closeMCPConnections();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Agent Route] Error:', error);
    return Response.json(
      {
        error: 'Agent request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
