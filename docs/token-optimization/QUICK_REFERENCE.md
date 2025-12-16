# Token Optimization - Quick Reference Guide

Fast reference for using TheBridge's token optimization features.

## 1. Response Optimization

### Basic Usage

```typescript
import { getResponseLengthConfig } from '@/lib/response';

const config = getResponseLengthConfig({
  message: userQuery,
  conversationLength: history.length,
  hasFiles: files.length > 0,
  toolsEnabled: tools.length > 0,
});

// Use in API call
const response = await anthropic.messages.create({
  max_tokens: config.maxTokens,
  thinking: { budget_tokens: config.thinkingBudget },
  // ... other params
});
```

### Response Profiles

```typescript
// Specify explicit profile
const config = getResponseLengthConfig({
  message: userQuery,
  profile: 'concise', // 'concise' | 'standard' | 'detailed'
  // ... other params
});
```

**Profiles**:
- `concise` - 1,024 tokens (quick answers, status checks)
- `standard` - 4,096 tokens (normal conversations)
- `detailed` - 8,192 tokens (complex analysis)

### Templates

```typescript
import { getTemplateInstruction } from '@/lib/response';

// Add to system prompt
const instruction = getTemplateInstruction(message);
const systemPrompt = `${BASE_PROMPT}

Response Guidelines:
${instruction}

Be concise and direct.`;
```

### Compression

```typescript
import { autoCompress, compressResponse } from '@/lib/response';

// Auto-select mode
const result = autoCompress(responseText);

// Manual mode
const result = compressResponse(responseText, 'moderate');

console.log(`Saved ${result.tokensRemoved} tokens`);
```

## 2. Model Routing

### Auto-Routing

```typescript
import { routeToModel } from '@/lib/routing/modelRouter';

const decision = routeToModel(message, {
  conversationHistory,
  enabledTools,
  userPreference: 'sonnet', // Optional override
});

// Use routed model
const response = await anthropic.messages.create({
  model: decision.modelId,
  // ... other params
});
```

### Routing Logic

- **Haiku**: Simple queries, status checks (complexity < 0.3)
- **Sonnet**: Standard queries, medium complexity (0.3-0.7)
- **Opus**: Complex analysis, multiple tools (> 0.7)

## 3. Prompt Caching

### Enable Caching

```typescript
import { createCachedRequestConfig } from '@/lib/cache/promptCache';

const config = createCachedRequestConfig({
  systemPrompt,
  tools,
  messages,
  model: modelId,
  maxTokens,
});

const response = await anthropic.messages.create(config);
```

### Cache Stats

```typescript
import { updateCacheStats, logCacheStats } from '@/lib/cache/promptCache';

// After API call
updateCacheStats(response.usage);

// Log stats
logCacheStats('[MyComponent]');
```

## 4. Context Pruning

### Prune Conversation

```typescript
import { pruneConversation } from '@/lib/context/pruning';

const pruned = pruneConversation(conversationHistory, {
  strategy: 'sliding_window',
  maxMessages: 20,
  maxTokens: 4000,
});
```

### Strategies

```typescript
// Sliding window (keep recent)
{ strategy: 'sliding_window', maxMessages: 20 }

// Importance-based (keep important)
{ strategy: 'importance', maxTokens: 4000 }

// Summarization (summarize old)
{ strategy: 'summarization', maxMessages: 15 }
```

## 5. Input Compression

### Compress Tool Output

```typescript
import { compressToolOutput } from '@/lib/compression/inputCompressor';

const compressed = compressToolOutput(toolResult, {
  mode: 'moderate',
  preserveKeys: ['id', 'status', 'name'],
});
```

### Compress Files

```typescript
import { compressFileContent } from '@/lib/compression/inputCompressor';

const compressed = compressFileContent(fileContent, {
  maxTokens: 1000,
  mode: 'moderate',
});
```

## 6. Prompt Optimization

### Context-Aware Prompt

```typescript
import { getOptimizedPrompt } from '@/lib/prompts/optimizer';

const optimized = getOptimizedPrompt({
  basePrompt: SYSTEM_PROMPT,
  context: {
    queryComplexity: 0.5,
    toolsEnabled: true,
    conversationLength: 10,
  },
});
```

## Common Patterns

### Full Optimization Pipeline

