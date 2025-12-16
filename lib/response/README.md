# Response Optimization System

Comprehensive response optimization for TheBridge to reduce output token usage while maintaining response quality.

## Overview

The Response Optimization System provides three key capabilities:

1. **Length Control** - Adaptive max_tokens based on query type and complexity
2. **Response Templates** - Structured output schemas for common query types
3. **Response Compression** - Post-processing to remove verbosity and extract key information

## Modules

### 1. Length Controller (`lengthController.ts`)

Optimizes the `max_tokens` parameter based on query analysis and context.

#### Key Features

- **Query Analysis**: Automatically detects query type and complexity
- **Response Profiles**: Three profiles (concise, standard, detailed)
- **Adaptive Tokens**: Adjusts based on conversation length and file attachments
- **Thinking Budget**: Optimizes extended thinking token allocation

#### Usage

```typescript
import { getResponseLengthConfig } from '@/lib/response';

const config = getResponseLengthConfig({
  message: "What's the status of service X?",
  profile: 'concise', // Optional: 'concise' | 'standard' | 'detailed'
  conversationLength: 5,
  hasFiles: false,
  toolsEnabled: true,
});

// Use in API call
const response = await anthropic.messages.create({
  max_tokens: config.maxTokens,
  thinking: {
    type: 'enabled',
    budget_tokens: config.thinkingBudget,
  },
  // ... other params
});
```

#### Response Profiles

| Profile | Max Tokens | Use Case |
|---------|-----------|----------|
| **concise** | 1,024 | Quick answers, status checks, yes/no questions |
| **standard** | 4,096 | Normal conversations, moderate detail |
| **detailed** | 8,192 | Complex analysis, comprehensive responses |

#### Query Type Detection

Automatically detects query types and adjusts tokens:

- **Yes/No**: 256 tokens - "Is X working?"
- **Status Check**: 512 tokens - "What's the status of X?"
- **List**: 1,024 tokens - "List all X"
- **Simple Query**: 1,024 tokens - Basic data retrieval
- **Analysis**: 4,096 tokens - "Analyze X"
- **Troubleshooting**: 6,144 tokens - "Why is X failing?"
- **Comprehensive**: 8,192 tokens - "Explain everything about X"

#### Context Adjustments

- **Long conversations** (>10 messages): -20% tokens
- **Very long conversations** (>20 messages): -40% tokens
- **With file attachments**: +20% tokens
- **With tools enabled**: +50% tokens

#### Expected Savings

- **Simple queries**: 75-87% token reduction (8,192 → 1,024-2,048)
- **Medium queries**: 25-50% token reduction (8,192 → 4,096)
- **Complex queries**: Minimal reduction (maintains quality)

### 2. Response Templates (`templates.ts`)

Provides structured output schemas using Zod to constrain response format.

#### Key Features

- **Standard Templates**: Pre-defined formats for common queries
- **Zod Schemas**: Type-safe structured responses
- **Template Selection**: Automatic template selection based on query
- **Format Validation**: Ensures responses match expected structure

#### Available Templates

##### Status Check
```typescript
{
  status: 'healthy' | 'degraded' | 'down' | 'unknown',
  details: string, // max 500 chars
  actionRequired: boolean,
  recommendation?: string, // max 200 chars
}
```

##### Error Analysis
```typescript
{
  error: string, // max 300 chars
  cause: string, // max 500 chars
  solution: string[], // array of steps, max 200 chars each
  prevention?: string, // max 300 chars
  severity: 'low' | 'medium' | 'high' | 'critical'
}
```

##### List Items
```typescript
{
  total: number,
  items: Array<{ id, name, status? }>, // max 50 items
  summary: string, // max 200 chars
}
```

##### Yes/No
```typescript
{
  answer: boolean,
  reason: string, // max 200 chars
  confidence?: number, // 0-1
}
```

