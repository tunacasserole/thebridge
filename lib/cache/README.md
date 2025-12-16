# TheBridge Cache System

**Week 7: Caching & Performance Optimization**

Multi-level caching system with semantic similarity matching for token usage reduction.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Cache System                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Response    │  │  Embedding   │  │  Multi-Level │      │
│  │  Cache       │  │  Cache       │  │  Cache       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
│         ┌─────────────────┴─────────────────┐               │
│         │                                   │               │
│    ┌────▼────┐                         ┌────▼────┐          │
│    │   L1    │  ← In-Memory (Fast)     │   L3    │          │
│    │  Cache  │                          │  Cache  │          │
│    └─────────┘                          └─────────┘          │
│    • LRU eviction                       • PostgreSQL         │
│    • 100MB default                      • Persistent         │
│    • ~1ms latency                       • ~10ms latency      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Cache Analytics                          │   │
│  │  • Hit rate tracking                                  │   │
│  │  • Token savings measurement                          │   │
│  │  • Health monitoring                                  │   │
│  │  • Performance recommendations                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. Multi-Level Caching

- **L1 (In-Memory)**: Fastest, ephemeral, LRU eviction
- **L2 (Redis)**: Fast, larger capacity [Future]
- **L3 (Database)**: Persistent, unlimited capacity

**Automatic Promotion**: Frequently accessed entries move to faster levels
**Intelligent Demotion**: Old entries move to slower levels

### 2. Response Caching

Cache LLM responses with intelligent matching:

- **Exact Match**: Hash-based lookup (fastest)
- **Semantic Similarity**: Embedding-based matching (>85% similarity)
- **Fuzzy Matching**: String similarity fallback
- **Context-Aware**: Matches model, system prompt, and tools

**TTL Strategy**:
- Factual queries: 7 days
- Technical queries: 3 days
- Time-sensitive: 6 hours
- Default: 24 hours

### 3. Embedding Cache

Avoid redundant embedding API calls:

- Cache embeddings for frequently used text
- 7-day default TTL
- Track API calls saved
- Support batch operations

### 4. Cache Analytics

Comprehensive performance monitoring:

- **Hit Rate Tracking**: Overall and per-level
- **Token Savings**: Measure token reduction
- **Health Indicators**: EXCELLENT/GOOD/FAIR/POOR
- **Recommendations**: Actionable optimization tips
- **Time-Series Data**: Historical performance tracking

---

## Usage

### Basic Setup

```typescript
import { initializeCacheSystem } from '@/lib/cache';

// Initialize with defaults
const { cache, responseCache, embeddingCache, analytics } = initializeCacheSystem({
  enableL1: true,
  enableL3: true,
  enableAnalytics: true,
  l1MaxSize: 1000,
  l1MaxMemory: 100 * 1024 * 1024, // 100MB
});
```

### Response Caching

```typescript
import { getResponseCache } from '@/lib/cache';

const responseCache = getResponseCache();

// Try to get cached response
const cached = await responseCache.get(userQuery, {
  model: 'claude-sonnet-4',
  systemPrompt: SYSTEM_PROMPT,
  tools: ['tool1', 'tool2'],
});

if (cached) {
  console.log('Cache hit! Saved tokens:', cached.tokenCount);
  return cached.response;
}

// Generate new response
const response = await generateResponse(userQuery);

// Cache for future use
responseCache.set(userQuery, response, {
  model: 'claude-sonnet-4',
  systemPrompt: SYSTEM_PROMPT,
  tools: ['tool1', 'tool2'],
  embedding: queryEmbedding, // Optional: for similarity matching
});
```

### Embedding Caching

```typescript
import { getEmbeddingCache } from '@/lib/cache';

const embeddingCache = getEmbeddingCache();

// Get or create embedding
const embedding = await embeddingCache.getOrCreate(
  text,
  'text-embedding-model',
  async (text) => {
    // Your embedding API call
    return await generateEmbedding(text);
  }
);

// Check stats
const stats = embeddingCache.getStats();
console.log(`API calls saved: ${stats.apiCallsSaved}`);
```

### Multi-Level Cache

```typescript
import { getMultiLevelCache } from '@/lib/cache';

const cache = getMultiLevelCache();

// Set value (stored in both L1 and L3)
await cache.set('key', { data: 'value' }, 3600); // 1 hour TTL

// Get value (checks L1, then L3)
const result = await cache.get('key');
if (result.hit) {
  console.log(`Found in ${result.level}`);
  console.log(`Age: ${result.age}ms`);
  console.log('Value:', result.value);
}

// Get statistics
const stats = cache.getAggregateStats();
console.log('Hit rate:', stats.total.hitRate);
console.log('Tokens saved:', stats.total.tokensSaved);
```

