# Token Management System - Quick Reference

## Overview

The token management system provides comprehensive tracking, budgeting, and optimization for Claude API usage in TheBridge.

## Core Components

### 1. Token Estimator (`estimator.ts`)

Accurate token counting and cost estimation before making API calls.

```typescript
import {
  estimateTokens,
  estimateRequestTokens,
  estimateCost,
  formatTokenCount,
  formatCost
} from '@/lib/tokens/estimator';

// Estimate text tokens
const tokens = estimateTokens("Your message here");
console.log(formatTokenCount(tokens)); // "150 tokens"

// Estimate full request
const estimate = estimateRequestTokens({
  system: SYSTEM_PROMPT,
  messages: conversationHistory,
  tools: mcpTools,
  maxTokens: 8192
});

// Calculate cost
const cost = estimateCost({
  model: 'claude-sonnet-4-20250514',
  inputTokens: estimate.totalInputTokens,
  outputTokens: 2000
});
console.log(formatCost(cost)); // "$0.0450"
```

### 2. Token Budget Manager (`budget.ts`)

Enforce token limits at conversation and user levels.

```typescript
import { TokenBudget } from '@/lib/tokens/budget';

const budget = new TokenBudget({
  maxTokensPerConversation: 100_000,
  maxTokensPerMessage: 8_192,
  maxTokensPerRequest: 200_000,
  warningThreshold: 0.8
});

// Check conversation budget
const status = budget.getStatus(messages, tools, systemPrompt);
if (status.isOverBudget) {
  const truncated = budget.truncateToFit(messages, tools, systemPrompt);
  // Use truncated messages
}

// Check user monthly budget
const userStatus = await budget.getUserBudgetStatus(userId);
if (userStatus?.isNearLimit) {
  console.warn(`Budget at ${userStatus.percentUsed.toFixed(1)}%`);
}

// Check if request allowed
const check = await budget.canUserMakeRequest(userId, estimatedCostCents);
if (!check.allowed) {
  throw new Error(check.reason);
}
```

### 3. Token Counter (`counter.ts`)

Low-level token counting with code detection.

```typescript
import {
  countTextTokens,
  countConversationTokens,
  estimateCost
} from '@/lib/tokens/counter';

// Count text (detects code vs prose)
const tokens = countTextTokens("function hello() {}"); // Uses 1.5 chars/token for code

// Count full conversation
const count = countConversationTokens(messages, tools, systemPrompt);
console.log(`Total: ${count.total} tokens`);
console.log(`Breakdown: ${count.text} text, ${count.tools} tools`);

// Estimate cost
const cost = estimateCost(count.total, outputTokens);
console.log(`Estimated cost: $${cost.toFixed(4)}`);
```

### 4. Token Tracking Middleware (`../middleware/tokenTracking.ts`)

Track and log token usage to database.

```typescript
import {
  TokenTracker,
  logTokenUsage,
  getUserMonthlyUsage
} from '@/lib/middleware/tokenTracking';

// Using TokenTracker class
const tracker = new TokenTracker(userId, conversationId, agentSlug, modelId);
tracker.addToolCall('get-incident-details');
await tracker.logUsage({
  inputTokens: 1500,
  outputTokens: 800,
  success: true
});

// Direct logging
await logTokenUsage({
  userId,
  model: 'claude-sonnet-4-20250514',
  modelType: 'sonnet',
  inputTokens: 1500,
  outputTokens: 800,
  conversationId,
  toolsUsed: ['tool1', 'tool2'],
  success: true
});

// Get monthly usage
const usage = await getUserMonthlyUsage(userId);
console.log(`${usage.totalCalls} calls, ${usage.totalTokens} tokens, $${(usage.totalCostCents / 100).toFixed(2)}`);
```

## Budget Management

### Setting User Budgets

```typescript
import { TokenBudget } from '@/lib/tokens/budget';

const budget = new TokenBudget();

// Set monthly budget
await budget.setUserBudget(
  userId,
  10000, // $100 in cents
  {
    threshold1: 50,  // Alert at 50%
    threshold2: 75,  // Alert at 75%
    threshold3: 90   // Alert at 90%
  }
);
```

### Checking Budget Status

```typescript
// Get current status
const status = await budget.getUserBudgetStatus(userId);

if (status) {
  console.log(`
    Used: $${(status.totalCostCents / 100).toFixed(2)}
    Limit: $${(status.limitCents / 100).toFixed(2)}
    Percent: ${status.percentUsed.toFixed(1)}%
    Tokens: ${status.totalTokens}
    Calls: ${status.totalCalls}
  `);

  if (status.isOverBudget) {
    // Budget exceeded
  } else if (status.isNearLimit) {
    // Approaching limit
  }
}
```

## Token Pricing (as of Dec 2024)

| Model | Input (per MTok) | Output (per MTok) |
|-------|------------------|-------------------|
| Claude Sonnet 4 | $3.00 | $15.00 |
| Claude Opus 4 | $15.00 | $75.00 |
| Claude Haiku 3.5 | $0.80 | $4.00 |

