import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SYSTEM_PROMPT } from '@/lib/prompts';

const execAsync = promisify(exec);

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

// MCP Server configurations (same format as Claude Desktop)
const MCP_SERVERS = {
  metabase: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', '@easecloudio/mcp-metabase-server'],
    env: {
      METABASE_URL: process.env.METABASE_URL || '',
      METABASE_API_KEY: process.env.METABASE_API_KEY || '',
    },
  },
  // Official New Relic MCP (hosted at mcp.newrelic.com)
  // Uses mcp-remote to bridge stdio transport to HTTP
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
  // Slack MCP temporarily disabled - incompatible with Claude Agent SDK
  // Error: "server.connect is not a function"
  // slack: {
  //   type: 'stdio' as const,
  //   command: 'npx',
  //   args: ['-y', '@modelcontextprotocol/server-slack'],
  //   env: {
  //     SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
  //     SLACK_TEAM_ID: process.env.SLACK_TEAM_ID || '',
  //   },
  // },
  // Official Rootly MCP (incident management)
  // Uses uvx (Python) to run rootly-mcp-server package
  rootly: {
    type: 'stdio' as const,
    command: 'uvx',
    args: ['rootly-mcp-server'],
    env: {
      ROOTLY_API_KEY: process.env.ROOTLY_API_KEY || '',
    },
  },
  // GitHub MCP Server
  github: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    },
  },
  // Coralogix MCP for log querying and analysis
  // Using @nickholden/coralogix-mcp-server - tested working with stdio transport
  coralogix: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', '@nickholden/coralogix-mcp-server'],
    env: {
      CORALOGIX_API_KEY: process.env.CORALOGIX_API_KEY || '',
      CORALOGIX_REGION: process.env.CORALOGIX_REGION || 'auto',  // Region for Coralogix API
      CORALOGIX_ENV: 'production',  // Default environment
    },
  },
  // Kubernetes MCP Server for cluster management
  kubernetes: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', 'mcp-server-kubernetes'],
    env: {
      // Expand tilde to home directory, or use default kubeconfig location
      // The MCP server subprocess doesn't expand ~ properly
      KUBECONFIG: process.env.KUBECONFIG?.replace(/^~/, process.env.HOME || '')
        || `${process.env.HOME}/.kube/config`,
      // Pass through AWS config for EKS authentication
      // The kubeconfig uses AWS CLI to get EKS tokens
      AWS_CONFIG_FILE: `${process.env.HOME}/.aws/config`,
      AWS_SHARED_CREDENTIALS_FILE: `${process.env.HOME}/.aws/credentials`,
      // Enable non-destructive mode for safety (optional - remove to allow all operations)
      // ALLOW_ONLY_NON_DESTRUCTIVE_TOOLS: 'true',
    },
  },
  // Atlassian MCP (Jira & Confluence)
  // Provides 51 tools for managing Jira issues, sprints, boards, and Confluence pages
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
  // Prometheus MCP Server for metrics querying and analysis
  // Uses prometheus-mcp npm package (https://github.com/idanfishman/prometheus-mcp)
  prometheus: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['-y', 'prometheus-mcp@latest', 'stdio'],
    env: {
      PROMETHEUS_URL: process.env.PROMETHEUS_URL || '',
      // Optional authentication (uncomment if needed)
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

// Custom programmatic tools for TheBridge SRE use case
const shellCommandTool = tool(
  'ShellCommand',
  'Execute safe shell commands with timeout and output limits. Use for system diagnostics, checking service status, basic file operations, etc.',
  {
    command: z.string().describe('The shell command to execute'),
    timeout: z.number().optional().default(10000).describe('Timeout in milliseconds (max 30000)'),
  },
  async (args) => {
    try {
      // Safety checks
      const dangerousPatterns = [
        /rm\s+-rf/i,
        /:(){ :|:& };:/,  // fork bomb
        /mkfs/i,
        /dd\s+if=/i,
        />\/dev\/sd/i,
        /curl.*\|.*sh/i,
        /wget.*\|.*sh/i,
      ];

      if (dangerousPatterns.some(pattern => pattern.test(args.command))) {
        return {
          content: [{
            type: 'text',
            text: 'ERROR: Command blocked for safety reasons. Dangerous patterns detected.'
          }],
        };
      }

      // Enforce timeout limits
      const timeout = Math.min(args.timeout || 10000, 30000);

      const { stdout, stderr } = await execAsync(args.command, {
        timeout,
        maxBuffer: 1024 * 1024, // 1MB max output
        shell: '/bin/bash',
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            stdout: stdout.slice(0, 10000), // Limit to 10KB
            stderr: stderr.slice(0, 10000),
            command: args.command,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            command: args.command,
          }, null, 2),
        }],
      };
    }
  }
);

