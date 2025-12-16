/**
 * Token optimization utilities to reduce API costs
 * Optimizes tool results and other large content before sending to Claude
 */

import { countTextTokens } from './counter';

// Maximum tokens for tool results before truncation
const MAX_TOOL_RESULT_TOKENS = 4000;

// Maximum tokens for thinking blocks in responses
const MAX_THINKING_TOKENS = 2000;

/**
 * Optimize tool result to reduce token usage
 * Truncates long results with a summary
 */
export function optimizeToolResult(result: string): string {
  const tokens = countTextTokens(result);

  if (tokens <= MAX_TOOL_RESULT_TOKENS) {
    return result;
  }

  // Truncate to max tokens (roughly)
  const maxChars = MAX_TOOL_RESULT_TOKENS * 4;
  const truncated = result.slice(0, maxChars);

  return `${truncated}\n\n[Truncated: Original ${tokens} tokens → ${MAX_TOOL_RESULT_TOKENS} tokens to reduce API costs]`;
}

/**
 * Optimize thinking blocks in verbose mode
 */
export function optimizeThinking(thinking: string): string {
  const tokens = countTextTokens(thinking);

  if (tokens <= MAX_THINKING_TOKENS) {
    return thinking;
  }

  // Truncate thinking to max tokens
  const maxChars = MAX_THINKING_TOKENS * 4;
  const truncated = thinking.slice(0, maxChars);

  return `${truncated}\n\n[Thinking truncated for brevity]`;
}

/**
 * Optimize conversation history by removing old messages if too long
 * Keeps recent messages and system context
 */
export function optimizeConversationHistory(
  messages: Array<{ role: string; content: string | unknown[] }>,
  maxTokens: number = 100000
): Array<{ role: string; content: string | unknown[] }> {
  // Calculate current token count
  let totalTokens = 0;
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      totalTokens += countTextTokens(msg.content);
    } else if (Array.isArray(msg.content)) {
      totalTokens += (msg.content as unknown[]).reduce<number>((sum, block) => {
        if (typeof block === 'string') return sum + countTextTokens(block);
        if (block && typeof block === 'object' && 'text' in block) {
          return sum + countTextTokens((block as { text: string }).text);
        }
        return sum;
      }, 0);
    }
  }

  // If under limit, return as-is
  if (totalTokens <= maxTokens) {
    return messages;
  }

  // Keep most recent messages that fit within limit
  const optimized: typeof messages = [];
  let currentTokens = 0;

  // Process messages in reverse (most recent first)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    let msgTokens = 0;

    if (typeof msg.content === 'string') {
      msgTokens = countTextTokens(msg.content);
    } else if (Array.isArray(msg.content)) {
      msgTokens = (msg.content as unknown[]).reduce<number>((sum, block) => {
        if (typeof block === 'string') return sum + countTextTokens(block);
        if (block && typeof block === 'object' && 'text' in block) {
          return sum + countTextTokens((block as { text: string }).text);
        }
        return sum;
      }, 0);
    }

    if (currentTokens + msgTokens <= maxTokens) {
      optimized.unshift(msg);
      currentTokens += msgTokens;
    } else {
      break;
    }
  }

  return optimized;
}

/**
 * Optimize JSON data for tool results
 * Removes unnecessary whitespace and truncates large arrays/objects
 */
export function optimizeJSON(data: unknown, maxTokens: number = 2000): string {
  try {
    const json = JSON.stringify(data);
    const tokens = countTextTokens(json);

    if (tokens <= maxTokens) {
      return json;
    }

    // Truncate to max size
    const maxChars = maxTokens * 4;
    const truncated = json.slice(0, maxChars);

    return `${truncated}... [JSON truncated: ${tokens} → ${maxTokens} tokens]`;
  } catch (error) {
    return String(data);
  }
}
