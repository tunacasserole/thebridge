# Cache System Architecture

**TheBridge Week 7: Caching & Performance**

---

## System Design

### Architectural Principles

1. **Layered Caching**: Multiple cache tiers with different characteristics
2. **Semantic Awareness**: Understand query meaning, not just exact matches
3. **Automatic Optimization**: Self-tuning based on usage patterns
4. **Observable Performance**: Real-time metrics and health monitoring
5. **Graceful Degradation**: System works even if cache fails

---

## Component Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Application Layer                           │
│  (Chat API, Agent Routes, Tool Execution)                      │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        │ Cache API
                        ▼
┌────────────────────────────────────────────────────────────────┐
│                   Cache Facade Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ Response Cache   │  │ Embedding Cache  │                   │
│  │                  │  │                  │                   │
│  │ • Similarity     │  │ • API reduction  │                   │
│  │ • Context-aware  │  │ • Batch ops      │                   │
│  │ • Smart TTL      │  │ • Pre-warming    │                   │
│  └────────┬─────────┘  └────────┬─────────┘                   │
│           │                     │                              │
│           └──────────┬──────────┘                              │
└──────────────────────┼─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│              Multi-Level Cache Coordinator                     │
│  • Route requests to appropriate cache level                  │
│  • Promote hot entries to faster levels                       │
│  • Demote cold entries to slower levels                       │
│  • Aggregate statistics across levels                         │
└──────────────────────┬────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
┌────────────────────┐  ┌────────────────────┐
│   L1: Memory       │  │   L3: Database     │
│                    │  │                    │
│ • LRU eviction     │  │ • PostgreSQL       │
│ • 100MB capacity   │  │ • Unlimited size   │
│ • ~1ms latency     │  │ • ~10ms latency    │
│ • Volatile         │  │ • Persistent       │
│ • Hot data         │  │ • Cold data        │
└────────────────────┘  └────────────────────┘
```

---

## Data Flow

### Write Path (Cache Set)

```
User Query
    │
    ▼
Response Generated
    │
    ▼
Response Cache.set()
    │
    ├─► Generate cache key (hash of query + context)
    ├─► Determine TTL (based on query type)
    ├─► Store embedding (if provided)
    │
    ▼
Multi-Level Cache.set()
    │
    ├─► L1: Store in memory (LRU)
    │   └─► Evict old entries if memory full
    │
    └─► L3: Store in database (Persistent)
        └─► Index by key and expiration

Result: Cached for future queries
```

### Read Path (Cache Get)

```
User Query
    │
    ▼
Response Cache.get()
    │
    ├─► Generate cache key
    ├─► Check exact match (hash-based)
    │       │
    │       ├─► Found: Return immediately (fastest)
    │       │
    │       └─► Not found: Try similarity match
    │           │
    │           ├─► Check embedding similarity (>85%)
    │           │   └─► Found: Return similar response
    │           │
    │           └─► Try fuzzy string match
    │               └─► Found: Return fuzzy match
    │
    ▼
Multi-Level Cache.get()
    │
    ├─► L1: Check memory cache
    │   ├─► Hit: Return (promoted, ~1ms)
    │   └─► Miss: Continue to L3
    │
    └─► L3: Check database cache
        ├─► Hit: Return + Promote to L1 (~10ms)
        └─► Miss: Return null

Result: Cached response or null (generate new)
```

---

## Cache Levels Comparison

| Feature | L1 (Memory) | L3 (Database) | L2 (Redis)* |
|---------|-------------|---------------|-------------|
| **Storage** | RAM | PostgreSQL | Redis |
| **Capacity** | 100MB | Unlimited | 1-10GB |
| **Latency** | <1ms | ~10ms | 1-5ms |
| **Persistence** | No | Yes | Optional |
| **Shared** | No | Yes | Yes |
| **Use Case** | Hot data | Cold data | Warm data |
| **Eviction** | LRU | Manual/TTL | LRU/TTL |
| **Cost** | Free | Storage | Memory |

*L2 planned for future

---

## Caching Strategies

### 1. Response Caching Strategy

**Goal**: Reduce repeated LLM API calls

**Approach**:
```
1. Exact Match (Hash-based)
   - O(1) lookup by query hash
   - Fastest, most efficient
   - Requires exact query match

