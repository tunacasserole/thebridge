/**
 * Chat API Route - Serverless Compatible
 *
 * Uses standard @anthropic-ai/sdk with custom agent loop.
 * Compatible with Vercel serverless deployment.
 * Supports per-user API keys via authentication.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { ALL_TOOLS, TOOL_CATEGORIES, executeTool } from '@/lib/tools';
import { getAuthenticatedUser, getUserApiKey } from '@/lib/auth';

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
    } = await request.json();

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get model ID
    const modelId = MODEL_MAP[model] || MODEL_MAP.sonnet;

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

    // Expand category IDs (e.g., 'jira') to actual tool names (e.g., 'jira_create_story')
    // This maps sidebar MCP toggles to their corresponding tools
    const expandedToolNames = new Set<string>();
    for (const id of enabledTools) {
      // Check if this is a category ID that maps to multiple tools
      const categoryTools = TOOL_CATEGORIES[id as keyof typeof TOOL_CATEGORIES];
      if (categoryTools) {
        categoryTools.forEach((toolName: string) => expandedToolNames.add(toolName));
      } else {
        // Direct tool name
        expandedToolNames.add(id);
      }
    }

    // Filter tools if specific ones enabled
    const tools = expandedToolNames.size > 0
      ? ALL_TOOLS.filter((t) => expandedToolNames.has(t.name))
      : ALL_TOOLS;

    console.log('[Chat] Starting agent loop with model:', modelId);
    console.log('[Chat] Tools enabled:', tools.map((t) => t.name).join(', '));
    console.log('[Chat] Extended thinking:', extendedThinking);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const toolCallsHistory: { name: string; input?: unknown }[] = [];
        let iterations = 0;
        let finalResponse = '';

        try {
          // Agent loop
          while (iterations < MAX_ITERATIONS) {
            iterations++;
            console.log(`[Chat] Iteration ${iterations}`);

            // Get client for this request (supports per-user API keys)
            const anthropic = await getAnthropicClient();

            // Call Claude
            const response = await anthropic.messages.create({
              model: modelId,
              max_tokens: 8192,
              system: SYSTEM_PROMPT,
              tools: tools.length > 0 ? tools : undefined,
              messages,
              ...(extendedThinking && {
                thinking: {
                  type: 'enabled',
                  budget_tokens: 10000,
                },
              }),
            });

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
                // Stream tool call to client
                const toolEvent: { type: string; name: string; input?: unknown } = {
                  type: 'tool',
                  name: block.name,
                };
                if (verbose) {
                  toolEvent.input = block.input;
                }
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

            // Check stop reason
            if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
              // No tool calls, we're done
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
                console.log(`[Chat] Executing tool: ${toolUse.name}`);
                const result = await executeTool(
                  toolUse.name,
                  toolUse.input as Record<string, unknown>
                );

                // Stream tool result if verbose
                if (verbose) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'tool_result',
                        name: toolUse.name,
                        success: result.success,
                        preview: result.success
                          ? JSON.stringify(result.data).slice(0, 500)
                          : result.error,
                      })}\n\n`
                    )
                  );
                }

                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: result.success
                    ? JSON.stringify(result.data)
                    : `Error: ${result.error}`,
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

          // Send done event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                response: finalResponse || "I've completed the request.",
                toolCalls: toolCallsHistory,
                iterations,
              })}\n\n`
            )
          );
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
