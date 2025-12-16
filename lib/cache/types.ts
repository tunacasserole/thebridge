/**
 * Cache System Types and Interfaces
 *
 * Multi-level caching architecture for TheBridge:
 * - L1: In-memory (fastest, smallest)
 * - L2: Redis/External (fast, larger) - Future implementation
 * - L3: Database (slowest, persistent)
 */

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  ttl: number; // Time to live in seconds
  createdAt: number; // Unix timestamp in ms
  expiresAt: number; // Unix timestamp in ms
  hits: number; // Number of cache hits
  size?: number; // Approximate size in bytes
  metadata?: Record<string, unknown>;
}

/**
 * Cache level enum
 */
export enum CacheLevel {
  L1 = 'L1', // In-memory
  L2 = 'L2', // Redis (future)
  L3 = 'L3', // Database
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number; // Number of entries
  memoryUsage?: number; // Bytes
  hitRate: number; // Percentage
  tokensSaved?: number; // Estimated tokens saved from cache hits
}

/**
 * Cache analytics entry
 */
export interface CacheAnalytics {
  timestamp: number;
  level: CacheLevel;
  operation: 'hit' | 'miss' | 'set' | 'delete' | 'evict';
  key: string;
  ttl?: number;
  size?: number;
  tokensSaved?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize?: number; // Max entries
  maxMemory?: number; // Max memory in bytes
  defaultTTL?: number; // Default TTL in seconds
  enableAnalytics?: boolean;
  enableCompression?: boolean;
}

/**
 * Response cache entry - for caching LLM responses
 */
export interface ResponseCacheEntry {
  query: string;
  response: string;
  embedding?: number[]; // Query embedding for similarity matching
  model: string;
  systemPrompt?: string;
  tools?: string[]; // Tool names used
  tokenCount?: number;
  conversationContext?: string; // Hash of conversation context
  metadata?: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: unknown;
  };
}

/**
 * Embedding cache entry
 */
export interface EmbeddingCacheEntry {
  text: string;
  embedding: number[];
  model: string;
  hash: string; // SHA-256 hash of text
  tokenCount?: number;
}

/**
 * Cache invalidation strategy
 */
export type InvalidationStrategy =
  | 'ttl' // Time-based expiration
  | 'lru' // Least recently used
  | 'lfu' // Least frequently used
  | 'manual'; // Manual invalidation only

/**
 * Semantic similarity threshold for response matching
 */
export interface SimilarityConfig {
  threshold: number; // 0.0 - 1.0 (cosine similarity)
  maxCandidates?: number; // Max similar entries to check
  enableFuzzyMatch?: boolean; // Enable fuzzy string matching as fallback
}

/**
 * Multi-level cache result
 */
export interface CacheResult<T = unknown> {
  value: T | null;
  hit: boolean;
  level?: CacheLevel;
  age?: number; // Age in ms
  promoted?: boolean; // Was entry promoted to higher level
}

/**
 * Cache promotion/demotion policy
 */
export interface CachePolicy {
  promoteOnHit?: boolean; // Promote to higher level on hit
  promoteThreshold?: number; // Min hits before promotion
  demoteOnExpire?: boolean; // Demote to lower level instead of delete
  demoteAge?: number; // Age in ms before demotion
}