2. Semantic Match (Embedding-based)
   - Calculate query embedding
   - Compare with cached embeddings
   - Match if similarity >85%
   - Handles query variations

3. Fuzzy Match (String-based)
   - Levenshtein distance
   - Normalize text (lowercase, trim)
   - Match if similarity >80%
   - Fallback for no embeddings
```

**TTL Strategy**:
```typescript
const TTL_STRATEGY = {
  factual: 7 * 24 * 3600,      // 7 days - stable facts
  technical: 3 * 24 * 3600,    // 3 days - docs, guides
  timeSensitive: 6 * 3600,     // 6 hours - current data
  default: 24 * 3600,          // 24 hours - general
};

function determineTTL(query: string): number {
  if (hasKeyword(query, ['today', 'now', 'current'])) {
    return TTL_STRATEGY.timeSensitive;
  }
  if (hasKeyword(query, ['what is', 'explain', 'how to'])) {
    return TTL_STRATEGY.technical;
  }
  if (hasKeyword(query, ['documentation', 'api', 'reference'])) {
    return TTL_STRATEGY.factual;
  }
  return TTL_STRATEGY.default;
}
```

### 2. Embedding Caching Strategy

**Goal**: Reduce embedding API calls by 70-90%

**Approach**:
```
1. Hash-based Deduplication
   - SHA-256 hash of text
   - O(1) lookup
   - Handles exact duplicates

2. Normalization
   - Trim whitespace
   - Normalize line endings
   - Consistent hashing

3. Pre-warming
   - Cache common patterns on startup
   - System prompts
   - Common queries
   - Documentation snippets
```

**API Call Reduction**:
```
Without cache: Every text → Embedding API call
With cache:    Only unique text → API call

Example:
  100 texts, 30 unique → 30 API calls (70% reduction)
  1000 texts, 100 unique → 100 API calls (90% reduction)
```

### 3. Multi-Level Strategy

**Goal**: Optimize for speed and persistence

**Approach**:
```
Write:
  1. Store in L1 (fast access)
  2. Store in L3 (persistence)

Read:
  1. Check L1 first (fastest)
  2. If miss, check L3
  3. If L3 hit, promote to L1

Eviction:
  L1: LRU when memory full
  L3: TTL-based expiration

Promotion:
  - Promote after 3 hits
  - Promote hot entries to L1
  - Keep cold entries in L3

Demotion:
  - Demote after 24 hours
  - Move old L1 entries to L3
  - Free L1 memory
```

---

## LRU Eviction Algorithm

### Doubly-Linked List Implementation

```
┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐
│ A   │────▶│ B   │────▶│ C   │────▶│ D   │
│(MRU)│◀────│     │◀────│     │◀────│(LRU)│
└─────┘     └─────┘     └─────┘     └─────┘
  Head                                 Tail

Access B:
┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐
│ B   │────▶│ A   │────▶│ C   │────▶│ D   │
│(MRU)│◀────│     │◀────│     │◀────│(LRU)│
└─────┘     └─────┘     └─────┘     └─────┘

Evict (memory full):
- Remove D (tail/LRU)
- Update C as new tail
```

**Operations**:
- `get()`: O(1) - Move to head
- `set()`: O(1) - Add to head
- `delete()`: O(1) - Remove node
- `evict()`: O(1) - Remove tail

**Memory Management**:
```typescript
while (cache.size >= maxSize || memoryUsage >= maxMemory) {
  evictLRU(); // Remove least recently used
}
```

---

## Similarity Matching

### Cosine Similarity for Embeddings

```
cos(A, B) = (A · B) / (||A|| × ||B||)

