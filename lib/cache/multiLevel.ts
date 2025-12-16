/**
 * Multi-Level Cache System
 *
 * Implements a three-tier caching hierarchy:
 * - L1: In-memory (fastest, smallest)
 * - L2: Redis (fast, larger) - Future implementation
 * - L3: Database (slowest, persistent)
 *
 * Features:
 * - Automatic promotion/demotion between levels
 * - Configurable policies
 * - Cache health monitoring
 */

import { MemoryCache, getMemoryCache } from './memoryCache';
import { prisma } from '@/lib/db';
import {
  CacheLevel,
  CacheResult,
  CachePolicy,
  CacheEntry,
  CacheStats,
} from './types';
import {
  isExpired,
  calculateExpiresAt,
  estimateSize,
  hashText,
} from './utils';

/**
 * Multi-level cache configuration
 */
interface MultiLevelCacheConfig {
  enableL1?: boolean;
  enableL2?: boolean; // Future: Redis
  enableL3?: boolean;
  policy?: CachePolicy;
  l1Config?: {
    maxSize?: number;
    maxMemory?: number;
  };
}

/**
 * Multi-level cache coordinator
 */
export class MultiLevelCache {
  private l1: MemoryCache | null;
  private l3Enabled: boolean;
  private policy: Required<CachePolicy>;
  private stats: Record<CacheLevel, CacheStats>;

  constructor(config?: MultiLevelCacheConfig) {
    // Initialize L1 cache
    this.l1 = config?.enableL1 !== false
      ? getMemoryCache(config?.l1Config)
      : null;

    // L2 (Redis) - Future implementation
    // this.l2 = config?.enableL2 ? new RedisCache() : null;

    // L3 (Database)
    this.l3Enabled = config?.enableL3 !== false;

    // Cache policy
    this.policy = {
      promoteOnHit: config?.policy?.promoteOnHit ?? true,
      promoteThreshold: config?.policy?.promoteThreshold ?? 3,
      demoteOnExpire: config?.policy?.demoteOnExpire ?? false,
      demoteAge: config?.policy?.demoteAge ?? 24 * 3600 * 1000, // 24 hours
    };

    // Initialize stats
    this.stats = {
      [CacheLevel.L1]: {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        size: 0,
        hitRate: 0,
      },
      [CacheLevel.L2]: {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        size: 0,
        hitRate: 0,
      },
      [CacheLevel.L3]: {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        size: 0,
        hitRate: 0,
      },
    };
  }

  /**
   * Get value from cache (checks all levels)
   */
  async get<T = unknown>(key: string): Promise<CacheResult<T>> {
    // Try L1 first
    if (this.l1) {
      const value = this.l1.get<T>(key);
      if (value !== null) {
        this.stats[CacheLevel.L1].hits++;
        return {
          value,
          hit: true,
          level: CacheLevel.L1,
          age: 0,
        };
      }
      this.stats[CacheLevel.L1].misses++;
    }

    // Try L3 (database)
    if (this.l3Enabled) {
      const result = await this.getFromL3<T>(key);
      if (result.hit) {
        // Promote to L1 if policy allows
        if (this.policy.promoteOnHit && this.l1 && result.value !== null) {
          this.promoteToL1(key, result.value);
        }
        return result;
      }
    }

    // Cache miss
    return {
      value: null,
      hit: false,
    };
  }

  /**
   * Set value in cache
   */
  async set<T = unknown>(
    key: string,
    value: T,
    ttl?: number,
    options?: {
      level?: CacheLevel | 'all';
      skipL1?: boolean;
      skipL3?: boolean;
    }
  ): Promise<void> {
    const targetLevel = options?.level ?? 'all';

    // Set in L1
    if (!options?.skipL1 && this.l1 && (targetLevel === 'all' || targetLevel === CacheLevel.L1)) {
      this.l1.set(key, value, ttl);
      this.stats[CacheLevel.L1].sets++;
    }

    // Set in L3
    if (!options?.skipL3 && this.l3Enabled && (targetLevel === 'all' || targetLevel === CacheLevel.L3)) {
      await this.setInL3(key, value, ttl);
    }
  }

  /**
   * Delete from all cache levels
   */
  async delete(key: string): Promise<boolean> {
    let deleted = false;

    // Delete from L1
    if (this.l1) {
      deleted = this.l1.delete(key) || deleted;
      if (deleted) {
        this.stats[CacheLevel.L1].deletes++;
      }
    }

    // Delete from L3
    if (this.l3Enabled) {
      deleted = (await this.deleteFromL3(key)) || deleted;
    }

    return deleted;
  }

  /**
   * Check if key exists in any level
   */
  async has(key: string): Promise<boolean> {
    if (this.l1?.has(key)) return true;
    if (this.l3Enabled) return await this.hasInL3(key);
    return false;
  }

  /**
   * Clear all cache levels
   */
  async clear(): Promise<void> {
    if (this.l1) {
      this.l1.clear();
    }

    if (this.l3Enabled) {
      await this.clearL3();
    }
  }

  /**
   * Get statistics for all levels
   */
  getStats(): Record<CacheLevel, CacheStats> {
    // Update L1 stats
    if (this.l1) {
      this.stats[CacheLevel.L1] = this.l1.getStats();
    }

    return { ...this.stats };
  }