## Database Schema

### TokenUsage Model

Tracks every API request:
- Token counts (input, output, thinking, total)
- Model information
- Cost in cents
- Conversation/user/agent context
- Tools used
- Performance metrics

### Budget Model

Per-user monthly budgets:
- Monthly limit in cents
- Alert thresholds (50%, 75%, 90%)
- Alert tracking

### UsageSnapshot Model

Aggregated analytics:
- Daily/weekly/monthly summaries
- Total calls, tokens, costs
- By-model breakdowns
- Success rates

## Best Practices

### 1. Always Estimate Before Calling

```typescript
// Pre-flight check
const estimate = estimateRequestTokens({...});
const cost = estimateCost({...});
const check = await budget.canUserMakeRequest(userId, Math.round(cost * 100));

if (check.allowed) {
  // Make API call
  const response = await anthropic.messages.create({...});
  // Track actual usage
  await tracker.logUsage({...});
}
```

### 2. Handle Budget Limits Gracefully

```typescript
if (!check.allowed) {
  return Response.json({
    error: 'Monthly budget exceeded',
    message: check.reason,
    usage: check.status
  }, { status: 429 }); // Too Many Requests
}
```

### 3. Truncate Long Conversations

```typescript
const status = budget.getStatus(messages, tools, systemPrompt);

if (status.isNearLimit) {
  // Keep last N messages
  const truncated = budget.truncateToFit(messages, tools, systemPrompt, 5);
  // Use truncated for API call
}
```

### 4. Monitor and Alert

```typescript
const usage = await getUserMonthlyUsage(userId);

if (usage.percentUsed && usage.percentUsed > 80) {
  // Send warning email/notification
  await sendBudgetAlert(userId, usage);
}
```

## Common Patterns

### Pattern 1: Request with Budget Check

```typescript
async function chatWithBudgetCheck(userId: string, message: string) {
  const budget = new TokenBudget();

  // Estimate
  const estimate = estimateRequestTokens({...});
  const cost = estimateCost({...});

  // Check budget
  const check = await budget.canUserMakeRequest(userId, Math.round(cost * 100));
  if (!check.allowed) {
    throw new Error('Budget exceeded');
  }

  // Track
  const tracker = new TokenTracker(userId, conversationId);

  // Make request
  const response = await anthropic.messages.create({...});

  // Log usage
  await tracker.logUsage({
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    success: true
  });

  return response;
}
```

### Pattern 2: Conversation Management

```typescript
async function manageConversation(messages: Message[]) {
  const budget = new TokenBudget();

  // Check conversation length
  const status = budget.getStatus(messages, tools, systemPrompt);

  if (status.isOverBudget) {
    // Truncate to fit
    messages = budget.truncateToFit(messages, tools, systemPrompt);
    console.warn('Conversation truncated:', budget.getRecommendation(status));
  }

  return messages;
}
```

### Pattern 3: Usage Dashboard

```typescript
async function getUserUsageDashboard(userId: string) {
  const budget = new TokenBudget();
  const [status, usage] = await Promise.all([
    budget.getUserBudgetStatus(userId),
    getUserMonthlyUsage(userId)
  ]);

  return {
    currentMonth: {
      calls: usage.totalCalls,
      tokens: usage.totalTokens,
      cost: usage.totalCostCents / 100,
      budget: usage.budgetLimitCents ? usage.budgetLimitCents / 100 : null,
      percentUsed: usage.percentUsed
    },
    status: status?.isOverBudget ? 'exceeded' :
            status?.isNearLimit ? 'warning' : 'ok',
    recommendation: status ? budget.getRecommendation(status) : 'OK'
  };
}
```

## Troubleshooting

### Issue: Estimates don't match actual usage

Token estimation uses heuristics (~3.5 chars/token). Actual tokenization may vary:
- Use estimates for pre-flight checks only
- Always log actual usage from API response
- Monitor estimation accuracy over time

### Issue: Budget warnings not triggering

Check:
1. Budget is set: `await budget.setUserBudget(userId, limitCents)`
2. Tracking is enabled: Verify `logTokenUsage` is being called
3. Database is accessible: Check Prisma connection

### Issue: High token consumption

Use token counter to identify issues:
```typescript
const count = countConversationTokens(messages, tools, systemPrompt);
console.log('Token breakdown:', {
  text: count.text,
  tools: count.tools,
  overhead: count.overhead
});

// Optimize:
// - Reduce system prompt length
// - Truncate conversation history
// - Minimize tool definitions
// - Use shorter model responses
```

## API Reference

See full API documentation in:
- `estimator.ts` - Token estimation
- `budget.ts` - Budget management
- `counter.ts` - Token counting
- `../middleware/tokenTracking.ts` - Usage tracking
- `../analytics/tracking.ts` - Analytics integration

## Related Documentation

- [Token Management Week 2 Report](../../docs/token-management-week2.md)
- [Prisma Schema](../../prisma/schema.prisma)
- [Analytics System](../analytics/)
