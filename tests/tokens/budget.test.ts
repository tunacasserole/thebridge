/**
 * Token Budget Tests
 */

import { test, expect } from '@playwright/test';
import { TokenBudget } from '../../lib/tokens/budget';

test.describe('Token Budget', () => {
  test.describe('canAddMessage', () => {
    test('should allow messages within budget', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 10000 });
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      expect(budget.canAddMessage(messages)).toBe(true);
    });

    test('should reject messages exceeding budget', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 100 });
      const messages = [
        { role: 'user', content: 'Very long message '.repeat(100) },
      ];

      expect(budget.canAddMessage(messages)).toBe(false);
    });

    test('should account for tools in budget', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 1000 });
      const messages = [{ role: 'user', content: 'Get weather' }];
      const tools = Array(50).fill({
        name: 'tool',
        description: 'A tool with a long description that takes tokens',
      });

      expect(budget.canAddMessage(messages, tools)).toBe(false);
    });
  });

  test.describe('getStatus', () => {
    test('should report accurate token usage', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 10000 });
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ];

      const status = budget.getStatus(messages);

      expect(status.used).toBeGreaterThan(0);
      expect(status.limit).toBe(10000);
      expect(status.remaining).toBeLessThan(10000);
      expect(status.percentUsed).toBeGreaterThan(0);
      expect(status.percentUsed).toBeLessThan(100);
    });

    test('should detect over budget', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 50 });
      const messages = [
        { role: 'user', content: 'Very long message '.repeat(20) },
      ];

      const status = budget.getStatus(messages);

      expect(status.isOverBudget).toBe(true);
      expect(status.remaining).toBe(0);
    });

    test('should detect near limit', () => {
      const budget = new TokenBudget({
        maxTokensPerConversation: 100,
        warningThreshold: 0.8,
      });

      // Create message that uses ~85 tokens
      const messages = [
        { role: 'user', content: 'Message that uses about 85 tokens '.repeat(4) },
      ];

      const status = budget.getStatus(messages);

      expect(status.isNearLimit).toBe(true);
      expect(status.percentUsed).toBeGreaterThan(80);
    });

    test('should not flag normal usage as near limit', () => {
      const budget = new TokenBudget({
        maxTokensPerConversation: 10000,
        warningThreshold: 0.8,
      });

      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ];

      const status = budget.getStatus(messages);

      expect(status.isNearLimit).toBe(false);
      expect(status.percentUsed).toBeLessThan(10);
    });
  });

  test.describe('truncateToFit', () => {
    test('should keep all messages if within budget', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 10000 });
      const messages = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'assistant', content: 'Response 2' },
      ];

      const truncated = budget.truncateToFit(messages);

      expect(truncated.length).toBe(messages.length);
    });

    test('should truncate old messages when over budget', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 200 });
      const messages = [
        { role: 'user', content: 'Old message '.repeat(20) },
        { role: 'assistant', content: 'Old response '.repeat(20) },
        { role: 'user', content: 'Recent message' },
        { role: 'assistant', content: 'Recent response' },
      ];

      const truncated = budget.truncateToFit(messages);

      expect(truncated.length).toBeLessThan(messages.length);
      expect(truncated[truncated.length - 1].content).toBe('Recent response');
    });

    test('should keep minimum messages', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 50 });
      const messages = [
        { role: 'user', content: 'Message 1 '.repeat(30) },
        { role: 'assistant', content: 'Response 1 '.repeat(30) },
        { role: 'user', content: 'Message 2 '.repeat(30) },
      ];

      const truncated = budget.truncateToFit(messages, undefined, undefined, 2);

      expect(truncated.length).toBeGreaterThanOrEqual(2);
    });

    test('should account for system prompt in truncation', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 500 });
      const systemPrompt = 'You are a helpful assistant. '.repeat(10);
      const messages = Array(20)
        .fill(null)
        .map((_, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
        }));

      const truncated = budget.truncateToFit(messages, undefined, systemPrompt);

      expect(truncated.length).toBeLessThan(messages.length);
      expect(budget.canAddMessage(truncated, undefined, systemPrompt)).toBe(true);
    });
  });

  test.describe('getRecommendation', () => {
    test('should recommend truncation when over budget', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 50 });
      const messages = [
        { role: 'user', content: 'Very long message '.repeat(50) },
      ];

      const status = budget.getStatus(messages);
      const recommendation = budget.getRecommendation(status);

      expect(recommendation).toContain('TRUNCATE');
    });

    test('should warn when near limit', () => {
      const budget = new TokenBudget({
        maxTokensPerConversation: 100,
        warningThreshold: 0.8,
      });

      const messages = [
        { role: 'user', content: 'Message '.repeat(50) },
      ];

      const status = budget.getStatus(messages);
      const recommendation = budget.getRecommendation(status);

      expect(recommendation).toContain('WARNING');
    });

    test('should show caution at 50%', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 100 });
      const messages = [
        { role: 'user', content: 'Message '.repeat(25) },
      ];

      const status = budget.getStatus(messages);
      const recommendation = budget.getRecommendation(status);

      expect(recommendation).toContain('CAUTION');
    });

    test('should show OK for normal usage', () => {
      const budget = new TokenBudget({ maxTokensPerConversation: 10000 });
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ];

      const status = budget.getStatus(messages);
      const recommendation = budget.getRecommendation(status);

      expect(recommendation).toContain('OK');
    });
  });

  test.describe('Configuration', () => {
    test('should use default config', () => {
      const budget = new TokenBudget();
      const messages: { role: string; content: string }[] = [];
      const status = budget.getStatus(messages);

      expect(status.limit).toBe(100_000); // default
    });

    test('should use custom config', () => {
      const budget = new TokenBudget({
        maxTokensPerConversation: 5000,
        maxTokensPerMessage: 1000,
        warningThreshold: 0.7,
      });

      const messages: { role: string; content: string }[] = [];
      const status = budget.getStatus(messages);

      expect(status.limit).toBe(5000);
    });
  });
});
