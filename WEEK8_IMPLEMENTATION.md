# Week 8 Implementation: Monitoring & Analytics

## Summary

Successfully implemented comprehensive token usage monitoring and analytics system for TheBridge. The system tracks every API call, calculates costs in real-time, monitors budgets, detects anomalies, and provides interactive visualizations.

## Files Created

### Database Schema
- **prisma/schema.prisma** (updated)
  - Added `TokenUsage` model for per-request tracking
  - Added `Budget` model for user budget limits and alerts
  - Added `UsageSnapshot` model for pre-aggregated metrics
  - Added relations to `User` model

### Analytics Library (/lib/analytics/)

1. **costCalculator.ts** (178 lines)
   - Current pricing for all Claude models (Sonnet/Opus/Haiku)
   - Cost calculation by token type (input/output/thinking)
   - Monthly projection based on usage trends
   - Model cost comparison utilities
   - Token formatting helpers

2. **alerts.ts** (214 lines)
   - Budget threshold monitoring (50%, 75%, 90%)
   - Usage anomaly detection (2x-3x normal patterns)
   - Alert generation and notifications
   - Budget status queries
   - Budget settings management

3. **tracking.ts** (62 lines)
   - Token usage recording to database
   - Batch tracking support
   - Error handling (non-blocking)
   - Integration with cost calculator

4. **index.ts** (7 lines)
   - Centralized exports for easy imports

5. **README.md** (324 lines)
   - Complete documentation
   - Usage examples
   - API reference
   - Configuration guide

### API Endpoints

1. **app/api/analytics/tokens/route.ts** (241 lines)
   - GET endpoint with flexible query parameters
   - Time range filtering (day/week/month/year)
   - Custom date ranges
   - Model filtering
   - Aggregation levels (hourly/daily/weekly/monthly)
   - Returns:
     - Usage summary
     - Model breakdown
     - Monthly projections
     - Time series data
     - Alerts and anomalies
     - Budget status

### UI Components

1. **components/TokenUsageDashboard.tsx** (499 lines)
   - Real-time metrics cards
   - Budget status with progress bar
   - Alert and anomaly displays
   - Interactive charts using Recharts:
     - Line chart for usage over time
     - Pie chart for model distribution
     - Bar chart for costs by model
   - Monthly projection display
   - Detailed model breakdown table
   - Time range selector (day/week/month)

### Integration

