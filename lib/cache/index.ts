/**
 * TheBridge Cache System
 *
 * Multi-level caching with semantic similarity matching.
 * Week 7: Caching & Performance Optimization
 */

// Core types
export * from './types';

// Utilities
export * from './utils';

// Cache implementations
export { MemoryCache, getMemoryCache } from './memoryCache';
export { ResponseCache, getResponseCache } from './responseCache';
export { EmbeddingCache, getEmbeddingCache, prewarmEmbeddingCache } from './embeddingCache';
export { MultiLevelCache, getMultiLevelCache } from './multiLevel';

// Analytics
export {
  CacheAnalyticsTracker,
  getCacheAnalytics,
  startAnalyticsRecording,
  CacheHealth,
} from './analytics';

// Anthropic Prompt Caching (Week 3)
export {
  createCachedSystemPrompt,
  createCachedTools,
  createCachedMessages,
  createCachedRequestConfig,
  updateCacheStats as updatePromptCacheStats,
  getCacheStats as getPromptCacheStats,
  resetCacheStats as resetPromptCacheStats,
  logCacheStats as logPromptCacheStats,
} from './promptCache';

// Re-export commonly used functions
import { getMultiLevelCache } from './multiLevel';
import { getResponseCache } from './responseCache';
import { getEmbeddingCache } from './embeddingCache';
import { getCacheAnalytics } from './analytics';

/**
 * Initialize the cache system with default configuration
 */
export function initializeCacheSystem(config?: {
  enableL1?: boolean;
  enableL3?: boolean;
  enableAnalytics?: boolean;
  l1MaxSize?: number;
  l1MaxMemory?: number;
}) {
  const cache = getMultiLevelCache({
    enableL1: config?.enableL1 ?? true,
    enableL3: config?.enableL3 ?? true,
    l1Config: {
      maxSize: config?.l1MaxSize ?? 1000,
      maxMemory: config?.l1MaxMemory ?? 100 * 1024 * 1024, // 100MB
    },
  });

  const responseCache = getResponseCache();
  const embeddingCache = getEmbeddingCache();
  const analytics = getCacheAnalytics();

  console.log('[Cache] System initialized');

  return {
    cache,
    responseCache,
    embeddingCache,
    analytics,
  };
}
