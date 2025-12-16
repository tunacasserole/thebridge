/**
 * Agent Chat API Route - Serverless Compatible
 *
 * Uses standard @anthropic-ai/sdk with custom agent loop.
 * Supports specialized agents with different system prompts.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { getAgentConfig, AgentConfig } from '@/lib/agents/configs';
import { getAgent } from '@/lib/db';
import { ALL_TOOLS, executeTool } from '@/lib/tools';

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

// Tool categories that map to integration categories
const TOOL_CATEGORY_MAP: Record<string, string[]> = {
  rootly: ['rootly_get_incidents', 'rootly_update_incident', 'rootly_post_comment'],
  github: ['github_get_prs'],
  jira: ['jira_search_issues', 'jira_get_issue', 'jira_add_comment', 'jira_create_story'],
  confluence: [], // No dedicated tools yet
  newrelic: ['newrelic_get_applications'],
  coralogix: [], // Would need direct API client
  kubernetes: [], // Not suitable for serverless
  metabase: ['metabase_list_databases', 'metabase_execute_query', 'metabase_search_questions', 'metabase_run_question'],
  prometheus: [], // Would need direct API client
  atlassian: ['jira_search_issues', 'jira_get_issue', 'jira_add_comment', 'jira_create_story'],
};

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

    // Get model ID
    const modelId = MODEL_MAP[agentConfig.model] || MODEL_MAP.sonnet;

    // Determine which tools this agent should have access to
    // For specialized agents, filter tools based on their mcpServers config
    let agentTools = ALL_TOOLS;

    if (agentConfig.mcpServers.length > 0) {
      // Get tools for the agent's configured integrations
      const enabledToolNames = new Set<string>();

      for (const server of agentConfig.mcpServers) {
        const tools = TOOL_CATEGORY_MAP[server] || [];
        tools.forEach((t) => enabledToolNames.add(t));
      }

      // Always include web tools for all agents
      enabledToolNames.add('web_search');
      enabledToolNames.add('http_request');

      agentTools = ALL_TOOLS.filter((t) => enabledToolNames.has(t.name));
    }

    console.log(`[Agent: ${agentId}] Starting with model: ${modelId}`);
    console.log(`[Agent: ${agentId}] Tools: ${agentTools.map((t) => t.name).join(', ')}`);

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

            // Call Claude
            const response = await anthropic.messages.create({
              model: modelId,
              max_tokens: 8192,
              system: agentConfig.systemPrompt,
              tools: agentTools.length > 0 ? agentTools : undefined,
              messages,
            });

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
                const result = await executeTool(
                  toolUse.name,
                  toolUse.input as Record<string, unknown>
                );

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
