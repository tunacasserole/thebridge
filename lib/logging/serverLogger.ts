/**
 * Server Logging - Formatted logging for AI and MCP calls
 *
 * Provides pretty-printed, structured logging for:
 * - AI API calls (Claude)
 * - MCP tool executions
 * - Request/response details
 * - Performance metrics
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// Symbols for visual clarity
const symbols = {
  ai: '🤖',
  mcp: '🔧',
  request: '→',
  response: '←',
  success: '✓',
  error: '✗',
  tool: '⚙️',
  time: '⏱️',
  tokens: '📊',
  cache: '💾',
};

interface LogOptions {
  /** Enable detailed request/response logging */
  verbose?: boolean;
  /** Maximum length for truncating large values */
  maxLength?: number;
}

const defaultOptions: LogOptions = {
  verbose: process.env.LOG_VERBOSE === 'true',
  maxLength: 500,
};

/**
 * Format a timestamp for logging
 */
function timestamp(): string {
  return new Date().toISOString().split('T')[1].slice(0, 12);
}

/**
 * Truncate and format a value for display
 */
function formatValue(value: unknown, maxLength: number = 500): string {
  if (value === undefined || value === null) return 'null';

  let str: string;
  if (typeof value === 'string') {
    str = value;
  } else {
    try {
      str = JSON.stringify(value, null, 2);
    } catch {
      str = String(value);
    }
  }

  if (str.length > maxLength) {
    return str.slice(0, maxLength) + `... (${str.length - maxLength} more chars)`;
  }
  return str;
}

/**
 * Format a duration in milliseconds
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Create a divider line
 */
function divider(char: string = '─', length: number = 60): string {
  return colors.dim + char.repeat(length) + colors.reset;
}

/**
 * Log the start of an AI API call
 */
export function logAIRequest(params: {
  model: string;
  messageCount: number;
  toolCount: number;
  hasThinking?: boolean;
  maxTokens?: number;
  conversationId?: string;
}): void {
  const { model, messageCount, toolCount, hasThinking, maxTokens, conversationId } = params;

  console.log('');
  console.log(divider('═'));
  console.log(
    `${colors.cyan}${symbols.ai} AI REQUEST ${colors.reset}` +
    `${colors.gray}[${timestamp()}]${colors.reset}`
  );
  console.log(divider());
  console.log(`${colors.bright}Model:${colors.reset}          ${model}`);
  console.log(`${colors.bright}Messages:${colors.reset}       ${messageCount}`);
  console.log(`${colors.bright}Tools:${colors.reset}          ${toolCount} available`);
  if (hasThinking) {
    console.log(`${colors.bright}Extended:${colors.reset}       thinking enabled`);
  }
  if (maxTokens) {
    console.log(`${colors.bright}Max Tokens:${colors.reset}     ${maxTokens}`);
  }
  if (conversationId) {
    console.log(`${colors.bright}Conversation:${colors.reset}   ${conversationId.slice(0, 8)}...`);
  }
  console.log(divider());
}

/**
 * Log an AI API response
 */
export function logAIResponse(params: {
  model: string;
  duration: number;
  inputTokens: number;
  outputTokens: number;
  cacheHits?: number;
  stopReason?: string;
  textLength?: number;
  toolCallCount?: number;
}): void {
  const {
    model,
    duration,
    inputTokens,
    outputTokens,
    cacheHits,
    stopReason,
    textLength,
    toolCallCount,
  } = params;

  const totalTokens = inputTokens + outputTokens;

  console.log('');
  console.log(
    `${colors.green}${symbols.response} AI RESPONSE ${colors.reset}` +
    `${colors.gray}[${formatDuration(duration)}]${colors.reset}`
  );
  console.log(divider());
  console.log(`${colors.bright}${symbols.tokens} Tokens:${colors.reset}`);
  console.log(`   Input:        ${inputTokens.toLocaleString()}`);
  console.log(`   Output:       ${outputTokens.toLocaleString()}`);
  console.log(`   Total:        ${totalTokens.toLocaleString()}`);
  if (cacheHits && cacheHits > 0) {
    console.log(`   ${colors.green}Cache Hits:    ${cacheHits.toLocaleString()}${colors.reset}`);
  }
  console.log('');
  console.log(`${colors.bright}${symbols.time} Performance:${colors.reset}`);
  console.log(`   Duration:     ${formatDuration(duration)}`);
  console.log(`   Stop Reason:  ${stopReason || 'end_turn'}`);
  if (textLength !== undefined) {
    console.log(`   Response:     ${textLength} chars`);
  }
  if (toolCallCount !== undefined && toolCallCount > 0) {
    console.log(`   Tool Calls:   ${toolCallCount}`);
  }
  console.log(divider('═'));
  console.log('');
}