Where:
  A · B = Σ(ai × bi)     // Dot product
  ||A|| = √Σ(ai²)        // Magnitude of A
  ||B|| = √Σ(bi²)        // Magnitude of B

Result: 0.0 to 1.0
  1.0 = Identical
  0.85+ = Very similar (cache hit)
  0.7-0.85 = Similar
  <0.7 = Different
```

**Example**:
```typescript
const queryEmbedding = [0.1, 0.2, 0.3, ...]; // 1536 dimensions
const cachedEmbedding = [0.11, 0.19, 0.31, ...];

const similarity = cosineSimilarity(queryEmbedding, cachedEmbedding);
// Result: 0.92 → Cache hit! (>0.85 threshold)
```

### Fuzzy String Matching

```
Levenshtein Distance: Minimum edits to transform string A to B

Example:
  A: "how to debug"
  B: "how to debug errors"

  Distance: 7 (add " errors")
  Similarity: 1 - (7 / 21) = 0.67

  Threshold: 0.8 → No match
  Threshold: 0.6 → Match!
```

---

## Analytics Architecture

### Health Calculation

```typescript
function calculateHealth(stats: CacheStats): CacheHealth {
  if (stats.hitRate >= 0.9) return 'EXCELLENT';
  if (stats.hitRate >= 0.7) return 'GOOD';
  if (stats.hitRate >= 0.5) return 'FAIR';
  return 'POOR';
}
```

### Time-Series Data

```
┌─────────────────────────────────────┐
│ Time-Series Buffer (Ring Buffer)    │
│ Max: 1000 data points               │
│                                     │
│ Point: {                            │
│   timestamp: 1702742400000          │
│   hitRate: 0.75                     │
│   hits: 150                         │
│   misses: 50                        │
│   size: 800                         │
│   memoryUsage: 75MB                 │
│   tokensSaved: 25000                │
│ }                                   │
│                                     │
│ Recorded: Every 60 seconds          │
│ Retained: Last ~16 hours            │
└─────────────────────────────────────┘
```

### Performance Metrics

```typescript
interface Metrics {
  // Core metrics
  hitRate: number;           // 0.0 - 1.0
  tokensSaved: number;       // Cumulative
  memoryPressure: number;    // 0.0 - 1.0
  evictionRate: number;      // 0.0 - 1.0

  // Latency metrics
  l1Latency: number;         // ms
  l3Latency: number;         // ms
  avgLatency: number;        // ms

  // Health metrics
  health: CacheHealth;       // EXCELLENT/GOOD/FAIR/POOR
  recommendations: string[]; // Action items
}
```

---

## Error Handling

### Graceful Degradation

```typescript
try {
  const cached = await cache.get(key);
  if (cached) return cached;
} catch (error) {
  console.error('[Cache] Get failed:', error);
  // Continue without cache - generate fresh response
}

// Always works, even if cache fails
return await generateResponse();
```

### Error Scenarios

| Error | Behavior | Fallback |
|-------|----------|----------|
| L1 memory full | Evict LRU | Continue |
| L3 database down | Skip L3 | Use L1 only |
| Invalid cache key | Log warning | Generate fresh |
| Expired entry | Delete entry | Cache miss |
| Similarity timeout | Skip similarity | Fuzzy match |

---

## Performance Optimization

### 1. Fast Path Optimizations

```typescript
// Fast path: Exact match (most common)
const exactMatch = cache.get(hashKey); // O(1), ~1ms
if (exactMatch) return exactMatch;

// Slow path: Similarity (uncommon)
const similarMatch = findSimilar(query); // O(n), ~5ms
```

### 2. Lazy Evaluation

```typescript
// Don't calculate similarity unless needed
if (exactMatch) {
  return exactMatch; // No similarity calculation
}

// Only calculate when necessary
const similarity = cosineSimilarity(a, b);
```

### 3. Early Returns

```typescript
// Return as soon as possible
if (cached) return cached;           // Don't check other levels
if (l1Hit) return l1Value;           // Don't check L3
if (expired) return null;            // Don't return expired data
```

### 4. Batch Operations

```typescript
// Batch embedding lookups
const embeddings = embeddingCache.batchGet(texts);