const httpRequestTool = tool(
  'HttpRequest',
  'Make HTTP requests to internal APIs or external endpoints. Supports GET, POST, PUT, DELETE methods with headers and body.',
  {
    url: z.string().url().describe('The URL to request'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET').describe('HTTP method'),
    headers: z.record(z.string(), z.string()).optional().describe('Request headers as key-value pairs'),
    body: z.string().optional().describe('Request body (JSON string for POST/PUT)'),
    timeout: z.number().optional().default(10000).describe('Timeout in milliseconds (max 30000)'),
  },
  async (args) => {
    try {
      const timeout = Math.min(args.timeout || 10000, 30000);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        method: args.method,
        headers: {
          'Content-Type': 'application/json',
          ...args.headers,
        },
        signal: controller.signal,
      };

      if (args.body && (args.method === 'POST' || args.method === 'PUT')) {
        fetchOptions.body = args.body;
      }

      const response = await fetch(args.url, fetchOptions);
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data: unknown;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text.slice(0, 10000); // Limit to 10KB
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            url: args.url,
          }, null, 2),
        }],
      };
    }
  }
);

const jsonYamlTool = tool(
  'JsonYamlFormatter',
  'Parse, format, and convert between JSON and YAML. Useful for configuration files, API responses, and data transformation.',
  {
    input: z.string().describe('The JSON or YAML string to process'),
    operation: z.enum(['parse', 'format', 'minify', 'validate']).describe('Operation to perform'),
    outputFormat: z.enum(['json', 'yaml']).optional().describe('Output format (for parse operation)'),
  },
  async (args) => {
    try {
      let result: unknown;

      if (args.operation === 'parse' || args.operation === 'format') {
        // Try parsing as JSON first
        try {
          const parsed = JSON.parse(args.input);
          result = args.outputFormat === 'yaml'
            ? JSON.stringify(parsed, null, 2) // Simple YAML-like format
            : JSON.stringify(parsed, null, 2);
        } catch {
          // If JSON parse fails, treat as already formatted
          result = args.input;
        }
      } else if (args.operation === 'minify') {
        const parsed = JSON.parse(args.input);
        result = JSON.stringify(parsed);
      } else if (args.operation === 'validate') {
        try {
          JSON.parse(args.input);
          result = { valid: true, message: 'Valid JSON' };
        } catch (error) {
          result = {
            valid: false,
            message: error instanceof Error ? error.message : 'Invalid JSON'
          };
        }
      }

      return {
        content: [{
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            operation: args.operation,
          }, null, 2),
        }],
      };
    }
  }
);

// Create SDK MCP Server for custom tools
const customToolsServer = createSdkMcpServer({
  name: 'thebridge-custom-tools',
  version: '1.0.0',
  tools: [shellCommandTool, httpRequestTool, jsonYamlTool],
});

interface ImageAttachment {
  type: 'base64' | 'url';
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  data?: string; // base64 data (without data:image/... prefix)
  url?: string;   // image URL
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  files?: FileAttachment[];
}

// Map tool IDs to their agent SDK tool names
const TOOL_MAP: Record<string, string> = {
  // Core agent tools
  read: 'Read',
  write: 'Write',
  edit: 'Edit',
  glob: 'Glob',
  grep: 'Grep',
  bash: 'Bash',
  websearch: 'WebSearch',
  webfetch: 'WebFetch',
  memory: 'Memory',
  task: 'Task',
  // Custom programmatic tools (handled separately via SDK MCP server)
  shellcommand: 'ShellCommand',
  httprequest: 'HttpRequest',
  jsonyaml: 'JsonYamlFormatter',
};