/**
 * Log an MCP tool execution
 */
export function logMCPToolCall(params: {
  serverName: string;
  toolName: string;
  input?: Record<string, unknown>;
  options?: LogOptions;
}): void {
  const { serverName, toolName, input, options = {} } = params;
  const opts = { ...defaultOptions, ...options };

  console.log('');
  console.log(
    `${colors.magenta}${symbols.mcp} MCP TOOL CALL ${colors.reset}` +
    `${colors.gray}[${timestamp()}]${colors.reset}`
  );
  console.log(divider());
  console.log(`${colors.bright}Server:${colors.reset}    ${serverName}`);
  console.log(`${colors.bright}Tool:${colors.reset}      ${toolName}`);

  if (opts.verbose && input && Object.keys(input).length > 0) {
    console.log(`${colors.bright}Input:${colors.reset}`);
    console.log(colors.gray + formatValue(input, opts.maxLength) + colors.reset);
  }
  console.log(divider());
}

/**
 * Log an MCP tool result
 */
export function logMCPToolResult(params: {
  serverName: string;
  toolName: string;
  success: boolean;
  duration: number;
  result?: unknown;
  error?: string;
  options?: LogOptions;
}): void {
  const { serverName, toolName, success, duration, result, error, options = {} } = params;
  const opts = { ...defaultOptions, ...options };

  const statusColor = success ? colors.green : colors.red;
  const statusSymbol = success ? symbols.success : symbols.error;
  const status = success ? 'SUCCESS' : 'FAILED';

  console.log('');
  console.log(
    `${statusColor}${statusSymbol} MCP TOOL ${status} ${colors.reset}` +
    `${colors.gray}[${formatDuration(duration)}]${colors.reset}`
  );
  console.log(divider());
  console.log(`${colors.bright}Server:${colors.reset}    ${serverName}`);
  console.log(`${colors.bright}Tool:${colors.reset}      ${toolName}`);
  console.log(`${colors.bright}Duration:${colors.reset}  ${formatDuration(duration)}`);

  if (error) {
    console.log(`${colors.red}${colors.bright}Error:${colors.reset}${colors.red}     ${error}${colors.reset}`);
  }

  if (opts.verbose && result !== undefined) {
    console.log(`${colors.bright}Result:${colors.reset}`);
    console.log(colors.gray + formatValue(result, opts.maxLength) + colors.reset);
  }
  console.log(divider());
}

/**
 * Log a batch of tool calls in a summary format
 */
export function logToolSummary(tools: Array<{
  name: string;
  success: boolean;
  duration: number;
}>): void {
  if (tools.length === 0) return;

  console.log('');
  console.log(
    `${colors.blue}${symbols.tool} TOOL SUMMARY ${colors.reset}` +
    `${colors.gray}[${tools.length} tools]${colors.reset}`
  );
  console.log(divider());

  for (const tool of tools) {
    const statusColor = tool.success ? colors.green : colors.red;
    const statusSymbol = tool.success ? symbols.success : symbols.error;
    const [server, ...nameParts] = tool.name.split('__');
    const toolName = nameParts.join('__');

    console.log(
      `  ${statusColor}${statusSymbol}${colors.reset} ` +
      `${colors.bright}${server}${colors.reset}/${toolName} ` +
      `${colors.gray}(${formatDuration(tool.duration)})${colors.reset}`
    );
  }

  const totalDuration = tools.reduce((acc, t) => acc + t.duration, 0);
  const successCount = tools.filter(t => t.success).length;

  console.log(divider());
  console.log(
    `  Total: ${successCount}/${tools.length} successful, ` +
    `${formatDuration(totalDuration)} total`
  );
  console.log(divider('═'));
  console.log('');
}

