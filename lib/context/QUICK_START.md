# Context Management Quick Start

## 🚀 5-Minute Setup

### Installation

No installation needed - already part of TheBridge!

### Basic Usage

```typescript
import { createContextManager } from '@/lib/context';

const manager = createContextManager();

// Optimize your conversation history
const result = await manager.prepareContextForClaude(messages, {
  strategy: 'hybrid',
  enableCompression: true,
  conversationId: 'your-conversation-id',
});

// Use the optimized messages
const claudeMessages = result.messages;
console.log(`Saved ${result.estimatedTokens} tokens using ${result.strategy}`);
```

## 📊 When to Use

| Conversation Size | Recommended Strategy | Expected Savings |
|-------------------|---------------------|------------------|
| <50 messages | `sliding-window` | 10-30% |
| 50-200 messages | `summarization` | 40-60% |
| 200+ messages | `retrieval-augmented` | 50-70% |
| 500+ messages | `hybrid` | 60-80% |

## 🎯 Common Patterns

### Pattern 1: Chat API Integration

```typescript
import { createChatContextManager } from '@/lib/context/chatIntegration';

const chatManager = createChatContextManager(anthropicClient);

const result = await chatManager.processConversationHistory(
  conversationHistory,
  {
    enableContextManagement: conversationHistory.length > 20,
    strategy: 'hybrid',
    enableCompression: true,
    enableRetrieval: !!conversationId,
  },
  conversationId
);
```

### Pattern 2: Custom Window Size

```typescript
import { createWindowManager } from '@/lib/context';

const windowManager = createWindowManager({
  targetTokens: 100000,  // Smaller window
  preserveMessages: 15,  // Keep more recent messages
});

const result = windowManager.truncateToFit(messages);
```

### Pattern 3: AI-Powered Compression

```typescript
import { createCompressor } from '@/lib/context';

const compressor = createCompressor({
  strategy: 'ai-summarization',
  anthropicClient: client,
  targetRatio: 0.6,  // 60% compression
});

const result = await compressor.compressMessages(messages);
```

### Pattern 4: Relevant Context Retrieval

```typescript
import { createRetriever } from '@/lib/context';

const retriever = createRetriever();

const result = await retriever.retrieveRelevantContext({
  conversationId: 'conv-123',
  query: 'authentication error',
  maxMessages: 10,
  minRelevanceScore: 0.4,
});
```

## ⚙️ Configuration

### Default Settings

```typescript
{
  maxTokens: 180000,           // Claude's context limit
  targetTokens: 150000,        // Safe target
  preserveMessages: 10,        // Always keep last 10
  compressionThreshold: 120000, // Compress above this
  retrievalThreshold: 100000,   // Use RAG above this
}
```

### Custom Configuration

```typescript
const manager = createContextManager();

manager.updateConfig({
  targetTokens: 120000,        // More aggressive
  preserveMessages: 15,        // Keep more context
  compressionThreshold: 80000, // Compress earlier
});
```

## 🎨 Strategies Explained

### Sliding Window
- **What**: Keep only recent messages
- **When**: Short conversations
- **Speed**: <10ms
- **Savings**: 10-30%

### Summarization
- **What**: Compress older messages
- **When**: Medium conversations
- **Speed**: 10-500ms
- **Savings**: 40-60%

### Retrieval-Augmented
- **What**: Fetch relevant context from DB
- **When**: Long conversations with history
- **Speed**: ~100ms
- **Savings**: 50-70%

### Hybrid (Recommended)
- **What**: Combines all strategies
- **When**: Very long conversations
- **Speed**: 100-500ms
- **Savings**: 60-80%

## 🔍 Monitoring

### Check Token Savings

```typescript
const result = await manager.prepareContextForClaude(messages);

console.log({
  strategy: result.strategy,
  originalTokens: messages.length * 250, // Rough estimate
  finalTokens: result.estimatedTokens,
  messageCount: result.messages.length,
});
```

### Get Context Statistics

```typescript
const stats = manager.getContextStats(messages);

console.log({
  totalMessages: stats.totalMessages,
  totalTokens: stats.totalTokens,
  avgPerMessage: stats.avgTokensPerMessage,
  recommendedStrategy: stats.strategy,
});
```

## ⚡ Performance Tips

### 1. Enable Only When Needed

```typescript
const shouldOptimize = conversationHistory.length > 20;

if (shouldOptimize) {
  const result = await manager.prepareContextForClaude(messages);
  // Use optimized messages
} else {
  // Use original messages
}
```

### 2. Choose Right Strategy

```typescript
const strategy = conversationHistory.length > 200
  ? 'hybrid'
  : conversationHistory.length > 50
  ? 'summarization'
  : 'sliding-window';
```

### 3. Cache Processed Context

```typescript
const cacheKey = `context:${conversationId}:${messages.length}`;
let processed = cache.get(cacheKey);

if (!processed) {
  processed = await manager.prepareContextForClaude(messages);
  cache.set(cacheKey, processed, 300); // 5 min TTL
}
```

## 🐛 Troubleshooting

### Issue: Token usage still high

**Solution**: Use more aggressive settings
```typescript
{
  targetTokens: 100000,        // Lower target
  strategy: 'hybrid',          // Use all optimizations
  enableCompression: true,     // Enable AI compression
}
```

### Issue: Context quality degraded

**Solution**: Preserve more messages
```typescript
{
  preserveMessages: 20,        // Keep more recent
  compressionThreshold: 150000, // Compress less aggressively
}
```

### Issue: Processing too slow

**Solution**: Use simpler strategy
```typescript
{
  strategy: 'sliding-window',  // Fastest
  enableCompression: false,    // Skip AI calls
}
```

## 📚 Full Documentation

- **Complete Guide**: `lib/context/README.md`
- **Integration Steps**: `lib/context/INTEGRATION_GUIDE.md`
- **Week 5 Summary**: `lib/context/WEEK5_SUMMARY.md`
- **API Reference**: Inline documentation in source files

## 🧪 Testing

```bash
# Run token savings tests
npm test lib/context/__tests__/tokenSavings.test.ts
```

## 🎓 Examples

Check these files for complete examples:
- `lib/context/__tests__/tokenSavings.test.ts` - Usage examples
- `lib/context/INTEGRATION_GUIDE.md` - Integration examples
- `lib/context/chatIntegration.ts` - Real-world usage

## 💡 Pro Tips

1. **Always enable for 200+ message conversations**
2. **Use hybrid strategy for maximum savings**
3. **Enable retrieval when you have conversation history in DB**
4. **Monitor token savings to tune configuration**
5. **Cache processed contexts for repeated access**

## 🆘 Need Help?

1. Read the full [README](./README.md)
2. Check [Integration Guide](./INTEGRATION_GUIDE.md)
3. Review [test examples](./__tests__/tokenSavings.test.ts)
4. Open an issue with your use case

---

**Ready to save tokens?** Start with the basic usage example above! 🚀
