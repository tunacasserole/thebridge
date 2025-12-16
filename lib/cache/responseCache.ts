/**
 * Response Cache with Semantic Similarity Matching
 *
 * Caches LLM responses and uses embeddings to find similar queries.
 * Falls back to fuzzy string matching when embeddings unavailable.
 */

import { MemoryCache, getMemoryCache } from './memoryCache';
import { ResponseCacheEntry, SimilarityConfig } from './types';
import {
  hashText,
  cosineSimilarity,
  fuzzyMatch,
  estimateTokenCount,
  generateCacheKey,
} from './utils';

/**
 * Response TTLs by category (in seconds)
 */
const RESPONSE_TTLS = {
  // Factual queries - longer TTL
  factual: 7 * 24 * 3600, // 7 days
  // Technical queries - medium TTL
  technical: 3 * 24 * 3600, // 3 days
  // Time-sensitive queries - shorter TTL
  timeSensitive: 6 * 3600, // 6 hours
  // Default
  default: 24 * 3600, // 24 hours
} as const;

/**
 * Response cache with semantic similarity
 */
export class ResponseCache {
  private cache: MemoryCache;
  private similarityConfig: Required<SimilarityConfig>;
  private embeddingCache: Map<string, number[]>; // Query hash -> embedding

  constructor(
    cache?: MemoryCache,
    similarityConfig?: SimilarityConfig
  ) {
    this.cache = cache ?? getMemoryCache();
    this.similarityConfig = {
      threshold: similarityConfig?.threshold ?? 0.85,
      maxCandidates: similarityConfig?.maxCandidates ?? 10,
      enableFuzzyMatch: similarityConfig?.enableFuzzyMatch ?? true,
    };
    this.embeddingCache = new Map();
  }

  /**
   * Get cached response for query
   */
  async get(
    query: string,
    context?: {
      model?: string;
      systemPrompt?: string;
      tools?: string[];
    }
  ): Promise<ResponseCacheEntry | null> {
    // Try exact match first
    const exactKey = this.generateKey(query, context);
    const exactMatch = this.cache.get<ResponseCacheEntry>(exactKey);

    if (exactMatch) {
      console.log('[ResponseCache] Exact match found');
      return exactMatch;
    }

    // Try semantic similarity match
    const similarMatch = await this.findSimilar(query, context);
    if (similarMatch) {
      console.log('[ResponseCache] Similar match found');
      return similarMatch;
    }

    return null;
  }