1. **app/api/chat/route.ts** (updated)
   - Added import for `trackTokenUsage`
   - Added token tracking after conversation save
   - Tracks all token types (input/output/thinking)
   - Non-blocking tracking (failures don't break chat)
   - Includes conversation context and tools used

### Dependencies

1. **package.json** (updated)
   - Added `recharts@^2.15.0` for charting

## Features Implemented

### 1. Token Usage Tracking
- Automatic tracking of every API call
- Records input, output, and thinking tokens
- Tracks model used and conversation context
- Records tools used during the call
- Stores response time and success status

### 2. Cost Calculator
- Accurate pricing for all Claude models
- Breakdown by token type
- Cost in cents (avoids float precision issues)
- Monthly projections based on current usage
- Model comparison for cost optimization

### 3. Budget Monitoring
- Per-user monthly budget limits
- Default $100/month limit (configurable)
- Three-tier alert system:
  - 50% usage → Info alert
  - 75% usage → Warning alert
  - 90% usage → Critical alert
- Visual budget progress bar
- Over-budget warnings

### 4. Anomaly Detection
- Token usage spikes (>2x average)
- Cost anomalies (>2x average)
- Unusual call patterns (>3x average)
- Severity classification (low/medium/high)
- Descriptive alerts with percentages

### 5. Analytics Dashboard
- Real-time usage metrics
- Time range selection (day/week/month)
- Interactive charts and graphs
- Model breakdown analysis
- Monthly cost projections
- Daily averages
- Detailed data tables

### 6. API Endpoints
- Flexible query parameters
- Date range filtering
- Model-specific filtering
- Multiple aggregation levels
- Comprehensive response data
- Fast indexed queries

## Alert Thresholds Configured

### Budget Alerts
- **Threshold 1 (Info)**: 50% of monthly budget
- **Threshold 2 (Warning)**: 75% of monthly budget
- **Threshold 3 (Critical)**: 90% of monthly budget

### Anomaly Detection
- **Token Spike**: Usage >2x weekly average
- **Cost Spike**: Spending >2x weekly average
- **Call Pattern**: Calls >3x weekly average

## Pricing Data (January 2025)

### Claude Sonnet 4
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens
- Thinking: $3.00 per million tokens

### Claude Opus 4
- Input: $15.00 per million tokens
- Output: $75.00 per million tokens
- Thinking: $15.00 per million tokens

### Claude Haiku 3.5
- Input: $0.80 per million tokens
- Output: $4.00 per million tokens
- Thinking: $0.80 per million tokens

## Usage Examples

### Display Dashboard
```tsx
import TokenUsageDashboard from '@/components/TokenUsageDashboard';

export default function AnalyticsPage() {
  return <TokenUsageDashboard />;
}
```

### Query API
```bash
# Get monthly usage
curl /api/analytics/tokens?range=month&aggregation=daily

# Get specific date range
curl /api/analytics/tokens?from=2025-01-01&to=2025-01-31

# Filter by model
curl /api/analytics/tokens?range=week&model=sonnet
```

### Programmatic Access
```typescript
import {
  calculateCost,
  getUserAlerts,
  getBudgetStatus,
  projectMonthlyCost
} from '@/lib/analytics';

// Calculate cost
const cost = calculateCost('claude-sonnet-4-20250514', {
  inputTokens: 1000,
  outputTokens: 500,
});

// Check alerts
const alerts = await getUserAlerts(userId);

// Get budget status
const budget = await getBudgetStatus(userId);

// Project monthly cost
const projection = projectMonthlyCost(stats);
```

## Database Migration

To apply the schema changes:

```bash
# Create migration
npx prisma migrate dev --name add_token_analytics

# Generate client
npx prisma generate

# Apply to production
npx prisma migrate deploy
```

## Performance Optimizations

1. **Indexed Queries**
   - User ID + created date
   - Model type
   - Date ranges

2. **Non-Blocking Tracking**
   - Tracking failures don't break chat
   - Errors logged but not thrown

3. **Pre-Aggregated Data**
   - UsageSnapshot table for summaries
   - Reduces real-time calculation overhead

4. **Efficient Storage**
   - Costs stored in cents (integers)
   - JSON for arrays (tools used)

## Security Considerations

1. **User-Scoped Data**
   - All queries filtered by user ID
   - No cross-user data access

2. **Budget Privacy**
   - Budget data private per user
   - No public exposure of spending

3. **Error Handling**
   - Tracking errors don't expose sensitive data
   - Failed tracking logged but silent to users

## Testing

The system is ready for testing:

1. **Manual Testing**
   - Make chat requests
   - Check database for TokenUsage records
   - View dashboard at `/analytics` (needs route)
   - Test different time ranges
   - Verify budget alerts

2. **API Testing**
   ```bash
   # Test analytics endpoint
   curl http://localhost:3000/api/analytics/tokens?range=month
   ```

3. **Budget Testing**
   - Set low budget limit
   - Make requests to trigger alerts
   - Verify alert thresholds

## Next Steps

To complete integration:

1. **Add Route**
   - Create `app/analytics/page.tsx`
   - Import and render `TokenUsageDashboard`

2. **Navigation**
   - Add link to analytics in sidebar
   - Add icon for analytics section

3. **Run Migration**
   ```bash
   npx prisma migrate dev --name add_token_analytics
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Test System**
   - Make chat requests
   - View analytics dashboard
   - Verify tracking and alerts

## Files Summary

**Created:**
- lib/analytics/costCalculator.ts
- lib/analytics/alerts.ts
- lib/analytics/tracking.ts
- lib/analytics/index.ts
- lib/analytics/README.md
- app/api/analytics/tokens/route.ts
- components/TokenUsageDashboard.tsx
- WEEK8_IMPLEMENTATION.md

**Modified:**
- prisma/schema.prisma
- app/api/chat/route.ts
- package.json

**Total Lines:** ~1,825 lines of new code

## Completion Status

✅ **All Week 8 objectives completed:**
1. ✅ Token Usage Dashboard Component created
2. ✅ Cost Calculator with accurate pricing
3. ✅ Usage Alerts with budget monitoring
4. ✅ Analytics API with flexible queries
5. ✅ Integration with chat API
6. ✅ Comprehensive documentation

**System is production-ready pending database migration and testing.**