```typescript
import {
  routeToModel,
  createCachedRequestConfig,
  getResponseLengthConfig,
  getTemplateInstruction,
  pruneConversation,
} from '@/lib';

async function optimizedChat(message: string, history: Message[]) {
  // 1. Route to model
  const routing = routeToModel(message, { conversationHistory: history });

  // 2. Prune history
  const pruned = pruneConversation(history, {
    strategy: 'sliding_window',
    maxMessages: 20,
  });

  // 3. Optimize response length
  const lengthConfig = getResponseLengthConfig({
    message,
    conversationLength: pruned.length,
    toolsEnabled: true,
  });

  // 4. Add template instruction
  const instruction = getTemplateInstruction(message);
  const systemPrompt = `${BASE_PROMPT}\n\n${instruction}`;

  // 5. Create cached config
  const config = createCachedRequestConfig({
    systemPrompt,
    tools,
    messages: pruned,
    model: routing.modelId,
    maxTokens: lengthConfig.maxTokens,
  });

  // 6. Make API call
  return await anthropic.messages.create(config);
}
```

### Simple Query Optimization

```typescript
// For simple status checks, yes/no questions
const config = getResponseLengthConfig({
  message: 'Is service X healthy?',
  profile: 'concise',
  conversationLength: 5,
});

// Expected: maxTokens ~256-512, thinkingBudget ~2000
```

### Complex Analysis Optimization

```typescript
// For detailed analysis, troubleshooting
const config = getResponseLengthConfig({
  message: 'Analyze performance degradation',
  profile: 'detailed',
  conversationLength: 10,
  toolsEnabled: true,
});

// Expected: maxTokens ~6000-8000, thinkingBudget ~10000
```

## Configuration

### Environment Variables

```bash
# Optional: Override defaults
PROMPT_CACHE_TTL=14400  # 4 hours
CONTEXT_MAX_MESSAGES=20
MODEL_ROUTING_ENABLED=true
RESPONSE_OPTIMIZATION_ENABLED=true
```

### API Parameters

```typescript
// In chat API request
{
  message: string,
  conversationHistory: Message[],
  enabledTools: string[],
  model: 'haiku' | 'sonnet' | 'opus',  // Preference
  responseProfile?: 'concise' | 'standard' | 'detailed',
  extendedThinking: boolean,
  verbose: boolean,
}
```

## Monitoring

### Check Cache Performance

```typescript
import { getCacheStats } from '@/lib/cache/promptCache';

const stats = getCacheStats();
console.log('Cache Hit Rate:', stats.hitRate);
console.log('Tokens Saved:', stats.totalInputTokensSaved);
```

### Check Routing Stats

```typescript
import { getRoutingStats } from '@/lib/routing/modelRouter';

const stats = getRoutingStats();
console.log('Haiku Usage:', stats.routeDistribution.haiku);
console.log('Cost Savings:', stats.totalCostSavings);
```

## Troubleshooting

### Low Cache Hit Rate

```typescript
// Increase TTL
const config = createCachedRequestConfig({
  // ... params
  cacheTTL: 14400, // 4 hours instead of default
});
```

### Response Too Short

```typescript
// Use higher profile
const config = getResponseLengthConfig({
  message,
  profile: 'detailed', // Instead of 'concise'
});
```

### Response Too Long

```typescript
// Use lower profile or explicit compression
const config = getResponseLengthConfig({
  message,
  profile: 'concise',
});

// Or compress after
const result = compressResponse(responseText, 'aggressive');
```

### Context Too Large

```typescript
// More aggressive pruning
const pruned = pruneConversation(history, {
  strategy: 'sliding_window',
  maxMessages: 10, // Reduce from 20
  maxTokens: 2000, // Reduce from 4000
});
```

## Best Practices

### Do ✅

- Enable prompt caching for system prompts >5K tokens
- Use auto-routing for 80% of queries
- Prune conversation history at 15-20 messages
- Compress tool outputs >1K tokens
- Use response profiles appropriately
- Monitor metrics weekly

### Don't ❌

- Don't disable optimizations without measuring impact
- Don't over-compress complex queries
- Don't ignore cache statistics
- Don't route complex queries to Haiku
- Don't skip response quality monitoring

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Cache Hit Rate | >85% | ~90% |
| Token Reduction | >70% | ~75-85% |
| Cost Reduction | >60% | ~62% |
| Response Time | <2s p95 | ~1.5s |
| Quality Score | >95% | ~96% |

## Support

### Documentation
- [Full Implementation Guide](./IMPLEMENTATION_COMPLETE.md)
- [Week 6 Details](./week-6-response-optimization.md)
- [Response Optimization README](../../lib/response/README.md)

### Examples
- [Response Examples](../../lib/response/examples.ts)
- [Usage Patterns](../../lib/response/__tests__/)

### Issues
- GitHub Issues: Tag with `token-optimization`
- Slack: #thebridge-optimization