// Batch writes
embeddingCache.batchSet(entries);
```

---

## Scalability Considerations

### Current (Single Instance)

```
┌──────────────┐
│   Instance   │
│   ┌────┐     │
│   │ L1 │     │  100MB cache
│   └────┘     │  1000 entries
│   ┌────┐     │
│   │ L3 │     │  Shared DB
│   └────┘     │  Unlimited
└──────────────┘
```

### Future (Multi-Instance with Redis)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Instance 1  │  │  Instance 2  │  │  Instance 3  │
│   ┌────┐     │  │   ┌────┐     │  │   ┌────┐     │
│   │ L1 │     │  │   │ L1 │     │  │   │ L1 │     │
│   └─┬──┘     │  │   └─┬──┘     │  │   └─┬──┘     │
└─────┼────────┘  └─────┼────────┘  └─────┼────────┘
      │                 │                 │
      └─────────────────┼─────────────────┘
                        │
                   ┌────▼────┐
                   │  Redis  │  Shared L2 cache
                   │   (L2)  │  1-10GB capacity
                   └────┬────┘
                        │
                   ┌────▼────┐
                   │Database │  Shared L3 cache
                   │   (L3)  │  Unlimited
                   └─────────┘
```

---

## Monitoring Integration

### Metrics Exposed

```typescript
// Health endpoint: GET /api/cache/health
{
  "health": "GOOD",
  "hitRate": 0.72,
  "tokensSaved": 125000,
  "memoryUsage": "68.5 MB",
  "memoryPressure": 0.685,
  "recommendations": [
    "Cache is performing well",
    "Consider increasing TTL for technical queries"
  ],
  "byLevel": {
    "L1": { "hitRate": 0.85, "size": 850, ... },
    "L3": { "hitRate": 0.55, "size": 3200, ... }
  }
}
```

### Dashboard Metrics

```
Cache Performance Dashboard

Hit Rate:  ████████████░░░░░░░░  72% (GOOD)
Tokens:    125K saved today
Memory:    ████████████████░░░░  68.5 MB / 100 MB
Health:    🟢 GOOD

Top Cache Keys:
1. "what is the status" - 45 hits (4.5K tokens)
2. "show recent errors" - 32 hits (3.2K tokens)
3. "check system health" - 28 hits (2.8K tokens)

Recent Activity: [Time-series graph]
```

---

## Security Considerations

### 1. Cache Poisoning Prevention

```typescript
// Hash keys to prevent manipulation
const key = hashText(query + context);

// Validate input before caching
if (isValidInput(query)) {
  cache.set(key, response);
}
```

### 2. Sensitive Data Protection

```typescript
// Don't cache sensitive queries
if (isSensitive(query)) {
  return generateResponse(query); // Skip cache
}
```

### 3. TTL Enforcement

```typescript
// Always check expiration
if (isExpired(entry.expiresAt)) {
  cache.delete(key); // Remove expired data
  return null;
}
```

---

## Summary

**Cache System Architecture** provides:

✅ **Three-tier caching** (L1 memory, L3 database, future L2 Redis)
✅ **Intelligent matching** (exact, semantic, fuzzy)
✅ **Automatic optimization** (promotion, eviction, TTL)
✅ **Real-time monitoring** (health, metrics, recommendations)
✅ **Graceful degradation** (works even if cache fails)
✅ **Scalability path** (single → multi-instance → distributed)

**Performance Targets**:
- L1 latency: <1ms
- L3 latency: <10ms
- Hit rate: 50-70%
- Token savings: 30-50%
- Memory usage: <80%

**Next Steps**:
1. Deploy and monitor
2. Tune thresholds based on real data
3. Add L2 Redis layer (future)
4. Implement compression (future)
5. Add distributed caching (future)
