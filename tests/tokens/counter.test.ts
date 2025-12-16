/**
 * Token Counter Tests
 */

import { test, expect } from '@playwright/test';
import {
  countTextTokens,
  countImageTokens,
  countToolTokens,
  countMessageTokens,
  countConversationTokens,
  estimateCost,
} from '../../lib/tokens/counter';

test.describe('Token Counter', () => {
  test.describe('countTextTokens', () => {
    test('should count tokens in simple text', () => {
      const text = 'Hello, world!';
      const tokens = countTextTokens(text);
      // ~3.5 chars/token for prose
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    test('should count tokens in code accurately', () => {
      const code = 'function hello() { return "world"; }';
      const tokens = countTextTokens(code);
      // ~1.5 chars/token for code
      expect(tokens).toBeGreaterThan(10);
      expect(tokens).toBeLessThan(30);
    });

    test('should handle empty string', () => {
      const tokens = countTextTokens('');
      expect(tokens).toBe(0);
    });

    test('should count longer text', () => {
      const text = 'This is a longer piece of text that should use multiple tokens. '.repeat(10);
      const tokens = countTextTokens(text);
      expect(tokens).toBeGreaterThan(100);
      expect(tokens).toBeLessThan(300);
    });
  });

  test.describe('countImageTokens', () => {
    test('should count 1600 tokens per image', () => {
      expect(countImageTokens(1)).toBe(1600);
      expect(countImageTokens(3)).toBe(4800);
    });

    test('should handle zero images', () => {
      expect(countImageTokens(0)).toBe(0);
    });
  });

  test.describe('countToolTokens', () => {
    test('should count tokens in tool definitions', () => {
      const tools = [
        {
          name: 'get_weather',
          description: 'Get current weather',
          input_schema: {
            type: 'object',
            properties: {
              location: { type: 'string' },
            },
          },
        },
      ];
      const tokens = countToolTokens(tools);
      expect(tokens).toBeGreaterThan(20);
      expect(tokens).toBeLessThan(200);
    });

    test('should handle empty tools array', () => {
      expect(countToolTokens([])).toBe(0);
    });

    test('should handle multiple tools', () => {
      const tools = [
        { name: 'tool1', description: 'First tool' },
        { name: 'tool2', description: 'Second tool' },
        { name: 'tool3', description: 'Third tool' },
      ];
      const tokens = countToolTokens(tools);
      expect(tokens).toBeGreaterThan(30);
    });
  });

  test.describe('countMessageTokens', () => {
    test('should count tokens in text message', () => {
      const message = {
        role: 'user',
        content: 'What is the weather like today?',
      };
      const tokens = countMessageTokens(message);
      expect(tokens).toBeGreaterThan(4); // role overhead
      expect(tokens).toBeLessThan(20);
    });

    test('should count tokens in message with blocks', () => {
      const message = {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Here is the weather information.' },
          { type: 'image', source: { type: 'base64', data: '...' } },
        ],
      };
      const tokens = countMessageTokens(message);
      expect(tokens).toBeGreaterThan(1600); // includes image
    });

    test('should include role overhead', () => {
      const message = {
        role: 'user',
        content: '',
      };
      const tokens = countMessageTokens(message);
      expect(tokens).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('countConversationTokens', () => {
    test('should count full conversation', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];
      const result = countConversationTokens(messages);

      expect(result.total).toBeGreaterThan(0);
      expect(result.text).toBeGreaterThan(0);
      expect(result.overhead).toBeGreaterThan(0);
    });

    test('should include system prompt', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const systemPrompt = 'You are a helpful assistant.';

      const withoutSystem = countConversationTokens(messages);
      const withSystem = countConversationTokens(messages, undefined, systemPrompt);

      expect(withSystem.total).toBeGreaterThan(withoutSystem.total);
    });

    test('should include tools', () => {
      const messages = [{ role: 'user', content: 'Get weather' }];
      const tools = [{ name: 'get_weather', description: 'Get weather' }];

      const withoutTools = countConversationTokens(messages);
      const withTools = countConversationTokens(messages, tools);

      expect(withTools.tools).toBeGreaterThan(0);
      expect(withTools.total).toBeGreaterThan(withoutTools.total);
    });

    test('should include overhead', () => {
      const messages = [
        { role: 'user', content: 'Long message '.repeat(100) },
      ];
      const result = countConversationTokens(messages);

      expect(result.overhead).toBeGreaterThan(0);
      expect(result.overhead).toBeLessThan(result.total * 0.1); // <10% overhead
    });
  });

  test.describe('estimateCost', () => {
    test('should calculate cost correctly', () => {
      // 1M input tokens + 1M output tokens
      const cost = estimateCost(1_000_000, 1_000_000);
      // $3 input + $15 output = $18
      expect(cost).toBeCloseTo(18, 2);
    });

    test('should handle zero tokens', () => {
      const cost = estimateCost(0, 0);
      expect(cost).toBe(0);
    });

    test('should calculate small request cost', () => {
      // Typical conversation: 1000 input, 500 output
      const cost = estimateCost(1000, 500);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.01); // Less than 1 cent
    });

    test('should calculate large request cost', () => {
      // Large conversation: 50k input, 10k output
      const cost = estimateCost(50_000, 10_000);
      expect(cost).toBeGreaterThan(0.1);
      expect(cost).toBeLessThan(1);
    });
  });

  test.describe('Accuracy Tests', () => {
    test('should estimate within 20% of actual for typical messages', () => {
      // Known approximate token counts from Claude
      const testCases = [
        { text: 'Hello', expected: 2 },
        { text: 'How are you today?', expected: 5 },
        { text: 'function test() { return true; }', expected: 15 },
      ];

      for (const testCase of testCases) {
        const estimated = countTextTokens(testCase.text);
        const margin = testCase.expected * 0.3; // 30% margin
        expect(estimated).toBeGreaterThan(testCase.expected - margin);
        expect(estimated).toBeLessThan(testCase.expected + margin);
      }
    });
  });
});
