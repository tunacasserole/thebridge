/**
 * L1 In-Memory Cache with LRU Eviction
 *
 * Fast, ephemeral cache stored in Node.js memory.
 * Uses Least Recently Used (LRU) eviction policy.
 */

import {
  CacheEntry,
  CacheStats,
  CacheConfig,
  CacheLevel,
  CacheAnalytics,
} from './types';
import { isExpired, calculateExpiresAt, estimateSize } from './utils';

/**
 * LRU node for doubly linked list
 */
class LRUNode<T> {
  key: string;
  entry: CacheEntry<T>;
  prev: LRUNode<T> | null = null;
  next: LRUNode<T> | null = null;

  constructor(key: string, entry: CacheEntry<T>) {
    this.key = key;
    this.entry = entry;
  }
}

/**
 * In-Memory Cache with LRU eviction
 */
export class MemoryCache {
  private cache: Map<string, LRUNode<unknown>>;
  private head: LRUNode<unknown> | null = null; // Most recently used
  private tail: LRUNode<unknown> | null = null; // Least recently used
  private config: Required<CacheConfig>;
  private stats: CacheStats;
  private analytics: CacheAnalytics[] = [];

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.config = {
      maxSize: config.maxSize ?? 1000,
      maxMemory: config.maxMemory ?? 100 * 1024 * 1024, // 100MB default
      defaultTTL: config.defaultTTL ?? 3600, // 1 hour default
      enableAnalytics: config.enableAnalytics ?? true,
      enableCompression: config.enableCompression ?? false,
    };
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0,
      tokensSaved: 0,
    };
  }

  /**
   * Get value from cache
   */
  get<T = unknown>(key: string): T | null {
    const node = this.cache.get(key);

    if (!node) {
      this.stats.misses++;
      this.updateHitRate();
      this.trackAnalytics('miss', key);
      return null;
    }

    // Check expiration
    if (isExpired(node.entry.expiresAt)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      this.trackAnalytics('miss', key);
      return null;
    }

    // Update hit count and move to front
    node.entry.hits++;
    this.stats.hits++;
    this.moveToFront(node);
    this.updateHitRate();

    // Track analytics
    const tokensSaved = this.estimateTokensSaved(node.entry.value);
    if (tokensSaved > 0) {
      this.stats.tokensSaved = (this.stats.tokensSaved || 0) + tokensSaved;
    }

    this.trackAnalytics('hit', key, undefined, undefined, tokensSaved);

    return node.entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T = unknown>(key: string, value: T, ttl?: number): void {
    const ttlSeconds = ttl ?? this.config.defaultTTL;
    const size = estimateSize(value);

    // Check memory limit
    if (size > this.config.maxMemory) {
      console.warn(`[MemoryCache] Value too large: ${size} bytes`);
      return;
    }

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Evict if necessary
    while (
      this.cache.size >= this.config.maxSize ||
      (this.stats.memoryUsage || 0) + size > this.config.maxMemory
    ) {
      this.evictLRU();
    }

    // Create new entry
    const entry: CacheEntry<T> = {
      key,
      value,
      ttl: ttlSeconds,
      createdAt: Date.now(),
      expiresAt: calculateExpiresAt(ttlSeconds),
      hits: 0,
      size,
    };

    const node = new LRUNode(key, entry);

    // Add to cache and move to front
    this.cache.set(key, node);
    this.addToFront(node);

    // Update stats
    this.stats.sets++;
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = (this.stats.memoryUsage || 0) + size;

    this.trackAnalytics('set', key, ttlSeconds, size);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.cache.delete(key);

    this.stats.deletes++;
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = (this.stats.memoryUsage || 0) - (node.entry.size || 0);

    this.trackAnalytics('delete', key);
    return true;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    if (isExpired(node.entry.expiresAt)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats.size = 0;
    this.stats.memoryUsage = 0;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache analytics
   */
  getAnalytics(): CacheAnalytics[] {
    return [...this.analytics];
  }

  /**
   * Clear analytics
   */
  clearAnalytics(): void {
    this.analytics = [];
  }

  /**
   * Evict expired entries
   */
  evictExpired(): number {
    let evicted = 0;
    const now = Date.now();

    for (const [key, node] of this.cache.entries()) {
      if (now > node.entry.expiresAt) {
        this.delete(key);
        evicted++;
      }
    }

    return evicted;
  }

  /**
   * Get entries sorted by access (most to least recent)
   */
  getEntries(): Array<CacheEntry<unknown>> {
    const entries: Array<CacheEntry<unknown>> = [];
    let current = this.head;

    while (current) {
      entries.push(current.entry);
      current = current.next;
    }

    return entries;
  }

  // ========== LRU Implementation ==========

  /**
   * Move node to front (most recently used)
   */
  private moveToFront(node: LRUNode<unknown>): void {
    if (node === this.head) return;

    this.removeNode(node);
    this.addToFront(node);
  }

  /**
   * Add node to front
   */
  private addToFront(node: LRUNode<unknown>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove node from list
   */
  private removeNode(node: LRUNode<unknown>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (!this.tail) return;

    const key = this.tail.key;
    this.delete(key);
    this.stats.evictions++;
    this.trackAnalytics('evict', key);
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Track analytics event
   */
  private trackAnalytics(
    operation: CacheAnalytics['operation'],
    key: string,
    ttl?: number,
    size?: number,
    tokensSaved?: number
  ): void {
    if (!this.config.enableAnalytics) return;

    this.analytics.push({
      timestamp: Date.now(),
      level: CacheLevel.L1,
      operation,
      key,
      ttl,
      size,
      tokensSaved,
    });

    // Keep only last 10000 analytics events
    if (this.analytics.length > 10000) {
      this.analytics = this.analytics.slice(-10000);
    }
  }

  /**
   * Estimate tokens saved from cache hit (rough approximation)
   */
  private estimateTokensSaved(value: unknown): number {
    if (typeof value === 'string') {
      // Rough estimate: ~4 chars per token
      return Math.ceil(value.length / 4);
    }
    return 0;
  }
}

// Global singleton instance
let globalCache: MemoryCache | null = null;

/**
 * Get global cache instance
 */
export function getMemoryCache(config?: CacheConfig): MemoryCache {
  if (!globalCache) {
    globalCache = new MemoryCache(config);
  }
  return globalCache;
}