##### Metric Analysis
```typescript
{
  metric: string,
  currentValue: string | number,
  trend: 'up' | 'down' | 'stable',
  status: 'normal' | 'warning' | 'critical',
  recommendation?: string, // max 300 chars
  threshold?: { value: number, breached: boolean }
}
```

#### Usage

```typescript
import { getTemplateInstruction, selectTemplate } from '@/lib/response';

// Get template instruction to add to system prompt
const instruction = getTemplateInstruction("What's the status of service X?");

// Enhanced system prompt
const systemPrompt = `${BASE_PROMPT}

Response Guidelines:
${instruction}

Be concise and direct.`;

// Select template programmatically
const { template, schema } = selectTemplate("Is service X healthy?");
// template: 'yes_no'
// schema: YesNoSchema
```

#### Expected Savings

- **Structured responses**: 30-50% token reduction through format constraints
- **Template adherence**: Eliminates verbose explanations and preambles
- **Schema validation**: Ensures responses stay within defined limits

### 3. Response Compressor (`compressor.ts`)

Post-processes responses to remove verbosity and extract key information.

#### Key Features

- **Multiple Compression Modes**: none, light, moderate, aggressive
- **Auto Compression**: Automatically selects mode based on length
- **Summary Extraction**: Extracts key points and summary
- **Stream Compression**: Processes streaming responses in real-time
- **Selective Compression**: Preserves important sections (code blocks, etc.)

#### Compression Modes

| Mode | Token Reduction | Use Case |
|------|----------------|----------|
| **none** | 0% | Responses <500 tokens |
| **light** | 10-20% | Removes basic verbosity (500-1,500 tokens) |
| **moderate** | 20-40% | Removes examples and redundancy (1,500-3,000 tokens) |
| **aggressive** | 40-60% | Extracts only key points (>3,000 tokens) |

#### Usage

```typescript
import { compressResponse, autoCompress } from '@/lib/response';

// Manual compression
const result = compressResponse(responseText, 'moderate');
console.log(`Original: ${result.originalLength} chars`);
console.log(`Compressed: ${result.compressedLength} chars`);
console.log(`Saved: ${result.tokensRemoved} tokens`);

// Auto compression (selects mode based on length)
const auto = autoCompress(responseText);

// Extract summary only
import { extractSummary } from '@/lib/response';
const summary = extractSummary(responseText, 500); // max 500 chars
```

#### Stream Compression

```typescript
import { StreamCompressor } from '@/lib/response';

const compressor = new StreamCompressor('light');

// Process streaming chunks
for await (const chunk of stream) {
  const compressed = compressor.processChunk(chunk);
  // Send compressed chunk to client
}

// Flush remaining buffer
const final = compressor.flush();
```

#### Verbose Phrases Removed

- "I'll help you with that."
- "Let me help you"
- "I understand that you want to"
- "Based on your request,"
- "As you can see,"
- "It's important to note that"
- "Please note that"
- "I hope this helps!"
- "Feel free to ask if you have any questions."
- "Let me know if you need anything else."
- "Is there anything else I can help you with?"

#### Expected Savings

- **Light compression**: 10-20% token reduction
- **Moderate compression**: 20-40% token reduction
- **Aggressive compression**: 40-60% token reduction
- **Summary extraction**: 70-90% token reduction (for previews)

## Integration with Chat API

The response optimization system is integrated into `/app/api/chat/route.ts`:

```typescript
// 1. Get optimized configuration
const lengthConfig = getResponseLengthConfig({
  message,
  profile: responseProfile,
  conversationLength: conversationHistory.length,
  hasFiles: files.length > 0,
  toolsEnabled: tools.length > 0,
});

// 2. Enhance system prompt with template instructions
const templateInstruction = getTemplateInstruction(message);
const enhancedSystemPrompt = `${SYSTEM_PROMPT}

Response Guidelines:
${templateInstruction}