// Interface for files coming from frontend
interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
  preview?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [], enabledTools = [], extendedThinking = false, effort = 'high', model = 'sonnet', verbose = false, files = [] } = await request.json();

    // Convert enabled tool IDs to SDK tool names (for built-in tools)
    const allowedTools: string[] = (enabledTools as string[])
      .map((id: string) => TOOL_MAP[id])
      .filter(Boolean);

    // Check if any custom tools are enabled
    const customToolIds = ['shellcommand', 'httprequest', 'jsonyaml'];
    const hasCustomTools = (enabledTools as string[]).some(id => customToolIds.includes(id));

    // MCP integrations - only enable if toggled on in the UI AND properly configured
    // Uses stdio transport - same as Claude Desktop
    const mcpServers: Record<string, any> = {};

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

    // Add Metabase MCP server if enabled and configured
    if ((enabledTools as string[]).includes('metabase') && isMcpServerConfigured('metabase')) {
      mcpServers.metabase = MCP_SERVERS.metabase;
    }

    // Add New Relic MCP server if enabled and configured
    if ((enabledTools as string[]).includes('newrelic') && isMcpServerConfigured('newrelic')) {
      mcpServers.newrelic = MCP_SERVERS.newrelic;
    }

    // Slack MCP is temporarily disabled due to compatibility issues with Claude Agent SDK
    // The @modelcontextprotocol/server-slack package doesn't implement the expected interface
    // TODO: Investigate alternative Slack MCP implementations or wait for SDK/package updates

    // Add Rootly MCP server if enabled and configured
    if ((enabledTools as string[]).includes('rootly') && isMcpServerConfigured('rootly')) {
      mcpServers['rootly'] = MCP_SERVERS.rootly;
    }

    // Add GitHub MCP server if enabled and configured
    if ((enabledTools as string[]).includes('github') && isMcpServerConfigured('github')) {
      mcpServers.github = MCP_SERVERS.github;
    }

    // Add Coralogix MCP server if enabled and configured
    if ((enabledTools as string[]).includes('coralogix') && isMcpServerConfigured('coralogix')) {
      mcpServers.coralogix = MCP_SERVERS.coralogix;
    }

    // Add Kubernetes MCP server if enabled (always configured if kubeconfig exists)
    if ((enabledTools as string[]).includes('kubernetes')) {
      mcpServers.kubernetes = MCP_SERVERS.kubernetes;
    }

    // Add Atlassian MCP server if Jira or Confluence is enabled and configured
    // Both use the same MCP server since it provides tools for both products
    if (((enabledTools as string[]).includes('jira') || (enabledTools as string[]).includes('confluence')) && isMcpServerConfigured('atlassian')) {
      mcpServers.atlassian = MCP_SERVERS.atlassian;
    }
    // Add Prometheus MCP server if enabled and configured
    if ((enabledTools as string[]).includes('prometheus') && isMcpServerConfigured('prometheus')) {
      mcpServers.prometheus = MCP_SERVERS.prometheus;
    }


    // Custom tools server temporarily disabled - investigating compatibility issues
    // The createSdkMcpServer may not be compatible with stdio MCP servers
    // if (hasCustomTools) {
    //   mcpServers['thebridge-custom-tools'] = {
    //     type: 'sdk',
    //     name: 'thebridge-custom-tools',
    //     instance: customToolsServer,
    //   };
    // }

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Helper to check if a file is a text-based file
    const isTextFile = (file: FileAttachment): boolean => {
      const textTypes = [
        'text/', 'application/json', 'application/xml', 'application/javascript',
        'application/typescript', 'application/x-yaml', 'application/yaml'
      ];
      const textExtensions = ['.md', '.txt', '.json', '.yaml', '.yml', '.xml', '.csv', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.py', '.rb', '.go', '.rs', '.sh', '.bash', '.zsh', '.sql', '.graphql', '.toml', '.ini', '.cfg', '.conf', '.env', '.log'];

      // Check MIME type
      if (textTypes.some(t => file.type.startsWith(t))) return true;

      // Check file extension
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (textExtensions.includes(ext)) return true;

      // Empty MIME type with text extension
      if (!file.type && textExtensions.includes(ext)) return true;

      return false;
    };

    // Convert text files to readable content
    const convertTextFiles = (fileList: FileAttachment[]): string => {
      const textFiles = fileList.filter(isTextFile);
      if (textFiles.length === 0) return '';

      return textFiles.map(file => {
        try {
          // Decode base64 to text
          const text = Buffer.from(file.data, 'base64').toString('utf-8');
          return `\n\n--- File: ${file.name} ---\n${text}\n--- End of ${file.name} ---`;
        } catch (e) {
          console.error('Error decoding file:', file.name, e);
          return `\n\n--- File: ${file.name} (failed to decode) ---`;
        }
      }).join('\n');
    };

    // Convert file attachments to image attachments for Claude
    const convertFilesToImages = (fileList: FileAttachment[]): ImageAttachment[] => {
      return fileList
        .filter(file => file.type.startsWith('image/'))
        .map(file => {
          // Map MIME type to Claude's supported media types
          let mediaType: ImageAttachment['mediaType'];
          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            mediaType = 'image/jpeg';
          } else if (file.type === 'image/png') {
            mediaType = 'image/png';
          } else if (file.type === 'image/gif') {
            mediaType = 'image/gif';
          } else if (file.type === 'image/webp') {
            mediaType = 'image/webp';
          } else {
            // Default to jpeg for unknown image types
            mediaType = 'image/jpeg';
          }

          return {
            type: 'base64' as const,
            mediaType,
            data: file.data,
          };
        });
    };

    // Convert current message files to images and text
    const currentImages = convertFilesToImages(files as FileAttachment[]);
    const currentTextContent = convertTextFiles(files as FileAttachment[]);

    // Helper function to format images as content blocks for Claude API
    const formatImageAttachments = (imgs: ImageAttachment[]) => {
      return imgs.map((img) => {
        if (img.type === 'base64') {
          return {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: img.mediaType,
              data: img.data || '',
            },
          };
        } else {
          return {
            type: 'image' as const,
            source: {
              type: 'url' as const,
              url: img.url || '',
            },
          };
        }
      });
    };

    // Check if we have images to send (either in current message or conversation history)
    const hasImages = currentImages.length > 0 ||
                      (conversationHistory as ConversationMessage[]).some(msg => msg.files && msg.files.length > 0 && msg.files.some(f => f.type.startsWith('image/')));

    let fullPrompt: string | AsyncIterable<any>;

    if (hasImages) {
      // Use multi-modal message format with images
      async function* generateMessages() {
        // First, send system prompt as initial context
        yield {
          type: 'user' as const,
          message: {
            role: 'user' as const,
            content: SYSTEM_PROMPT,
          },
          parent_tool_use_id: null,
        };

        // Add conversation history
        for (const msg of conversationHistory as ConversationMessage[]) {
          if (msg.role === 'user') {
            const contentBlocks: any[] = [{ type: 'text', text: msg.content }];

            // Add images if present in this message
            if (msg.files && msg.files.length > 0) {
              const msgImages = convertFilesToImages(msg.files);
              if (msgImages.length > 0) {
                contentBlocks.push(...formatImageAttachments(msgImages));
              }
            }

            yield {
              type: 'user' as const,
              message: {
                role: 'user' as const,
                content: contentBlocks,
              },
              parent_tool_use_id: null,
            };
          }
          // Note: Assistant messages are handled automatically by the SDK
        }

        // Add current message with images and text files if present
        const messageWithFiles = currentTextContent
          ? `${message}${currentTextContent}\n\nRespond helpfully and concisely.`
          : `${message}\n\nRespond helpfully and concisely.`;

        const currentContentBlocks: any[] = [
          { type: 'text', text: messageWithFiles }
        ];

        if (currentImages.length > 0) {
          currentContentBlocks.push(...formatImageAttachments(currentImages));
        }

        yield {
          type: 'user' as const,
          message: {
            role: 'user' as const,
            content: currentContentBlocks,
          },
          parent_tool_use_id: null,
        };
      }

      fullPrompt = generateMessages();
    } else {
      // Use simple string prompt when no images are present
      let textPrompt = SYSTEM_PROMPT + '\n\n';

      // Add conversation history
      for (const msg of conversationHistory as ConversationMessage[]) {
        if (msg.role === 'user') {
          textPrompt += `Human: ${msg.content}\n\n`;
        } else if (msg.role === 'assistant') {
          textPrompt += `Assistant: ${msg.content}\n\n`;
        }
      }

      // Add current message with any text file content
      const messageWithFiles = currentTextContent
        ? `${message}${currentTextContent}`
        : message;
      textPrompt += `Human: ${messageWithFiles}\n\nRespond helpfully and concisely.`;
      fullPrompt = textPrompt;
    }

    // Log enabled tools for debugging
    console.log('Raw enabled tools from UI:', enabledTools);
    console.log('Mapped SDK tools:', allowedTools);
    console.log('MCP servers:', Object.keys(mcpServers));
    console.log('Extended thinking:', extendedThinking);
    console.log('Effort level:', effort);
    console.log('Model:', model);
    // Debug auth - log whether API key is present (not the key itself!)
    const hasApiKey = !!ANTHROPIC_API_KEY;
    const apiKeyPrefix = ANTHROPIC_API_KEY?.substring(0, 10) || 'NOT SET';
    console.log(`Auth: ANTHROPIC_API_KEY present=${hasApiKey}, prefix=${apiKeyPrefix}...`);
    console.log(`Auth: CLAUDE_CODE_OAUTH_TOKEN will be cleared in subprocess env`);

    // Map friendly model names to Claude model IDs
    const modelMap: Record<string, string> = {
      sonnet: 'claude-sonnet-4-20250514',
      opus: 'claude-opus-4-20250514',
      haiku: 'claude-3-5-haiku-latest',
    };
    const modelId = modelMap[model] || modelMap.sonnet;
    console.log('Has images:', hasImages);
    console.log('Has text files:', currentTextContent.length > 0);
    if (hasImages) {
      console.log('Image count:', currentImages.length);
    }
    if (currentTextContent) {
      console.log('Text file content length:', currentTextContent.length);
    }

    // Create a streaming response using Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const responseParts: string[] = [];
        const toolCalls: { name: string; input?: unknown }[] = [];

        try {
          for await (const event of query({
            prompt: fullPrompt,
            options: {
              model: modelId,
              maxTurns: 30,
              allowedTools: undefined,
              mcpServers: Object.keys(mcpServers).length > 0 ? mcpServers : undefined,
              cwd: '/Users/ahenderson/dev/thebridge',
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
              ...(extendedThinking && {
                thinkingBudget: 'high',
              }),
              // Effort control (requires Opus 4.5 for full support)
              ...(effort !== 'high' && {
                outputConfig: {
                  effort: effort as 'high' | 'medium' | 'low',
                },
              }),
            },
          })) {
            console.log('Event type:', event.type);

            if (event.type === 'assistant' && event.message?.content) {
              for (const block of event.message.content) {
                if ('text' in block && block.text) {
                  responseParts.push(block.text);
                  // Stream text chunks
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: block.text })}\n\n`));
                }
                // Track and stream tool use
                if ('type' in block && block.type === 'tool_use') {
                  const toolBlock = block as { name?: string; input?: unknown };
                  const toolName = toolBlock.name || 'tool';
                  // Always store full tool call with input for final message
                  const fullToolCall = { name: toolName, input: toolBlock.input };
                  toolCalls.push(fullToolCall);
                  console.log('Tool use:', toolName);
                  // Stream tool call event with input if verbose mode
                  const toolEvent: { type: string; name: string; input?: unknown } = {
                    type: 'tool',
                    name: toolName,
                  };
                  if (verbose && toolBlock.input) {
                    toolEvent.input = toolBlock.input;
                  }
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolEvent)}\n\n`));
                }
              }
            }

            if (event.type === 'result') {
              console.log('Result event received');
            }
          }

          // Send final done event
          const responseText = responseParts.join('').trim();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            response: responseText || "I executed the request but didn't receive any text response.",
            toolCalls: toolCalls
          })}\n\n`));

        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`));
        } finally {
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
    console.error('Agent error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return Response.json(
      {
        error: 'Agent execution failed',
        details: errorMessage,
        fallbackResponse: "I'm experiencing some technical difficulties. Please ensure ANTHROPIC_API_KEY is set and try again."
      },
      { status: 500 }
    );
  }
}