### Analytics & Monitoring

```typescript
import { getCacheAnalytics, startAnalyticsRecording } from '@/lib/cache';

const analytics = getCacheAnalytics();

// Start periodic recording (every 1 minute)
const interval = startAnalyticsRecording(
  () => cache.getStats(),
  60000
);

// Get health indicators
const health = analytics.getHealthIndicators(cache.getStats());
console.log('Health:', health.overall); // EXCELLENT, GOOD, FAIR, POOR
console.log('Hit rate:', health.hitRate);
console.log('Tokens saved:', health.tokensSaved);
console.log('Recommendations:', health.recommendations);

// Generate report
const report = analytics.generateReport(cache.getStats());
console.log(report);

// Get top cache keys
const topKeys = analytics.getTopKeys(10);
topKeys.forEach(({ key, hits, tokensSaved }) => {
  console.log(`${key}: ${hits} hits (${tokensSaved} tokens saved)`);
});
```

---

## Expected Performance

### Cache Hit Rates

| Cache Type | Target Hit Rate | Expected Savings |
|------------|-----------------|------------------|
| Response Cache | 40-60% | 10-20K tokens/day |
| Embedding Cache | 70-90% | 50-80% fewer API calls |
| Multi-Level L1 | 80-95% | <1ms latency |
| Multi-Level L3 | 50-70% | ~10ms latency |

### Token Savings

**Conservative Estimate**: 30-50% token reduction for common queries

**Optimistic Estimate**: 60-80% for highly repetitive workloads

**Typical Savings**:
- System prompts: 100% (cached once, reused frequently)
- Common queries: 40-60% hit rate
- Documentation: 70-90% hit rate
- Embeddings: 80-95% fewer API calls

---

## Integration with Chat API

Example integration in `/app/api/chat/route.ts`:

```typescript
import { getResponseCache, getEmbeddingCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  const { message, conversationHistory, enabledTools } = await request.json();

  // Initialize caches
  const responseCache = getResponseCache();
  const embeddingCache = getEmbeddingCache();

  // Try cache first
  const cached = await responseCache.get(message, {
    model: 'claude-sonnet-4',
    systemPrompt: SYSTEM_PROMPT,
    tools: enabledTools,
  });

  if (cached) {
    console.log('[Cache] Hit! Saved', cached.tokenCount, 'tokens');
    return Response.json({
      response: cached.response,
      cached: true,
      tokensSaved: cached.tokenCount,
    });
  }

  // Generate embedding for similarity matching
  const embedding = await embeddingCache.getOrCreate(
    message,
    'embedding-model',
    async (text) => await generateEmbedding(text)
  );

  // Generate response
  const response = await generateResponse(message);

  // Cache for future
  responseCache.set(message, response, {
    model: 'claude-sonnet-4',
    systemPrompt: SYSTEM_PROMPT,
    tools: enabledTools,
    embedding,
  });

  return Response.json({ response });
}
```

---

## Database Migration

Run Prisma migration to add cache table:

```bash
npx prisma migrate dev --name add-cache-system
npx prisma generate
```

This creates the `CacheEntry` model in PostgreSQL for L3 persistence.

---

## Configuration

### Environment Variables

```env
# Optional: Redis for L2 cache (future)
# REDIS_URL=redis://localhost:6379

# Cache settings (defaults shown)
CACHE_L1_MAX_SIZE=1000
CACHE_L1_MAX_MEMORY=104857600  # 100MB
CACHE_ENABLE_L3=true
CACHE_ENABLE_ANALYTICS=true
```

### Runtime Configuration

```typescript
import { initializeCacheSystem } from '@/lib/cache';

const cache = initializeCacheSystem({
  enableL1: true,
  enableL3: true,
  enableAnalytics: true,
  l1MaxSize: parseInt(process.env.CACHE_L1_MAX_SIZE || '1000'),
  l1MaxMemory: parseInt(process.env.CACHE_L1_MAX_MEMORY || '104857600'),
});
```

---

## Monitoring

### Health Check Endpoint

Create `/app/api/cache/health/route.ts`:

```typescript
import { getMultiLevelCache, getCacheAnalytics } from '@/lib/cache';

export async function GET() {
  const cache = getMultiLevelCache();
  const analytics = getCacheAnalytics();

  const stats = cache.getAggregateStats();
  const health = analytics.getHealthIndicators(stats.total);

  return Response.json({
    health: health.overall,
    hitRate: health.hitRate,
    tokensSaved: health.tokensSaved,
    recommendations: health.recommendations,
    stats: stats.byLevel,
  });
}
```

### Dashboard Metrics