Be concise and direct. Avoid unnecessary preambles or verbose explanations.`;

// 3. Use optimized parameters in API call
const response = await anthropic.messages.create({
  model: modelId,
  max_tokens: lengthConfig.maxTokens,
  system: enhancedSystemPrompt,
  messages,
  thinking: {
    type: 'enabled',
    budget_tokens: lengthConfig.thinkingBudget,
  },
});

// 4. Early termination for complete responses
if (isComplete && hasSubstantiveContent) {
  console.log('[Chat] Early termination - complete response received');
  break;
}
```

## Overall Expected Savings

### Output Token Reduction

Based on query type distribution:

| Query Type | % of Queries | Avg Tokens Before | Avg Tokens After | Reduction |
|------------|-------------|-------------------|------------------|-----------|
| Simple (yes/no, status) | 30% | 8,192 | 512-1,024 | 87-93% |
| Medium (lists, queries) | 40% | 8,192 | 2,048-4,096 | 50-75% |
| Complex (analysis) | 20% | 8,192 | 4,096-6,144 | 25-50% |
| Comprehensive | 10% | 8,192 | 6,144-8,192 | 0-25% |

**Weighted Average Reduction**: **50-60%**

### Cost Savings

Assuming Claude Sonnet 4 pricing ($3.00 per million output tokens):

- **Before**: 8,192 avg tokens × 1,000 queries = 8.2M tokens = $24.58
- **After**: 3,686 avg tokens × 1,000 queries = 3.7M tokens = $11.06
- **Savings**: $13.52 per 1,000 queries (55% reduction)

### Additional Benefits

1. **Faster Response Times**: Shorter responses = faster generation
2. **Better User Experience**: More concise, direct answers
3. **Reduced Context Window Usage**: Leaves more room for conversation history
4. **Lower Latency**: Early termination reduces unnecessary generation

## Testing

```typescript
// Test length controller
import { getResponseLengthConfig } from '@/lib/response';

const tests = [
  'Is service X healthy?', // Should be concise (256-512 tokens)
  'List all active alerts', // Should be standard (1,024-2,048 tokens)
  'Analyze the performance degradation', // Should be detailed (4,096+ tokens)
];

for (const query of tests) {
  const config = getResponseLengthConfig({ message: query });
  console.log(`Query: ${query}`);
  console.log(`Profile: ${config.profile}, Tokens: ${config.maxTokens}`);
}
```

```typescript
// Test compression
import { compressResponse } from '@/lib/response';

const verboseResponse = `I'll help you with that. Based on your request, I understand that you want to check the status. The service is currently healthy. I hope this helps! Let me know if you need anything else.`;

const result = compressResponse(verboseResponse, 'moderate');
console.log('Original:', verboseResponse);
console.log('Compressed:', result.compressed);
console.log('Saved:', result.tokensRemoved, 'tokens');
```

## Best Practices

1. **Use Response Profiles**: Specify `responseProfile` in API requests for predictable behavior
2. **Let Auto-Detection Work**: The system is smart about detecting query types
3. **Monitor Token Usage**: Log actual token usage to validate savings
4. **Combine Techniques**: Use length control + templates + compression together
5. **Test Edge Cases**: Ensure quality is maintained for complex queries
6. **Iterate Based on Feedback**: Adjust thresholds based on user feedback

## Monitoring and Metrics

Track these metrics to measure effectiveness:

```typescript
// Track in production
const metrics = {
  queriesProcessed: 0,
  totalTokensSaved: 0,
  avgCompressionRatio: 0,
  profileDistribution: {
    concise: 0,
    standard: 0,
    detailed: 0,
  },
};
```

## Future Enhancements

1. **Learning System**: Adapt thresholds based on actual usage patterns
2. **User Preferences**: Allow users to set default response profile
3. **A/B Testing**: Compare response quality across different modes
4. **Custom Templates**: Allow defining custom templates for specific domains
5. **Streaming Compression**: Real-time compression of streaming responses
