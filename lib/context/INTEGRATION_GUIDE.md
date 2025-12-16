# Context Management Integration Guide

Step-by-step guide to integrate the context management system into the chat API.

## Quick Integration (Recommended)

### Step 1: Add Context Manager to Chat Route

Add at the top of `/app/api/chat/route.ts`:

```typescript
import { createChatContextManager } from '@/lib/context/chatIntegration';
```

### Step 2: Create Context Manager Instance

Inside the `POST` function, after getting the Anthropic client:

```typescript
// Get client for this request (supports per-user API keys)
const anthropic = await getAnthropicClient();

// Create context manager with the client
const contextManager = createChatContextManager(anthropic);
```

### Step 3: Process Conversation History

Replace the message building section with context-managed messages:

```typescript
// OLD CODE:
// Build messages array for Claude
const messages: Anthropic.MessageParam[] = [];

// Add conversation history
for (const msg of conversationHistory as ConversationMessage[]) {
  messages.push({
    role: msg.role,
    content: msg.content,
  });
}

// NEW CODE:
// Process conversation history with context management
const contextResult = await contextManager.processConversationHistory(
  conversationHistory as ConversationMessage[],
  {
    enableContextManagement: conversationHistory.length > 20, // Enable for long conversations
    strategy: 'hybrid', // Use adaptive hybrid strategy
    enableCompression: true,
    enableRetrieval: conversationId ? true : false, // Enable RAG if we have conversation ID
    maxContextTokens: 150000,
  },
  conversationId
);

// Use the optimized messages
const messages: Anthropic.MessageParam[] = contextResult.messages;

// Log token savings
console.log('[Chat] Context management applied:');
console.log('  - Original messages:', contextResult.stats.originalMessages);
console.log('  - Processed messages:', contextResult.stats.processedMessages);
console.log('  - Tokens saved:', contextResult.tokensSaved);
console.log('  - Strategy used:', contextResult.strategy);
```

### Step 4: Add Current User Message

After context processing, add the current message as before:

```typescript
// Add current user message with files
const userMessageContent: Anthropic.ContentBlockParam[] = [];

// ... existing file handling code ...

messages.push({
  role: 'user',
  content: userMessageContent,
});
```

## Full Example Implementation

Here's a complete example of the modified chat route with context management:

```typescript
export async function POST(request: NextRequest) {
  try {
    const {
      message,
      conversationHistory = [],
      enabledTools = [],
      extendedThinking = false,
      model = 'sonnet',
      verbose = false,
      files = [],
      conversationId,
      // NEW: Context management options
      enableContextManagement = true,
      contextStrategy = 'hybrid',
    } = await request.json();

    // ... validation and setup ...

    // Get Anthropic client
    const anthropic = await getAnthropicClient();

    // Create context manager
    const contextManager = createChatContextManager(anthropic);

    // Determine if context management should be applied
    const shouldApplyContext = enableContextManagement &&
      contextManager.shouldApplyContextManagement(
        conversationHistory.length,
        undefined // We could estimate tokens here
      );

    // Process conversation history
    let messages: Anthropic.MessageParam[];
    let tokensSaved = 0;

    if (shouldApplyContext) {
      const contextResult = await contextManager.processConversationHistory(
        conversationHistory as ConversationMessage[],
        {
          enableContextManagement: true,
          strategy: contextStrategy,
          enableCompression: true,
          enableRetrieval: conversationId ? true : false,
          maxContextTokens: 150000,
        },
        conversationId
      );

      messages = contextResult.messages;
      tokensSaved = contextResult.tokensSaved;

      console.log('[Chat] Context management:', {
        original: contextResult.stats.originalMessages,
        processed: contextResult.stats.processedMessages,
        tokensSaved: contextResult.tokensSaved,
        strategy: contextResult.strategy,
      });
    } else {
      // No context management - use messages as-is
      messages = conversationHistory.map((msg: ConversationMessage) => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    // Add current user message
    const userMessageContent: Anthropic.ContentBlockParam[] = [];

    // ... existing file handling code ...

    messages.push({
      role: 'user',
      content: userMessageContent,
    });

    // Continue with existing agent loop...
    // ... rest of the function ...

  } catch (error) {
    // ... error handling ...
  }
}
```

## Configuration Options

### Client-Side Configuration

Add these optional parameters to the chat request:

```typescript
interface ChatRequest {
  // ... existing fields ...

  // Context management options
  enableContextManagement?: boolean;  // Enable/disable context management
  contextStrategy?: 'sliding-window' | 'summarization' | 'retrieval-augmented' | 'hybrid';
  maxContextTokens?: number;          // Maximum tokens for context
}
```

### Server-Side Defaults

Set default configuration in the chat route:

```typescript
const DEFAULT_CONTEXT_CONFIG = {
  enableContextManagement: true,
  strategy: 'hybrid',
  enableCompression: true,
  enableRetrieval: true,
  maxContextTokens: 150000,
};
```

