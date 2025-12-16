/**
 * Response Cache - Reduces token usage by caching common responses
 */

export interface CacheEntry {
  key: string;
  response: string;
  tokensSaved: number;
  timestamp: number;
  hits: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  tokensSaved: number;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxEntries: number;
  private ttl: number; // milliseconds
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxEntries: number = 1000, ttlMinutes: number = 60) {
    this.maxEntries = maxEntries;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * Generate cache key from query
   */
  private generateKey(query: string, context?: string): string {
    const normalized = query.toLowerCase().trim();
    return context ? `${context}:${normalized}` : normalized;
  }

  /**
   * Get cached response if available
   */
  get(query: string, context?: string): string | null {
    const key = this.generateKey(query, context);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update stats
    entry.hits++;
    this.hits++;

    return entry.response;
  }

  /**
   * Store response in cache
   */
  set(query: string, response: string, tokensSaved: number, context?: string): void {
    const key = this.generateKey(query, context);

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldest = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0];
      if (oldest) {
        this.cache.delete(oldest[0]);
      }
    }

    this.cache.set(key, {
      key,
      response,
      tokensSaved,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    let totalTokensSaved = 0;
    for (const entry of this.cache.values()) {
      totalTokensSaved += entry.tokensSaved * entry.hits;
    }

    return {
      totalEntries: this.cache.size,
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRate,
      tokensSaved: totalTokensSaved,
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Remove expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Get most valuable cache entries (by tokens saved)
   */
  getTopEntries(limit: number = 10): CacheEntry[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.tokensSaved * b.hits - a.tokensSaved * a.hits)
      .slice(0, limit);
  }
}
