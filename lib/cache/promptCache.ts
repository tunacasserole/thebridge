/**
 * Anthropic Prompt Caching Implementation
 *
 * Uses Anthropic's native prompt caching feature to cache:
 * - System prompts
 * - Tool definitions
 * - Conversation history (when long)
 *
 * Target: 90%+ cache hit rate for repeated prompts
 *
 * @see https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Cache statistics tracking
 */
interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  tokensFromCache: number;
  tokensSaved: number;
  lastResetAt: Date;
}

// In-memory cache stats (could be persisted to DB in production)
let cacheStats: CacheStats = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  tokensFromCache: 0,
  tokensSaved: 0,
  lastResetAt: new Date(),
};

/**
 * Create a cached system prompt with cache_control block
 * This marks the system prompt for caching by Anthropic
 */
export function createCachedSystemPrompt(
  systemPrompt: string
): Anthropic.Messages.MessageCreateParams['system'] {
  return [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ];
}

/**
 * Create cached tool definitions with cache_control
 * Tools are cached since they rarely change during a conversation
 */
export function createCachedTools(
  tools: Anthropic.Tool[]
): Anthropic.Tool[] | undefined {
  if (tools.length === 0) return undefined;

  // Mark the last tool for caching (caches all tools up to this point)
  const cachedTools = [...tools];
  const lastIndex = cachedTools.length - 1;

  if (lastIndex >= 0) {
    cachedTools[lastIndex] = {
      ...cachedTools[lastIndex],
      cache_control: { type: 'ephemeral' },
    };
  }

  return cachedTools;
}

/**
 * Create cached conversation history
 * Caches conversation history when it gets long (>5 messages)
 */
export function createCachedMessages(
  messages: Anthropic.MessageParam[]
): Anthropic.MessageParam[] {
  // Only cache if we have substantial history
  if (messages.length <= 5) {
    return messages;
  }

  // Cache all messages except the last user message
  const cachedMessages = [...messages];
  const lastIndex = cachedMessages.length - 2; // -2 to cache second-to-last message

  if (lastIndex >= 0 && lastIndex < cachedMessages.length) {
    const message = cachedMessages[lastIndex];

    // Add cache control to the message content
    if (typeof message.content === 'string') {
      cachedMessages[lastIndex] = {
        ...message,
        content: [
          {
            type: 'text',
            text: message.content,
            cache_control: { type: 'ephemeral' },
          },
        ],
      };
    } else if (Array.isArray(message.content)) {
      const contentBlocks = [...message.content];
      const lastContentIndex = contentBlocks.length - 1;

      if (lastContentIndex >= 0 && contentBlocks[lastContentIndex].type === 'text') {
        contentBlocks[lastContentIndex] = {
          ...contentBlocks[lastContentIndex],
          cache_control: { type: 'ephemeral' },
        };

        cachedMessages[lastIndex] = {
          ...message,
          content: contentBlocks,
        };
      }
    }
  }

  return cachedMessages;
}

/**
 * Update cache statistics from API response
 */
export function updateCacheStats(
  usage: Anthropic.Message['usage']
): void {
  cacheStats.totalRequests++;

  // Check if we got cache hits
  const cacheReadTokens = usage.cache_read_input_tokens || 0;
  const cacheCreationTokens = usage.cache_creation_input_tokens || 0;

  if (cacheReadTokens > 0) {
    cacheStats.cacheHits++;
    cacheStats.tokensFromCache += cacheReadTokens;

    // Tokens saved: cache read tokens cost 10% of normal input tokens
    // So reading 1000 tokens from cache saves 900 tokens
    cacheStats.tokensSaved += Math.floor(cacheReadTokens * 0.9);
  } else if (cacheCreationTokens > 0) {
    // Cache miss - we created a cache entry
    cacheStats.cacheMisses++;
  } else {
    // No caching at all
    cacheStats.cacheMisses++;
  }
}

/**
 * Get current cache statistics
 */
export function getCacheStats(): CacheStats & { hitRate: number } {
  const hitRate = cacheStats.totalRequests > 0
    ? (cacheStats.cacheHits / cacheStats.totalRequests) * 100
    : 0;

  return {
    ...cacheStats,
    hitRate,
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  cacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    tokensFromCache: 0,
    tokensSaved: 0,
    lastResetAt: new Date(),
  };
}

/**
 * Log cache statistics
 */
export function logCacheStats(prefix = '[Cache]'): void {
  const stats = getCacheStats();

  console.log(`${prefix} Cache Statistics:`, {
    totalRequests: stats.totalRequests,
    hitRate: `${stats.hitRate.toFixed(1)}%`,
    cacheHits: stats.cacheHits,
    cacheMisses: stats.cacheMisses,
    tokensFromCache: stats.tokensFromCache,
    tokensSaved: stats.tokensSaved,
    savingsRate: stats.tokensFromCache > 0
      ? `${((stats.tokensSaved / stats.tokensFromCache) * 100).toFixed(1)}%`
      : '0%',
  });
}

/**
 * Helper to create a fully cached request configuration
 * Applies caching to system prompt, tools, and messages
 */
export function createCachedRequestConfig(params: {
  systemPrompt: string;
  tools: Anthropic.Tool[];
  messages: Anthropic.MessageParam[];
  model: string;
  maxTokens?: number;
  temperature?: number;
  thinking?: Anthropic.Messages.MessageCreateParams['thinking'];
}): Anthropic.Messages.MessageCreateParams {
  return {
    model: params.model,
    max_tokens: params.maxTokens || 8192,
    temperature: params.temperature,
    system: createCachedSystemPrompt(params.systemPrompt),
    tools: createCachedTools(params.tools),
    messages: createCachedMessages(params.messages),
    thinking: params.thinking,
  };
}