## Testing the Integration

### Test with Short Conversation

```typescript
// Should use sliding-window or no context management
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Hello',
    conversationHistory: [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ],
    enableContextManagement: true,
  }),
});
```

### Test with Long Conversation

```typescript
// Should use hybrid strategy with compression and retrieval
const longHistory = generateLongHistory(300); // 300 messages

const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: 'What did we discuss about authentication?',
    conversationHistory: longHistory,
    conversationId: 'test-conversation-123',
    enableContextManagement: true,
    contextStrategy: 'hybrid',
  }),
});
```

## Monitoring and Metrics

### Add Logging

```typescript
console.log('[Chat Context]', {
  originalMessages: contextResult.stats.originalMessages,
  processedMessages: contextResult.stats.processedMessages,
  originalTokens: contextResult.stats.originalTokens,
  processedTokens: contextResult.stats.processedTokens,
  tokensSaved: contextResult.tokensSaved,
  savingsPercentage: (contextResult.tokensSaved / contextResult.stats.originalTokens * 100).toFixed(1) + '%',
  strategy: contextResult.strategy,
});
```

### Stream Context Stats to Client

Include context stats in the done event:

```typescript
controller.enqueue(
  encoder.encode(
    `data: ${JSON.stringify({
      type: 'done',
      response: finalResponse,
      toolCalls: toolCallsHistory,
      iterations,
      conversationId,
      contextStats: {
        tokensSaved: contextResult.tokensSaved,
        strategy: contextResult.strategy,
        messagesProcessed: contextResult.stats.processedMessages,
      },
    })}\n\n`
  )
);
```

## Performance Considerations

### When to Enable Context Management

```typescript
// Enable for conversations with:
// 1. More than 20 messages
// 2. Estimated tokens > 50k
// 3. User preference

const shouldEnable =
  conversationHistory.length > 20 ||
  estimatedTokens > 50000 ||
  userSettings.enableContextManagement;
```

### Strategy Selection

```typescript
// Automatically select strategy based on conversation state
const strategy = contextManager.getRecommendedStrategy(
  conversationHistory.length,
  estimatedTokens,
  !!conversationId
);
```

### Caching Considerations

For frequently accessed conversations, consider caching the processed context:

```typescript
// Cache key based on conversation ID and message count
const cacheKey = `context:${conversationId}:${conversationHistory.length}`;

// Try to get from cache
let processedContext = await cache.get(cacheKey);

if (!processedContext) {
  // Process and cache
  processedContext = await contextManager.processConversationHistory(...);
  await cache.set(cacheKey, processedContext, { ttl: 300 }); // 5 min TTL
}
```

## Rollout Strategy

### Phase 1: Opt-in Beta

```typescript
// Enable only for specific users
const enableContextManagement =
  userSettings.betaFeatures?.includes('context-management') || false;
```

### Phase 2: Gradual Rollout

```typescript
// Enable based on percentage
const enableContextManagement =
  Math.random() < 0.5; // 50% of requests
```

### Phase 3: Full Rollout

```typescript
// Enable for all users with automatic detection
const enableContextManagement = true;
```

## Troubleshooting

### Issue: High Memory Usage

**Solution:** Limit the number of messages processed at once:

```typescript
const config = {
  maxContextTokens: 100000, // Lower limit
  strategy: 'sliding-window', // Use simpler strategy
};
```

### Issue: Slow Response Times

**Solution:** Use faster compression strategy:

```typescript
const config = {
  strategy: 'sliding-window', // Fastest
  enableCompression: false,   // Disable AI compression
};
```

### Issue: Context Loss

**Solution:** Increase preserved messages:

```typescript
import { createWindowManager } from '@/lib/context';

const windowManager = createWindowManager({
  preserveMessages: 20, // Keep more recent messages
});
```

## Migration Path

### Existing Conversations

For conversations created before context management:

1. **No Change Required:** System works with existing message format
2. **Gradual Optimization:** Messages are optimized on-the-fly
3. **Database Compatible:** Uses existing conversation/message schema

### Backward Compatibility

The system is fully backward compatible:

```typescript
// Without context management (existing behavior)
const messages = conversationHistory.map(msg => ({
  role: msg.role,
  content: msg.content,
}));

// With context management (new behavior)
const { messages } = await contextManager.processConversationHistory(
  conversationHistory,
  config,
  conversationId
);

// Both produce valid Anthropic.MessageParam[]
```

## Next Steps

After integration:

1. **Monitor Token Usage:** Track savings across conversations
2. **Gather Metrics:** Measure performance impact
3. **User Feedback:** Collect feedback on conversation quality
4. **Optimize Configuration:** Tune thresholds based on real usage
5. **Consider Embeddings:** Implement semantic search for better retrieval

## Support

For questions or issues:

1. Check the main [README.md](./README.md)
2. Review inline code documentation
3. Test with the provided examples
4. Open an issue with reproduction steps