  /**
   * Get aggregated statistics
   */
  getAggregateStats() {
    const stats = this.getStats();

    const total = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      tokensSaved: 0,
    };

    for (const level of Object.values(CacheLevel)) {
      const levelStats = stats[level];
      total.hits += levelStats.hits;
      total.misses += levelStats.misses;
      total.sets += levelStats.sets;
      total.deletes += levelStats.deletes;
      total.evictions += levelStats.evictions;
      total.size += levelStats.size;
      total.tokensSaved += levelStats.tokensSaved || 0;
    }

    total.hitRate = total.hits + total.misses > 0
      ? total.hits / (total.hits + total.misses)
      : 0;

    return { byLevel: stats, total };
  }

  /**
   * Evict expired entries from all levels
   */
  async evictExpired(): Promise<number> {
    let evicted = 0;

    // Evict from L1
    if (this.l1) {
      evicted += this.l1.evictExpired();
    }

    // Evict from L3
    if (this.l3Enabled) {
      evicted += await this.evictExpiredL3();
    }

    return evicted;
  }

  // ========== L3 (Database) Operations ==========

  /**
   * Get from L3 cache
   */
  private async getFromL3<T>(key: string): Promise<CacheResult<T>> {
    try {
      const entry = await prisma.cacheEntry.findUnique({
        where: { key },
      });

      if (!entry) {
        this.stats[CacheLevel.L3].misses++;
        return { value: null, hit: false };
      }

      // Check expiration
      if (entry.expiresAt && new Date() > entry.expiresAt) {
        await this.deleteFromL3(key);
        this.stats[CacheLevel.L3].misses++;
        return { value: null, hit: false };
      }

      // Update hit count
      await prisma.cacheEntry.update({
        where: { key },
        data: { hits: { increment: 1 } },
      });

      this.stats[CacheLevel.L3].hits++;

      const age = Date.now() - entry.createdAt.getTime();
      const value = JSON.parse(entry.value) as T;

      return {
        value,
        hit: true,
        level: CacheLevel.L3,
        age,
      };
    } catch (error) {
      console.error('[MultiLevelCache] L3 get error:', error);
      this.stats[CacheLevel.L3].misses++;
      return { value: null, hit: false };
    }
  }

  /**
   * Set in L3 cache
   */
  private async setInL3<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const ttlSeconds = ttl ?? 24 * 3600; // 24 hours default
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await prisma.cacheEntry.upsert({
        where: { key },
        create: {
          key,
          value: JSON.stringify(value),
          ttl: ttlSeconds,
          expiresAt,
          hits: 0,
        },
        update: {
          value: JSON.stringify(value),
          ttl: ttlSeconds,
          expiresAt,
          updatedAt: new Date(),
        },
      });

      this.stats[CacheLevel.L3].sets++;
    } catch (error) {
      console.error('[MultiLevelCache] L3 set error:', error);
    }
  }

  /**
   * Delete from L3 cache
   */
  private async deleteFromL3(key: string): Promise<boolean> {
    try {
      await prisma.cacheEntry.delete({
        where: { key },
      });

      this.stats[CacheLevel.L3].deletes++;
      return true;
    } catch (error) {
      // Entry might not exist
      return false;
    }
  }

  /**
   * Check if key exists in L3
   */
  private async hasInL3(key: string): Promise<boolean> {
    try {
      const entry = await prisma.cacheEntry.findUnique({
        where: { key },
        select: { expiresAt: true },
      });

      if (!entry) return false;

      // Check expiration
      if (entry.expiresAt && new Date() > entry.expiresAt) {
        await this.deleteFromL3(key);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear L3 cache
   */
  private async clearL3(): Promise<void> {
    try {
      await prisma.cacheEntry.deleteMany({});
    } catch (error) {
      console.error('[MultiLevelCache] L3 clear error:', error);
    }
  }

  /**
   * Evict expired entries from L3
   */
  private async evictExpiredL3(): Promise<number> {
    try {
      const result = await prisma.cacheEntry.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('[MultiLevelCache] L3 evict error:', error);
      return 0;
    }
  }

  // ========== Cache Promotion/Demotion ==========

  /**
   * Promote entry to L1
   */
  private promoteToL1<T>(key: string, value: T): void {
    if (!this.l1) return;

    // Simple promotion - use default TTL
    this.l1.set(key, value);
    console.log(`[MultiLevelCache] Promoted ${key} to L1`);
  }

  /**
   * Demote entry from L1 to L3
   */
  private async demoteToL3<T>(key: string, value: T): Promise<void> {
    if (!this.l3Enabled) return;

    await this.setInL3(key, value);
    if (this.l1) {
      this.l1.delete(key);
    }

    console.log(`[MultiLevelCache] Demoted ${key} to L3`);
  }
}

// Global singleton instance
let globalMultiLevelCache: MultiLevelCache | null = null;

/**
 * Get global multi-level cache instance
 */
export function getMultiLevelCache(config?: MultiLevelCacheConfig): MultiLevelCache {
  if (!globalMultiLevelCache) {
    globalMultiLevelCache = new MultiLevelCache(config);
  }
  return globalMultiLevelCache;
}
