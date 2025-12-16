# Token Usage Analytics System

Comprehensive token usage tracking, cost calculation, and monitoring system for TheBridge.

## Overview

The analytics system tracks every API call to Claude, calculating costs and providing insights into usage patterns. It includes:

- Real-time token usage tracking
- Cost calculation per model (Sonnet/Opus/Haiku)
- Budget monitoring and alerts
- Usage anomaly detection
- Monthly cost projections
- Interactive dashboard with charts

## Architecture

### Database Models

#### TokenUsage
Tracks individual API calls:
- Token counts (input/output/thinking)
- Model information
- Cost calculations
- Conversation context
- Tools used
- Performance metrics

#### Budget
Per-user budget limits and alert thresholds:
- Monthly spending limits
- Configurable alert thresholds (50%, 75%, 90%)
- Alert tracking

#### UsageSnapshot
Pre-aggregated metrics for performance:
- Daily/weekly/monthly summaries
- Model breakdowns
- Success rates

### Modules

#### costCalculator.ts
Pricing and cost calculation utilities:
- Current pricing per model
- Cost breakdown by token type
- Monthly projections
- Model comparisons
- Token formatting

**Pricing (as of January 2025):**
- Sonnet 4: $3.00 input / $15.00 output per million tokens
- Opus 4: $15.00 input / $75.00 output per million tokens
- Haiku 3.5: $0.80 input / $4.00 output per million tokens

#### alerts.ts
Budget monitoring and anomaly detection:
- Budget threshold checks
- Usage spike detection
- Cost anomaly identification
- Alert notifications

#### tracking.ts
Token usage recording:
- Automatic tracking from chat API
- Batch tracking support
- Error handling

## Usage

### Dashboard

Display the dashboard component:

```tsx
import TokenUsageDashboard from '@/components/TokenUsageDashboard';

export default function AnalyticsPage() {
  return <TokenUsageDashboard />;
}
```

### API Endpoints

#### GET /api/analytics/tokens

Query token usage data:

**Query Parameters:**
- `range`: 'day' | 'week' | 'month' | 'year'
- `from`: YYYY-MM-DD (start date)
- `to`: YYYY-MM-DD (end date)
- `model`: 'sonnet' | 'opus' | 'haiku'
- `aggregation`: 'hourly' | 'daily' | 'weekly' | 'monthly'

**Response:**
```json
{
  "summary": {
    "totalCalls": 150,
    "totalTokens": 450000,
    "totalCost": 1350,
    "totalCostFormatted": "$13.50",
    "avgTokensPerCall": 3000,
    "avgCostPerCall": 9,
    "avgCostPerCallFormatted": "$0.09",
    "periodStart": "2025-01-01T00:00:00Z",
    "periodEnd": "2025-01-31T23:59:59Z",
    "periodDays": 31
  },
  "modelBreakdown": [...],
  "projection": {...},
  "timeSeries": [...],
  "alerts": [...],
  "anomalies": [...],
  "budget": {...}
}
```

### Programmatic Usage

#### Track Token Usage

Token usage is automatically tracked in the chat API. For custom tracking:

```typescript
import { trackTokenUsage } from '@/lib/analytics/tracking';

await trackTokenUsage({
  userId: 'user123',
  model: 'claude-sonnet-4-20250514',
  usage: {
    input_tokens: 1000,
    output_tokens: 500,
  },
  conversationId: 'conv123',
  toolsUsed: ['search', 'calculator'],
});
```

#### Calculate Costs

```typescript
import { calculateCost, formatCost } from '@/lib/analytics/costCalculator';

const breakdown = calculateCost('claude-sonnet-4-20250514', {
  inputTokens: 1000,
  outputTokens: 500,
  thinkingTokens: 200,
});

console.log(formatCost(breakdown.totalCostCents)); // "$0.01"
```

#### Check Budget Alerts

```typescript
import { getUserAlerts, getBudgetStatus } from '@/lib/analytics/alerts';

const alerts = await getUserAlerts('user123');
// {
//   budgetAlerts: [...],
//   anomalies: [...],
//   hasAlerts: true
// }

const budget = await getBudgetStatus('user123');
// {
//   spent: 5000,
//   limit: 10000,
//   remaining: 5000,
//   percentUsed: 50,
//   isOverBudget: false
// }
```

#### Update Budget Settings

```typescript
import { updateBudget } from '@/lib/analytics/alerts';

await updateBudget('user123', {
  monthlyLimitCents: 20000, // $200
  alertThreshold1: 60, // 60%
  alertThreshold2: 80, // 80%
  alertThreshold3: 95, // 95%
});
```

#### Project Monthly Costs

```typescript
import { projectMonthlyCost } from '@/lib/analytics/costCalculator';

const projection = projectMonthlyCost({
  totalCalls: 50,
  totalTokens: 150000,
  totalCostCents: 450,
  periodDays: 10,
});

console.log(projection.monthlyCostFormatted); // "$13.50"
```

## Database Migration

To apply the new schema:

```bash
npx prisma migrate dev --name add_token_analytics
npx prisma generate
```

## Configuration

### Alert Thresholds

Default budget alerts at:
- 50% - Info alert
- 75% - Warning alert
- 90% - Critical alert

Users can customize these thresholds.

### Anomaly Detection

Anomalies are detected when:
- Token usage >2x weekly average
- Cost >2x weekly average
- API calls >3x weekly average

### Budget Defaults

- Default monthly limit: $100 (10,000 cents)
- Can be customized per user

## Dashboard Features

The TokenUsageDashboard component provides:

1. **Real-time Metrics**
   - Total calls, tokens, and costs
   - Average cost per call
   - Time range selection (day/week/month)

2. **Budget Status**
   - Visual progress bar
   - Remaining budget
   - Over-budget warnings

3. **Alerts & Anomalies**
   - Budget threshold alerts
   - Usage spike detection
   - Cost anomaly warnings

4. **Visualizations**
   - Usage over time (line chart)
   - Model breakdown (pie chart)
   - Cost by model (bar chart)

5. **Projections**
   - Monthly projections based on current usage
   - Daily averages
   - Cost forecasting

6. **Detailed Tables**
   - Model-by-model breakdown
   - Token counts and costs
   - Percentage distributions

## Performance Considerations

- Token tracking is non-blocking (failures don't break chat)
- API queries are indexed for fast retrieval
- UsageSnapshot table for pre-aggregated data
- Efficient date range queries

## Security

- All queries are user-scoped
- Budget data is private per user
- Costs stored in cents to avoid float precision issues

## Future Enhancements

Potential additions:
- Email/Slack notifications for alerts
- Cost optimization recommendations
- Model performance comparisons
- Team-level analytics
- Export to CSV/Excel
- Custom date ranges
- Real-time WebSocket updates
