/**
 * Cache System Usage Examples
 *
 * Demonstrates practical usage of the Week 7 caching system.
 */

import {
  getResponseCache,
  getEmbeddingCache,
  getMultiLevelCache,
  getCacheAnalytics,
  prewarmEmbeddingCache,
  startAnalyticsRecording,
  initializeCacheSystem,
} from './index';

// ============================================
// Example 1: Response Caching in Chat API
// ============================================

export async function chatAPIExample() {
  console.log('\n=== Example 1: Response Caching ===\n');

  const responseCache = getResponseCache();

  const query = "What are the most common errors in production?";
  const modelId = 'claude-sonnet-4-20250514';
  const systemPrompt = 'You are an expert SRE assistant';
  const tools = ['coralogix_query', 'newrelic_query'];

  // Try to get cached response
  const cached = await responseCache.get(query, {
    model: modelId,
    systemPrompt,
    tools,
  });

  if (cached) {
    console.log('✅ Cache hit!');
    console.log(`   Response: ${cached.response.slice(0, 100)}...`);
    console.log(`   Tokens saved: ${cached.tokenCount}`);
    console.log(`   Model: ${cached.model}`);
    return cached.response;
  }

  console.log('❌ Cache miss - generating new response...');

  // Simulate LLM response generation
  const response = `Based on the production logs, the most common errors are:
1. Database connection timeouts (45%)
2. API rate limit exceeded (30%)
3. Memory allocation failures (15%)
4. Network timeout errors (10%)`;

  // Cache for future use
  responseCache.set(query, response, {
    model: modelId,
    systemPrompt,
    tools,
  });

  console.log('✅ Response cached for future queries');

  return response;
}

// ============================================
// Example 2: Semantic Similarity Matching
// ============================================

export async function semanticMatchExample() {
  console.log('\n=== Example 2: Semantic Similarity ===\n');

  const responseCache = getResponseCache();

  // Original query and response
  const originalQuery = "Show me recent production errors";
  const originalResponse = "Here are the recent errors from production...";

  // Cache original
  responseCache.set(originalQuery, originalResponse, {
    model: 'claude-sonnet-4',
    embedding: generateMockEmbedding(originalQuery),
  });

  console.log(`Cached: "${originalQuery}"`);

  // Similar query (different wording, same intent)
  const similarQuery = "What are the latest errors in prod?";

  const cached = await responseCache.get(similarQuery, {
    model: 'claude-sonnet-4',
  });

  if (cached) {
    console.log(`✅ Found similar cached response for: "${similarQuery}"`);
    console.log(`   Original: "${originalQuery}"`);
    console.log(`   Match type: Semantic similarity`);
  } else {
    console.log(`❌ No similar response found (threshold might be too high)`);
  }
}

// ============================================
// Example 3: Embedding Caching
// ============================================

export async function embeddingCacheExample() {
  console.log('\n=== Example 3: Embedding Caching ===\n');

  const embeddingCache = getEmbeddingCache();

  const texts = [
    'System health check',
    'Database connection status',
    'API response times',
    'System health check', // Duplicate - will use cache
  ];

  console.log('Processing embeddings...\n');

  for (const text of texts) {
    const embedding = await embeddingCache.getOrCreate(
      text,
      'text-embedding-3-small',
      async (text) => {
        // Simulate embedding API call
        console.log(`  🌐 API call for: "${text}"`);
        await sleep(100); // Simulate network delay
        return generateMockEmbedding(text);
      }
    );

    if (embeddingCache.has(text, 'text-embedding-3-small')) {
      console.log(`  ✅ Cached: "${text}" (${embedding.length}D vector)`);
    }
  }

  const stats = embeddingCache.getStats();
  console.log(`\nAPI calls saved: ${stats.apiCallsSaved}`);
  console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
}

// ============================================
// Example 4: Multi-Level Caching
// ============================================

export async function multiLevelCacheExample() {
  console.log('\n=== Example 4: Multi-Level Caching ===\n');

  const cache = getMultiLevelCache();

  // Store data in cache
  const data = {
    query: 'system_health',
    result: { status: 'healthy', uptime: '99.9%' }
  };

  console.log('Setting cache entry...');
  await cache.set('health:check', data, 3600); // 1 hour TTL
  console.log('✅ Stored in L1 (memory) and L3 (database)');

  // Retrieve from L1 (fast)
  console.log('\nRetrieving from cache (should hit L1)...');
  const result1 = await cache.get('health:check');
  if (result1.hit) {
    console.log(`✅ Cache hit from ${result1.level}`);
    console.log(`   Latency: ${result1.age}ms`);
    console.log(`   Data:`, result1.value);
  }

  // Check statistics
  const stats = cache.getAggregateStats();
  console.log('\nCache Statistics:');
  console.log(`  Total hit rate: ${(stats.total.hitRate * 100).toFixed(1)}%`);
  console.log(`  L1 hits: ${stats.byLevel.L1.hits}`);
  console.log(`  L3 hits: ${stats.byLevel.L3.hits}`);
}