Track these metrics in your monitoring dashboard:

1. **Hit Rate**: Overall cache hit percentage
2. **Token Savings**: Total tokens saved by caching
3. **Memory Usage**: L1 cache memory consumption
4. **Eviction Rate**: Frequency of cache evictions
5. **Response Time**: Average cache lookup time

---

## Best Practices

### 1. Pre-warm Critical Content

```typescript
import { prewarmEmbeddingCache } from '@/lib/cache';

// Pre-warm common patterns on startup
await prewarmEmbeddingCache(
  embeddingCache,
  'embedding-model',
  generateEmbedding
);
```

### 2. Monitor Health

```typescript
// Check cache health periodically
const health = analytics.getHealthIndicators(cache.getStats());
if (health.overall === 'POOR') {
  console.warn('Cache performance degraded:', health.recommendations);
}
```

### 3. Tune TTLs

Adjust TTLs based on content type:
- Static documentation: 7+ days
- Dynamic data: 1-6 hours
- Real-time data: Don't cache

### 4. Clean Up Expired Entries

```typescript
// Run periodically (e.g., every hour)
setInterval(async () => {
  const evicted = await cache.evictExpired();
  console.log(`Evicted ${evicted} expired entries`);
}, 3600000);
```

### 5. Use Semantic Matching Wisely

Semantic matching adds overhead. Configure threshold:

```typescript
const responseCache = getResponseCache(undefined, {
  threshold: 0.85, // 85% similarity required
  maxCandidates: 10, // Check max 10 entries
  enableFuzzyMatch: true, // Fallback to fuzzy matching
});
```

---

## Troubleshooting

### Low Hit Rate

**Symptoms**: Hit rate < 50%

**Causes**:
- TTL too short
- Cache size too small
- Queries too diverse
- Similarity threshold too high

**Solutions**:
- Increase TTL for stable content
- Increase cache size
- Enable fuzzy matching
- Lower similarity threshold to 0.8

### High Memory Usage

**Symptoms**: Memory pressure > 80%

**Causes**:
- Cache size too large
- Large cached values
- Memory leak

**Solutions**:
- Reduce max cache size
- Enable compression (future)
- Increase max memory limit
- Check for memory leaks

### Slow Performance

**Symptoms**: Cache lookups > 10ms

**Causes**:
- L3 database slow
- Too many expired entries
- Network latency

**Solutions**:
- Optimize database indices
- Run evictExpired() more frequently
- Check database connection pool
- Increase L1 cache size

---

## Future Enhancements

### L2 Redis Cache

```typescript
// Future implementation
const cache = getMultiLevelCache({
  enableL1: true,
  enableL2: true, // Redis
  enableL3: true,
  l2Config: {
    url: process.env.REDIS_URL,
    maxMemory: 1024 * 1024 * 1024, // 1GB
  },
});
```

### Compression

```typescript
// Future: Compress large cached values
const cache = getMemoryCache({
  enableCompression: true,
  compressionThreshold: 10 * 1024, // Compress values >10KB
});
```

### Distributed Caching

```typescript
// Future: Share cache across instances
const cache = getMultiLevelCache({
  distributed: true,
  redisCluster: ['redis1:6379', 'redis2:6379'],
});
```

---

## Files Created

### Core Implementation
- `lib/cache/types.ts` - Type definitions
- `lib/cache/utils.ts` - Utility functions
- `lib/cache/memoryCache.ts` - L1 in-memory cache with LRU
- `lib/cache/responseCache.ts` - Response caching with similarity
- `lib/cache/embeddingCache.ts` - Embedding caching
- `lib/cache/multiLevel.ts` - Multi-level coordinator
- `lib/cache/analytics.ts` - Analytics and monitoring
- `lib/cache/index.ts` - Public API

### Database
- `prisma/schema.prisma` - Added CacheEntry model

### Documentation
- `lib/cache/README.md` - This file

---

## Summary

✅ **Multi-level caching system** (L1 in-memory + L3 database)
✅ **Response caching** with semantic similarity matching
✅ **Embedding caching** to reduce API calls
✅ **Cache analytics** and health monitoring
✅ **Automatic promotion/demotion** between levels
✅ **LRU eviction** for memory management
✅ **Time-series tracking** for performance analysis

**Expected Impact**:
- 30-50% token reduction for common queries
- 70-90% fewer embedding API calls
- Sub-1ms L1 cache latency
- ~10ms L3 cache latency
- Automatic performance optimization via analytics

**Next Steps**:
1. Run database migration: `npx prisma migrate dev`
2. Integrate with chat API
3. Set up monitoring dashboard
4. Tune TTLs based on usage patterns
5. Monitor cache health indicators
