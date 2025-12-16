/**
 * Token Counter - Accurate token estimation for Claude models
 *
 * Uses Claude's tokenization rules:
 * - ~3.5 characters per token for English text
 * - ~1.5 characters per token for code
 * - JSON structure overhead
 */

export interface TokenCount {
  total: number;
  text: number;
  images: number;
  tools: number;
  overhead: number;
}

/**
 * Count tokens in a text string
 * Uses empirical Claude tokenization ratios
 */
export function countTextTokens(text: string): number {
  if (!text) return 0;

  // Detect if text is primarily code (high ratio of special chars)
  const codeIndicators = /[{}[\]();=<>]/g;
  const codeChars = (text.match(codeIndicators) || []).length;
  const isCode = codeChars / text.length > 0.15;

  // Use different ratios for code vs prose
  const charsPerToken = isCode ? 1.5 : 3.5;

  return Math.ceil(text.length / charsPerToken);
}

/**
 * Count tokens in an image
 * Claude charges ~1600 tokens per image (varies by size)
 */
export function countImageTokens(imageCount: number): number {
  return imageCount * 1600;
}

/**
 * Count tokens in tool definitions
 * Each tool adds ~50-200 tokens depending on complexity
 */
export function countToolTokens(tools: unknown[]): number {
  if (!tools || tools.length === 0) return 0;

  // Estimate based on tool complexity
  let total = 0;
  for (const tool of tools) {
    const toolJson = JSON.stringify(tool);
    // Tools have JSON structure overhead
    total += Math.ceil(toolJson.length / 2.5);
  }

  return total;
}

/**
 * Count tokens in a message
 */
export function countMessageTokens(message: {
  role: string;
  content: string | unknown[];
}): number {
  let tokens = 0;

  // Role overhead
  tokens += 4;

  if (typeof message.content === 'string') {
    tokens += countTextTokens(message.content);
  } else if (Array.isArray(message.content)) {
    for (const block of message.content) {
      if (typeof block === 'object' && block !== null) {
        const blockObj = block as { type?: string; text?: string };
        if (blockObj.type === 'text' && blockObj.text) {
          tokens += countTextTokens(blockObj.text);
        } else if (blockObj.type === 'image') {
          tokens += 1600;
        } else if (blockObj.type === 'tool_result') {
          // Tool results have overhead
          const resultStr = JSON.stringify(block);
          tokens += Math.ceil(resultStr.length / 2.0);
        }
      }
    }
  }

  return tokens;
}

/**
 * Count total tokens in a conversation
 */
export function countConversationTokens(
  messages: { role: string; content: string | unknown[] }[],
  tools?: unknown[],
  systemPrompt?: string
): TokenCount {
  let textTokens = 0;
  let imageTokens = 0;

  // System prompt
  if (systemPrompt) {
    textTokens += countTextTokens(systemPrompt);
  }

  // Messages
  for (const msg of messages) {
    const msgTokens = countMessageTokens(msg);
    textTokens += msgTokens;
  }

  // Tools
  const toolTokens = tools ? countToolTokens(tools) : 0;

  // Overhead (JSON structure, formatting)
  const overhead = Math.ceil((textTokens + imageTokens + toolTokens) * 0.05);

  return {
    total: textTokens + imageTokens + toolTokens + overhead,
    text: textTokens,
    images: imageTokens,
    tools: toolTokens,
    overhead,
  };
}

/**
 * Estimate cost in USD for token usage
 * Claude Sonnet 4 pricing (as of 2024-12)
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_1M = 3.00; // $3 per 1M input tokens
  const OUTPUT_COST_PER_1M = 15.00; // $15 per 1M output tokens

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;

  return inputCost + outputCost;
}
