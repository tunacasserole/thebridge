/**
 * Chat API Route - Serverless Compatible
 *
 * Uses standard @anthropic-ai/sdk with custom agent loop.
 * ALL tools come from MCP servers dynamically - no hardcoded tools.
 * Supports per-user API keys via authentication.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { loadMCPTools, executeMCPTool, closeMCPConnections } from '@/lib/mcp/client';
import { getAuthenticatedUser, getUserApiKey } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  getResponseLengthConfig,
  getTemplateInstruction,
  type ResponseProfile,
} from '@/lib/response';
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
import { trackTokenUsage } from '@/lib/analytics/tracking';
import { filterTools, getDefaultLoadingStrategy } from '@/lib/tools/dynamicLoader';
import { recordToolUsage } from '@/lib/tools/analytics';
import { optimizeToolResult } from '@/lib/tokens';
import {
  logAIRequest,
  logAIResponse,
  logMCPToolCall,
  logMCPToolResult,
  logToolSummary,
  logModelRouting,
} from '@/lib/logging/serverLogger';

// Get Anthropic client (creates per-request for user API key support)
async function getAnthropicClient(): Promise<Anthropic> {
  const user = await getAuthenticatedUser();

  if (user?.id) {
    // Try to get user's personal API key
    const userApiKey = await getUserApiKey(user.id);
    if (userApiKey) {
      return new Anthropic({ apiKey: userApiKey });
    }
  }

  // Fall back to server API key
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

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

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      conversationHistory = [],
      enabledTools = [],
      extendedThinking = false,
      model = 'sonnet',
      verbose = false,
      files = [],
      conversationId,
      responseProfile,
    } = await request.json();

    // Get authenticated user for conversation persistence
    const user = await getAuthenticatedUser();

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Route to appropriate model based on query complexity
    const routingDecision = routeToModel(message, {
      conversationHistory,
      enabledTools,
      userPreference: model as 'haiku' | 'sonnet' | 'opus' | undefined,
    });

    // Track routing decision for analytics
    trackRoutingDecision(routingDecision);

    // Use routed model
    const modelId = routingDecision.modelId;

    // Log model routing decision
    logModelRouting({
      requested: model,
      routed: routingDecision.model,
      reason: routingDecision.reason,
      costSavings: routingDecision.costSavings,
    });

    // Build messages array for Claude
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history
    for (const msg of conversationHistory as ConversationMessage[]) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Handle file attachments
    const imageBlocks: Anthropic.ImageBlockParam[] = [];
    const textFileContent: string[] = [];

    for (const file of files as FileAttachment[]) {
      if (file.type.startsWith('image/')) {
        // Image attachment
        const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        imageBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: file.data,
          },
        });
      } else if (isTextFile(file)) {
        // Text file - decode and include as text
        try {
          const text = Buffer.from(file.data, 'base64').toString('utf-8');
          textFileContent.push(`\n--- File: ${file.name} ---\n${text}\n--- End of ${file.name} ---`);
        } catch (e) {
          console.error('Error decoding file:', file.name, e);
        }
      }
    }

    // Build current user message with files
    const userMessageContent: Anthropic.ContentBlockParam[] = [];

    // Add images first
    for (const img of imageBlocks) {
      userMessageContent.push(img);
    }

    // Add text content with any file contents
    const fullMessage = textFileContent.length > 0
      ? `${message}${textFileContent.join('\n')}`
      : message;

    userMessageContent.push({
      type: 'text',
      text: fullMessage,
    });

    messages.push({
      role: 'user',
      content: userMessageContent,
    });

    // Load tools from enabled MCP servers only
    // enabledTools is an array of MCP server IDs like ['coralogix', 'newrelic', 'github']
    const { tools: allTools, serverNames, failedServers } = await loadMCPTools(enabledTools);

    // Apply dynamic tool filtering to reduce token usage
    const loadingStrategy = getDefaultLoadingStrategy(message);
    const { tools, metadata: filterMetadata } = await filterTools(
      allTools,
      serverNames,
      {
        ...loadingStrategy,
        query: message,
        userId: user?.id,
      }
    );

    // Get optimized response length configuration
    const lengthConfig = getResponseLengthConfig({
      message,
      profile: responseProfile as ResponseProfile | undefined,
      conversationLength: conversationHistory.length,
      hasFiles: files.length > 0,
      toolsEnabled: tools.length > 0,
      extendedThinking,
    });

    // Get template instruction to add to system prompt
    const templateInstruction = getTemplateInstruction(message);
    const enhancedSystemPrompt = `${SYSTEM_PROMPT}

Response Guidelines:
${templateInstruction}

Be concise and direct. Avoid unnecessary preambles or verbose explanations.`;

    // Log AI request with formatted output
    logAIRequest({
      model: modelId,
      messageCount: messages.length,
      toolCount: tools.length,
      hasThinking: extendedThinking,
      maxTokens: lengthConfig.maxTokens,
      conversationId,
    });

    // Log MCP server connection status
    if (serverNames.length > 0) {
      console.log(`[Chat] MCP servers connected: ${serverNames.join(', ')}`);
    }
    if (failedServers.length > 0) {
      console.warn(`[Chat] MCP servers failed: ${failedServers.join(', ')}`);
    }
    if (filterMetadata.filtered > 0) {
      console.log(`[Chat] Tool filtering: ${filterMetadata.loaded}/${filterMetadata.totalAvailable} tools (~${filterMetadata.tokensSaved} tokens saved)`);
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const toolCallsHistory: { name: string; input?: unknown }[] = [];
        let iterations = 0;
        let finalResponse = '';
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCacheReadTokens = 0;
        let totalCacheCreationTokens = 0;
        const toolExecutionSummary: Array<{ name: string; success: boolean; duration: number }> = [];
        let requestStartTime = Date.now();

        try {
          // Agent loop
          while (iterations < MAX_ITERATIONS) {
            iterations++;
            requestStartTime = Date.now();

            // Get client for this request (supports per-user API keys)
            const anthropic = await getAnthropicClient();

            // Create cached request configuration
            const requestConfig = createCachedRequestConfig({
              systemPrompt: enhancedSystemPrompt,
              tools,
              messages,
              model: modelId,
              maxTokens: lengthConfig.maxTokens,
              thinking: extendedThinking ? {
                type: 'enabled' as const,
                budget_tokens: lengthConfig.thinkingBudget,
              } : undefined,
            });

            // Call Claude with caching enabled
            const response = await anthropic.messages.create(requestConfig);

            // Update cache statistics
            updateCacheStats(response.usage);

            // Accumulate token usage
            if (response.usage) {
              totalInputTokens += response.usage.input_tokens || 0;
              totalOutputTokens += response.usage.output_tokens || 0;

              // Track cache usage if available
              if ('cache_read_input_tokens' in response.usage) {
                totalCacheReadTokens += (response.usage as any).cache_read_input_tokens || 0;
              }
              if ('cache_creation_input_tokens' in response.usage) {
                totalCacheCreationTokens += (response.usage as any).cache_creation_input_tokens || 0;
              }
            }

            // Process response content
            const textBlocks: string[] = [];
            const toolUseBlocks: Anthropic.ToolUseBlock[] = [];

            for (const block of response.content) {
              if (block.type === 'text') {
                textBlocks.push(block.text);
                // Stream text to client
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'text', content: block.text })}\n\n`
                  )
                );
              } else if (block.type === 'tool_use') {
                toolUseBlocks.push(block);
                // Stream tool call to client with parameter summary
                const toolEvent: { type: string; name: string; input?: unknown; paramSummary?: string } = {
                  type: 'tool',
                  name: block.name,
                };
                if (verbose) {
                  toolEvent.input = block.input;
                }
                // Add compact parameter summary for better UX
                toolEvent.paramSummary = summarizeInputForUI(block.input as Record<string, unknown>);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolEvent)}\n\n`));
                toolCallsHistory.push({ name: block.name, input: block.input });
              } else if (block.type === 'thinking') {
                // Stream thinking if in verbose mode
                if (verbose) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'thinking', content: block.thinking })}\n\n`
                    )
                  );
                }
              }
            }

            // Store final text response
            if (textBlocks.length > 0) {
              finalResponse = textBlocks.join('');
            }

            // Early termination checks
            const isComplete =
              response.stop_reason === 'end_turn' ||
              toolUseBlocks.length === 0 ||
              response.stop_reason === 'max_tokens';

            // Quality check: Did we get a reasonable response?
            if (isComplete && textBlocks.length > 0) {
              const responseText = textBlocks.join('');
              const hasSubstantiveContent = responseText.length > 50;

              if (hasSubstantiveContent) {
                // Good response, we can terminate
                console.log('[Chat] Early termination - complete response received');
                break;
              } else if (response.stop_reason === 'max_tokens') {
                // Hit token limit with minimal content, log warning
                console.warn('[Chat] Hit max_tokens with minimal content');
              }
            }

            // No tool calls, we're done
            if (toolUseBlocks.length === 0) {
              break;
            }

            // Execute tool calls and continue loop
            if (toolUseBlocks.length > 0) {
              // Add assistant message to history
              messages.push({
                role: 'assistant',
                content: response.content,
              });

              // Execute each tool and collect results
              const toolResults: Anthropic.ToolResultBlockParam[] = [];

              for (const toolUse of toolUseBlocks) {
                // Parse server and tool name for logging
                const [serverName, ...toolParts] = toolUse.name.split('__');
                const actualToolName = toolParts.join('__');

                // Log the MCP tool call
                logMCPToolCall({
                  serverName,
                  toolName: actualToolName,
                  input: verbose ? (toolUse.input as Record<string, unknown>) : undefined,
                });

                // Measure tool execution time
                const executionStart = Date.now();

                // All tools are MCP tools now
                const result = await executeMCPTool(
                  toolUse.name,
                  toolUse.input as Record<string, unknown>
                );

                const executionTime = Date.now() - executionStart;

                // Log the MCP tool result
                logMCPToolResult({
                  serverName,
                  toolName: actualToolName,
                  success: result.success,
                  duration: executionTime,
                  result: verbose ? result.data : undefined,
                  error: result.error,
                });

                // Track for summary
                toolExecutionSummary.push({
                  name: toolUse.name,
                  success: result.success,
                  duration: executionTime,
                });

                // Record tool usage for analytics
                if (user?.id) {
                  recordToolUsage(
                    toolUse.name,
                    user.id,
                    undefined, // agentId not available in chat route
                    executionTime,
                    result.success
                  ).catch(err => console.error('[Analytics] Failed to record tool usage:', err));
                }

                // Prepare and optimize tool result content
                let toolResultContent = result.success
                  ? JSON.stringify(result.data)
                  : `Error: ${result.error}`;

                // Optimize tool result to reduce token usage
                toolResultContent = optimizeToolResult(toolResultContent);

                // Stream tool result if verbose
                if (verbose) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'tool_result',
                        name: toolUse.name,
                        success: result.success,
                        preview: toolResultContent.slice(0, 500),
                      })}\n\n`
                    )
                  );
                }

                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: toolResultContent,
                  is_error: !result.success,
                });
              }

              // Add tool results to messages
              messages.push({
                role: 'user',
                content: toolResults,
              });
            }
          }

          // Save messages to database if conversationId is provided and user is authenticated
          if (conversationId && user?.id) {
            try {
              // Verify the conversation belongs to the user
              const conversation = await prisma.conversation.findFirst({
                where: { id: conversationId, userId: user.id },
              });

              if (conversation) {
                // Save user message
                await prisma.message.create({
                  data: {
                    conversationId,
                    role: 'user',
                    content: message,
                  },
                });

                // Save assistant response
                const assistantContent = finalResponse || "I've completed the request.";
                await prisma.message.create({
                  data: {
                    conversationId,
                    role: 'assistant',
                    content: assistantContent,
                    toolsUsed: toolCallsHistory.length > 0
                      ? JSON.stringify(toolCallsHistory.map(t => t.name))
                      : null,
                  },
                });

                // Update conversation timestamp
                await prisma.conversation.update({
                  where: { id: conversationId },
                  data: { updatedAt: new Date() },
                });

                console.log('[Chat] Messages saved to conversation:', conversationId);
              }
            } catch (dbError) {
              console.error('[Chat] Failed to save messages:', dbError);
              // Don't fail the request if DB save fails
            }
          }

          // Track token usage for analytics
          if (user?.id && totalInputTokens > 0) {
            try {
              await trackTokenUsage({
                userId: user.id,
                model: modelId,
                usage: {
                  input_tokens: totalInputTokens,
                  output_tokens: totalOutputTokens,
                },
                conversationId,
                agentSlug: undefined,
                toolsUsed: toolCallsHistory.map(t => t.name),
              });
            } catch (trackingError) {
              console.error('[Chat] Failed to track token usage:', trackingError);
              // Don't fail the request if tracking fails
            }
          }

          // Send done event with token usage
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                response: finalResponse || "I've completed the request.",
                toolCalls: toolCallsHistory,
                iterations,
                conversationId,
                tokenUsage: {
                  inputTokens: totalInputTokens,
                  outputTokens: totalOutputTokens,
                  total: totalInputTokens + totalOutputTokens,
                  cacheHits: totalCacheReadTokens,
                  cacheCreated: totalCacheCreationTokens,
                },
              })}\n\n`
            )
          );

          // Log AI response summary
          const totalDuration = Date.now() - requestStartTime;
          logAIResponse({
            model: modelId,
            duration: totalDuration,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            cacheHits: totalCacheReadTokens,
            textLength: finalResponse.length,
            toolCallCount: toolExecutionSummary.length,
          });

          // Log tool execution summary if tools were used
          if (toolExecutionSummary.length > 0) {
            logToolSummary(toolExecutionSummary);
          }

          // Log cache and routing statistics
          logCacheStats('[Chat Cache]');
          logRoutingStats();
        } catch (error) {
          console.error('[Chat] Error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
        } finally {
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
    console.error('[Chat] Route error:', error);
    return Response.json(
      {
        error: 'Chat request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper to check if file is text-based
function isTextFile(file: FileAttachment): boolean {
  const textTypes = [
    'text/',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/typescript',
    'application/x-yaml',
    'application/yaml',
  ];
  const textExtensions = [
    '.md', '.txt', '.json', '.yaml', '.yml', '.xml', '.csv',
    '.js', '.ts', '.tsx', '.jsx', '.html', '.css',
    '.py', '.rb', '.go', '.rs', '.sh', '.bash', '.zsh',
    '.sql', '.graphql', '.toml', '.ini', '.cfg', '.conf', '.env', '.log',
  ];

  if (textTypes.some((t) => file.type.startsWith(t))) return true;

  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return textExtensions.includes(ext);
}