  /**
   * Cache a response
   */
  set(
    query: string,
    response: string,
    context?: {
      model?: string;
      systemPrompt?: string;
      tools?: string[];
      embedding?: number[];
      conversationContext?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    const key = this.generateKey(query, context);
    const tokenCount = estimateTokenCount(response);

    const entry: ResponseCacheEntry = {
      query,
      response,
      model: context?.model ?? 'unknown',
      systemPrompt: context?.systemPrompt,
      tools: context?.tools,
      embedding: context?.embedding,
      tokenCount,
      conversationContext: context?.conversationContext,
      metadata: context?.metadata,
    };

    // Store embedding for similarity matching
    if (context?.embedding) {
      const queryHash = hashText(query);
      this.embeddingCache.set(queryHash, context.embedding);
    }

    // Determine TTL based on query type
    const ttl = this.determineTTL(query);

    this.cache.set(key, entry, ttl);
    console.log(`[ResponseCache] Cached response (${tokenCount} tokens, TTL: ${ttl}s)`);
  }

  /**
   * Find similar cached response
   */
  private async findSimilar(
    query: string,
    context?: {
      model?: string;
      systemPrompt?: string;
      tools?: string[];
    }
  ): Promise<ResponseCacheEntry | null> {
    const queryHash = hashText(query);
    const queryEmbedding = this.embeddingCache.get(queryHash);

    // Get all cached responses for this context
    const candidates = this.getCandidates(context);

    if (candidates.length === 0) {
      return null;
    }

    let bestMatch: ResponseCacheEntry | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      let score = 0;

      // Try embedding similarity first
      if (queryEmbedding && candidate.embedding) {
        score = cosineSimilarity(queryEmbedding, candidate.embedding);
      }
      // Fall back to fuzzy string matching
      else if (this.similarityConfig.enableFuzzyMatch) {
        // Normalize and compare queries
        score = this.calculateTextSimilarity(query, candidate.query);
      }

      if (score > bestScore && score >= this.similarityConfig.threshold) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (bestMatch) {
      console.log(`[ResponseCache] Found similar match (score: ${bestScore.toFixed(3)})`);
    }

    return bestMatch;
  }

  /**
   * Get candidate responses to check for similarity
   */
  private getCandidates(context?: {
    model?: string;
    systemPrompt?: string;
    tools?: string[];
  }): ResponseCacheEntry[] {
    const allEntries = this.cache.getEntries();
    const candidates: ResponseCacheEntry[] = [];

    for (const entry of allEntries) {
      const response = entry.value as ResponseCacheEntry;

      // Filter by context if provided
      if (context?.model && response.model !== context.model) {
        continue;
      }

      if (context?.systemPrompt && response.systemPrompt !== context.systemPrompt) {
        continue;
      }

      // Check tool compatibility
      if (context?.tools && response.tools) {
        const toolsMatch = this.toolsMatch(context.tools, response.tools);
        if (!toolsMatch) continue;
      }

      candidates.push(response);

      // Limit candidates for performance
      if (candidates.length >= this.similarityConfig.maxCandidates) {
        break;
      }
    }

    return candidates;
  }

  /**
   * Check if tool sets match
   */
  private toolsMatch(tools1: string[], tools2: string[]): boolean {
    if (tools1.length !== tools2.length) return false;

    const set1 = new Set(tools1);
    const set2 = new Set(tools2);

    for (const tool of set1) {
      if (!set2.has(tool)) return false;
    }

    return true;
  }

  /**
   * Calculate text similarity (fallback)
   */
  private calculateTextSimilarity(query1: string, query2: string): number {
    // Use fuzzy match with threshold 0.7
    if (fuzzyMatch(query1, query2, 0.7)) {
      // Return normalized similarity score
      const maxLen = Math.max(query1.length, query2.length);
      const minLen = Math.min(query1.length, query2.length);
      return minLen / maxLen;
    }
    return 0;
  }

  /**
   * Determine TTL based on query characteristics
   */
  private determineTTL(query: string): number {
    const lowerQuery = query.toLowerCase();

    // Time-sensitive keywords
    const timeSensitiveKeywords = [
      'today',
      'now',
      'current',
      'latest',
      'recent',
      'this week',
      'this month',
    ];

    if (timeSensitiveKeywords.some((kw) => lowerQuery.includes(kw))) {
      return RESPONSE_TTLS.timeSensitive;
    }

    // Technical/factual keywords
    const technicalKeywords = [
      'how to',
      'what is',
      'explain',
      'debug',
      'error',
      'troubleshoot',
    ];

    if (technicalKeywords.some((kw) => lowerQuery.includes(kw))) {
      return RESPONSE_TTLS.technical;
    }

    // Factual queries
    const factualKeywords = [
      'documentation',
      'api',
      'reference',
      'guide',
      'tutorial',
    ];

    if (factualKeywords.some((kw) => lowerQuery.includes(kw))) {
      return RESPONSE_TTLS.factual;
    }

    return RESPONSE_TTLS.default;
  }

  /**
   * Generate cache key
   */
  private generateKey(
    query: string,
    context?: {
      model?: string;
      systemPrompt?: string;
      tools?: string[];
    }
  ): string {
    const components = [
      'response',
      hashText(query),
      context?.model ?? 'default',
    ];

    if (context?.systemPrompt) {
      components.push(hashText(context.systemPrompt));
    }

    if (context?.tools && context.tools.length > 0) {
      components.push(hashText(context.tools.sort().join(',')));
    }

    return generateCacheKey(components);
  }

  /**
   * Clear all cached responses
   */
  clear(): void {
    this.embeddingCache.clear();
    // Note: We can't clear just responses from shared cache
    // This would be improved with namespaced keys
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      cacheStats: this.cache.getStats(),
      embeddingsCached: this.embeddingCache.size,
      similarityThreshold: this.similarityConfig.threshold,
    };
  }
}

// Global singleton instance
let globalResponseCache: ResponseCache | null = null;

/**
 * Get global response cache instance
 */
export function getResponseCache(
  cache?: MemoryCache,
  similarityConfig?: SimilarityConfig
): ResponseCache {
  if (!globalResponseCache) {
    globalResponseCache = new ResponseCache(cache, similarityConfig);
  }
  return globalResponseCache;
}
