/**
 * Embedding Cache for Repeated Content
 *
 * Caches text embeddings to avoid redundant API calls.
 * Particularly useful for frequently referenced content.
 */

import { MemoryCache, getMemoryCache } from './memoryCache';
import { EmbeddingCacheEntry } from './types';
import { hashText, estimateTokenCount, generateCacheKey } from './utils';

/**
 * Embedding cache configuration
 */
interface EmbeddingCacheConfig {
  defaultTTL?: number; // TTL in seconds
  maxTextLength?: number; // Max text length to cache
  enableNormalization?: boolean; // Normalize text before hashing
}

/**
 * Embedding cache
 */
export class EmbeddingCache {
  private cache: MemoryCache;
  private config: Required<EmbeddingCacheConfig>;
  private hitCount = 0;
  private missCount = 0;
  private apiCallsSaved = 0;

  constructor(cache?: MemoryCache, config?: EmbeddingCacheConfig) {
    this.cache = cache ?? getMemoryCache();
    this.config = {
      defaultTTL: config?.defaultTTL ?? 7 * 24 * 3600, // 7 days
      maxTextLength: config?.maxTextLength ?? 50000, // ~50k chars
      enableNormalization: config?.enableNormalization ?? true,
    };
  }

  /**
   * Get cached embedding
   */
  get(text: string, model?: string): number[] | null {
    if (text.length > this.config.maxTextLength) {
      console.warn('[EmbeddingCache] Text too long to cache');
      return null;
    }

    const key = this.generateKey(text, model);
    const entry = this.cache.get<EmbeddingCacheEntry>(key);

    if (entry) {
      this.hitCount++;
      this.apiCallsSaved++;
      console.log(`[EmbeddingCache] Hit (saved API call #${this.apiCallsSaved})`);
      return entry.embedding;
    }

    this.missCount++;
    return null;
  }

  /**
   * Cache an embedding
   */
  set(text: string, embedding: number[], model?: string): void {
    if (text.length > this.config.maxTextLength) {
      console.warn('[EmbeddingCache] Text too long to cache');
      return;
    }

    const key = this.generateKey(text, model);
    const hash = hashText(text);
    const tokenCount = estimateTokenCount(text);

    const entry: EmbeddingCacheEntry = {
      text,
      embedding,
      model: model ?? 'unknown',
      hash,
      tokenCount,
    };

    this.cache.set(key, entry, this.config.defaultTTL);
    console.log(`[EmbeddingCache] Cached embedding (${tokenCount} tokens, ${embedding.length}D)`);
  }

  /**
   * Check if embedding exists in cache
   */
  has(text: string, model?: string): boolean {
    if (text.length > this.config.maxTextLength) {
      return false;
    }

    const key = this.generateKey(text, model);
    return this.cache.has(key);
  }

  /**
   * Delete cached embedding
   */
  delete(text: string, model?: string): boolean {
    const key = this.generateKey(text, model);
    return this.cache.delete(key);
  }

  /**
   * Get or create embedding (with callback)
   */
  async getOrCreate(
    text: string,
    model: string,
    createFn: (text: string) => Promise<number[]>
  ): Promise<number[]> {
    // Try to get from cache
    const cached = this.get(text, model);
    if (cached) {
      return cached;
    }

    // Create new embedding
    const embedding = await createFn(text);

    // Cache it
    this.set(text, embedding, model);

    return embedding;
  }

  /**
   * Batch get embeddings
   */
  batchGet(texts: string[], model?: string): Array<number[] | null> {
    return texts.map((text) => this.get(text, model));
  }

  /**
   * Batch set embeddings
   */
  batchSet(entries: Array<{ text: string; embedding: number[] }>, model?: string): void {
    for (const entry of entries) {
      this.set(entry.text, entry.embedding, model);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    const hitRate = this.hitCount + this.missCount > 0
      ? this.hitCount / (this.hitCount + this.missCount)
      : 0;

    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate,
      apiCallsSaved: this.apiCallsSaved,
      cacheSize: cacheStats.size,
      cacheHitRate: cacheStats.hitRate,
      memoryUsage: cacheStats.memoryUsage,
    };
  }

  /**
   * Clear statistics
   */
  clearStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
    this.apiCallsSaved = 0;
  }

  /**
   * Generate cache key
   */
  private generateKey(text: string, model?: string): string {
    const normalizedText = this.config.enableNormalization
      ? this.normalizeText(text)
      : text;

    return generateCacheKey([
      'embedding',
      model ?? 'default',
      hashText(normalizedText),
    ]);
  }

  /**
   * Normalize text for consistent caching
   */
  private normalizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\r\n/g, '\n'); // Normalize line endings
  }
}

/**
 * Common text patterns that should be cached
 */
export const COMMON_CACHE_PATTERNS = {
  // System prompts
  systemPrompts: [
    'You are a helpful AI assistant',
    'You are an expert SRE engineer',
    'You are a software developer',
  ],

  // Common queries
  commonQueries: [
    'What is the current status?',
    'Show me recent incidents',
    'What are the top errors?',
    'Check system health',
  ],

  // Documentation snippets
  documentation: [
    'API documentation',
    'User guide',
    'Troubleshooting guide',
  ],
} as const;

/**
 * Pre-warm cache with common patterns
 */
export async function prewarmEmbeddingCache(
  cache: EmbeddingCache,
  model: string,
  createEmbedding: (text: string) => Promise<number[]>
): Promise<void> {
  console.log('[EmbeddingCache] Pre-warming cache...');

  const allPatterns = [
    ...COMMON_CACHE_PATTERNS.systemPrompts,
    ...COMMON_CACHE_PATTERNS.commonQueries,
    ...COMMON_CACHE_PATTERNS.documentation,
  ];

  for (const pattern of allPatterns) {
    if (!cache.has(pattern, model)) {
      const embedding = await createEmbedding(pattern);
      cache.set(pattern, embedding, model);
    }
  }

  console.log(`[EmbeddingCache] Pre-warmed ${allPatterns.length} patterns`);
}

// Global singleton instance
let globalEmbeddingCache: EmbeddingCache | null = null;

/**
 * Get global embedding cache instance
 */
export function getEmbeddingCache(
  cache?: MemoryCache,
  config?: EmbeddingCacheConfig
): EmbeddingCache {
  if (!globalEmbeddingCache) {
    globalEmbeddingCache = new EmbeddingCache(cache, config);
  }
  return globalEmbeddingCache;
}