/**
 * Log MCP server connection status
 */
export function logMCPConnection(params: {
  serverName: string;
  status: 'connecting' | 'connected' | 'failed' | 'disconnected';
  url?: string;
  transport?: string;
  error?: string;
}): void {
  const { serverName, status, url, transport, error } = params;

  let statusColor: string;
  let statusSymbol: string;

  switch (status) {
    case 'connecting':
      statusColor = colors.yellow;
      statusSymbol = '⟳';
      break;
    case 'connected':
      statusColor = colors.green;
      statusSymbol = symbols.success;
      break;
    case 'failed':
      statusColor = colors.red;
      statusSymbol = symbols.error;
      break;
    case 'disconnected':
      statusColor = colors.gray;
      statusSymbol = '○';
      break;
  }

  console.log(
    `${statusColor}${statusSymbol} [MCP:${serverName}] ${status.toUpperCase()}${colors.reset}` +
    (transport ? ` ${colors.gray}(${transport})${colors.reset}` : '') +
    (url ? ` ${colors.dim}${url.slice(0, 50)}${colors.reset}` : '') +
    (error ? ` ${colors.red}${error}${colors.reset}` : '')
  );
}

/**
 * Log chat iteration progress
 */
export function logIteration(params: {
  iteration: number;
  maxIterations: number;
  hasToolCalls: boolean;
  toolCount?: number;
}): void {
  const { iteration, maxIterations, hasToolCalls, toolCount } = params;

  const progress = `[${iteration}/${maxIterations}]`;
  const toolInfo = hasToolCalls
    ? ` ${colors.yellow}→ ${toolCount} tool call${toolCount !== 1 ? 's' : ''}${colors.reset}`
    : '';

  console.log(
    `${colors.cyan}${symbols.ai}${colors.reset} ` +
    `${colors.bright}Iteration ${progress}${colors.reset}${toolInfo}`
  );
}

/**
 * Log model routing decision
 */
export function logModelRouting(params: {
  requested: string;
  routed: string;
  reason: string;
  costSavings?: string;
}): void {
  const { requested, routed, reason, costSavings } = params;
  const wasRouted = requested !== routed;

  console.log(
    `${colors.blue}⟡${colors.reset} ` +
    `${colors.bright}Model:${colors.reset} ${routed}` +
    (wasRouted ? ` ${colors.gray}(requested: ${requested})${colors.reset}` : '') +
    ` ${colors.dim}[${reason}]${colors.reset}` +
    (costSavings ? ` ${colors.green}${costSavings}${colors.reset}` : '')
  );
}

/**
 * Create a logger instance with preset options
 */
export function createLogger(options: LogOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  return {
    aiRequest: (params: Parameters<typeof logAIRequest>[0]) => logAIRequest(params),
    aiResponse: (params: Parameters<typeof logAIResponse>[0]) => logAIResponse(params),
    mcpToolCall: (params: Omit<Parameters<typeof logMCPToolCall>[0], 'options'>) =>
      logMCPToolCall({ ...params, options: opts }),
    mcpToolResult: (params: Omit<Parameters<typeof logMCPToolResult>[0], 'options'>) =>
      logMCPToolResult({ ...params, options: opts }),
    toolSummary: logToolSummary,
    mcpConnection: logMCPConnection,
    iteration: logIteration,
    modelRouting: logModelRouting,
  };
}

// Default logger instance
export const serverLogger = createLogger();