// ============================================
// Example 5: Cache Analytics & Health
// ============================================

export async function analyticsExample() {
  console.log('\n=== Example 5: Cache Analytics ===\n');

  const cache = getMultiLevelCache();
  const analytics = getCacheAnalytics();

  // Simulate some cache operations
  await cache.set('key1', { data: 'value1' });
  await cache.set('key2', { data: 'value2' });
  await cache.get('key1'); // Hit
  await cache.get('key3'); // Miss
  await cache.get('key1'); // Hit again

  // Get health indicators
  const stats = cache.getStats();
  const health = analytics.getHealthIndicators(stats);

  console.log('Cache Health:', health.overall);
  console.log(`Hit Rate: ${(health.hitRate * 100).toFixed(1)}%`);
  console.log(`Memory Usage: ${formatBytes(health.memoryUsage)}`);
  console.log(`Memory Pressure: ${(health.memoryPressure * 100).toFixed(1)}%`);
  console.log(`Tokens Saved: ${health.tokensSaved.toLocaleString()}`);

  if (health.recommendations.length > 0) {
    console.log('\nRecommendations:');
    health.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }

  // Generate full report
  console.log('\n' + analytics.generateReport(stats));
}

// ============================================
// Example 6: Complete System Integration
// ============================================

export async function completeSystemExample() {
  console.log('\n=== Example 6: Complete System Integration ===\n');

  // Initialize entire cache system
  const caches = initializeCacheSystem({
    enableL1: true,
    enableL3: true,
    enableAnalytics: true,
    l1MaxSize: 1000,
    l1MaxMemory: 100 * 1024 * 1024, // 100MB
  });

  console.log('✅ Cache system initialized');
  console.log('   - Response cache ready');
  console.log('   - Embedding cache ready');
  console.log('   - Multi-level cache ready');
  console.log('   - Analytics tracking enabled');

  // Start analytics recording
  const interval = startAnalyticsRecording(
    () => caches.cache.getStats(),
    60000 // Every 60 seconds
  );

  console.log('✅ Analytics recording started (60s interval)');

  // Pre-warm embedding cache
  console.log('\nPre-warming embedding cache...');
  await prewarmEmbeddingCache(
    caches.embeddingCache,
    'text-embedding-3-small',
    async (text) => generateMockEmbedding(text)
  );

  console.log('✅ Embedding cache pre-warmed with common patterns');

  // Cleanup
  clearInterval(interval);

  return caches;
}

// ============================================
// Example 7: Production Monitoring
// ============================================

export async function monitoringExample() {
  console.log('\n=== Example 7: Production Monitoring ===\n');

  const cache = getMultiLevelCache();
  const analytics = getCacheAnalytics();

  // Simulate production traffic
  console.log('Simulating production traffic...\n');

  const queries = [
    'system status',
    'recent errors',
    'performance metrics',
    'system status', // Duplicate - will hit cache
    'database health',
    'recent errors', // Duplicate - will hit cache
  ];

  for (const query of queries) {
    const result = await cache.get(query);
    if (!result.hit) {
      await cache.set(query, { data: `Response for: ${query}` }, 3600);
      console.log(`❌ Miss: "${query}" (generated & cached)`);
    } else {
      console.log(`✅ Hit:  "${query}" (from ${result.level})`);
    }
  }

  // Check health
  const stats = cache.getStats();
  const health = analytics.getHealthIndicators(stats);

  console.log('\nProduction Health Status:');
  console.log(`  Overall: ${health.overall}`);
  console.log(`  Hit Rate: ${(health.hitRate * 100).toFixed(1)}%`);
  console.log(`  Recommendations: ${health.recommendations.length}`);

  // Alert if unhealthy
  if (health.overall === 'POOR' || health.overall === 'FAIR') {
    console.log('\n⚠️  ALERT: Cache performance degraded!');
    console.log('Actions:');
    health.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
}

// ============================================
// Helper Functions
// ============================================

function generateMockEmbedding(text: string): number[] {
  // Generate a simple mock embedding based on text
  // In production, this would call OpenAI's embedding API
  const hash = hashString(text);
  const embedding: number[] = [];

  for (let i = 0; i < 1536; i++) {
    embedding.push((Math.sin(hash + i) + 1) / 2);
  }

  return embedding;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// Run All Examples
// ============================================

export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   TheBridge Cache System - Usage Examples     ║');
  console.log('║   Week 7: Caching & Performance               ║');
  console.log('╚════════════════════════════════════════════════╝');

  try {
    await chatAPIExample();
    await semanticMatchExample();
    await embeddingCacheExample();
    await multiLevelCacheExample();
    await analyticsExample();
    await completeSystemExample();
    await monitoringExample();

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   All Examples Completed Successfully! ✅     ║');
    console.log('╚════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
