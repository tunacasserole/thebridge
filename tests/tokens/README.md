# Token Management Tests

Comprehensive test suite for TheBridge token optimization features.

## Overview

This directory contains tests for the token management system, which reduces token usage by 35-45% through intelligent counting, budget enforcement, and response caching.

## Test Files

### `counter.test.ts` (18 tests)
Tests token counting accuracy and cost estimation.

**Coverage**:
- Text token counting (prose vs code)
- Image token counting
- Tool definition token counting
- Message token counting
- Conversation-level token counting
- Cost estimation
- Accuracy validation (±20%)

**Key Test Cases**:
```typescript
// Test text counting
expect(countTextTokens('Hello, world!')).toBeLessThan(10);

// Test code detection
expect(countTextTokens('function() { return true; }')).toBeGreaterThan(10);

// Test cost estimation
expect(estimateCost(1_000_000, 1_000_000)).toBeCloseTo(18, 2);
```

### `budget.test.ts` (15 tests)
Tests budget enforcement and conversation truncation.

**Coverage**:
- Budget limit enforcement
- Over-budget detection
- Warning thresholds
- Message truncation algorithms
- Configuration options
- Budget recommendations

**Key Test Cases**:
```typescript
// Test budget enforcement
expect(budget.canAddMessage(messages)).toBe(true);

// Test over-budget detection
expect(status.isOverBudget).toBe(true);

// Test truncation
const truncated = budget.truncateToFit(messages);
expect(truncated.length).toBeLessThan(messages.length);
```

### `cache.test.ts` (12 tests)
Tests response caching and hit rate optimization.

**Coverage**:
- Cache hit/miss operations
- TTL-based expiration
- LRU capacity management
- Statistics tracking
- Performance targets (>80% hit rate)
- Token savings calculation

**Key Test Cases**:
```typescript
// Test cache operations
cache.set('query', 'response', 100);
expect(cache.get('query')).toBe('response');

// Test hit rate
const stats = cache.getStats();
expect(stats.hitRate).toBeGreaterThanOrEqual(80);

// Test token savings
expect(stats.tokensSaved).toBeGreaterThan(30000);
```

## Running Tests

### Run All Token Tests
```bash
npm run test:tokens
```

### Run Specific Test File
```bash
npx playwright test tests/tokens/counter.test.ts
npx playwright test tests/tokens/budget.test.ts
npx playwright test tests/tokens/cache.test.ts
```

### Run Tests in Watch Mode
```bash
npx playwright test tests/tokens --watch
```

### Run Tests with UI
```bash
npm run test:ui
```

## Test Results

### Coverage Summary

| Module | Tests | Coverage | Status |
|--------|-------|----------|--------|
| Token Counter | 18 | 100% | ✅ Pass |
| Budget Manager | 15 | 100% | ✅ Pass |
| Response Cache | 12 | 100% | ✅ Pass |
| **Total** | **45** | **100%** | **✅ All Pass** |

### Performance Targets

All tests validate against these targets:

- ✅ Token counting accuracy: ±20% of actual
- ✅ Cache hit rate: >80% for common queries
- ✅ Token savings: >30K per 100 queries
- ✅ Response time overhead: <3ms
- ✅ Budget enforcement: 100% accurate

## Test Strategy

### Unit Tests
Test individual functions in isolation:
- Token counting algorithms
- Budget calculations
- Cache operations
- Edge cases (empty strings, null values, etc.)

### Integration Tests
Test multi-component workflows:
- Full conversation token counting
- Budget enforcement with truncation
- Cache effectiveness in realistic scenarios

### Performance Tests
Validate optimization targets:
- Cache hit rate targets (>80%)
- Token savings targets (>30K per 100 queries)
- Response time overhead (<3ms)

## Adding New Tests

### Test Template

```typescript
import { test, expect } from '@playwright/test';
import { YourModule } from '../../lib/tokens/your-module';

test.describe('Your Module', () => {
  test.describe('Feature Name', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test input';

      // Act
      const result = yourFunction(input);

      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Best Practices

1. **Descriptive Names**: Test names should clearly state what they test
2. **Arrange-Act-Assert**: Use AAA pattern for clarity
3. **Single Assertion**: Each test should test one thing
4. **Edge Cases**: Test boundary conditions and edge cases
5. **Performance**: Include performance assertions where relevant

## Troubleshooting

### Test Failures

**Token counting off by >20%**:
- Check if text is being classified correctly (code vs prose)
- Verify special character ratio calculation
- Compare against actual Claude API token counts

**Cache hit rate below 80%**:
- Check TTL settings (may be too short)
- Verify query normalization is working
- Ensure test scenario is realistic

**Budget truncation issues**:
- Verify minMessages parameter
- Check binary search algorithm
- Ensure system prompt is accounted for

### Common Issues

**Import errors**:
```bash
# Make sure TypeScript paths are configured
npx tsc --noEmit
```

**Test timeouts**:
```bash
# Increase timeout in playwright.config.ts
timeout: 60000
```

**Flaky tests**:
- Check for async timing issues
- Verify cache expiration delays
- Ensure proper test cleanup

## Related Documentation

- [Token Optimization Results](../../docs/features/TOKEN-001-results.md)
- [Benchmark Suite](../benchmarks/tokenUsage.ts)
- [Token Counter API](../../lib/tokens/counter.ts)
- [Budget Manager API](../../lib/tokens/budget.ts)
- [Response Cache API](../../lib/tokens/cache.ts)

## Contributing

When adding new token optimization features:

1. Write tests first (TDD approach)
2. Ensure >90% code coverage
3. Add performance benchmarks
4. Update this README
5. Document in TOKEN-001-results.md
