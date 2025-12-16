/**
 * Tests for Response Length Controller
 */

import {
  analyzeQuery,
  getOptimalMaxTokens,
  adjustForContext,
  getThinkingBudget,
  enforceTokenLimits,
  getResponseLengthConfig,
} from '../lengthController';

describe('Length Controller', () => {
  describe('analyzeQuery', () => {
    it('detects simple yes/no questions', () => {
      const queries = [
        'Is the service healthy?',
        'Are there any errors?',
        'Can you check the status?',
        'Does this work?',
      ];

      queries.forEach((query) => {
        const analysis = analyzeQuery(query);
        expect(analysis.type).toBe('simple');
        expect(analysis.requiresDetail).toBe(false);
        expect(analysis.estimatedComplexity).toBeLessThan(0.3);
      });
    });

    it('detects status check queries', () => {
      const queries = [
        'What is the status of service X?',
        'Check status of deployment',
        'Status of the system',
      ];

      queries.forEach((query) => {
        const analysis = analyzeQuery(query);
        expect(analysis.type).toBe('simple');
        expect(analysis.estimatedComplexity).toBeLessThan(0.3);
      });
    });

    it('detects list requests', () => {
      const queries = [
        'List all active alerts',
        'Show me all errors',
        'Get all running services',
      ];

      queries.forEach((query) => {
        const analysis = analyzeQuery(query);
        expect(analysis.type).toBe('data_retrieval');
        expect(analysis.requiresDetail).toBe(true);
      });
    });

    it('detects analysis requests', () => {
      const queries = [
        'Analyze the performance issue',
        'Investigate why the service is slow',
        'What caused the outage?',
      ];

      queries.forEach((query) => {
        const analysis = analyzeQuery(query);
        expect(analysis.type).toBe('analysis');
        expect(analysis.requiresDetail).toBe(true);
        expect(analysis.estimatedComplexity).toBeGreaterThan(0.5);
      });
    });

    it('detects comprehensive requests', () => {
      const queries = [
        'Explain everything about the system architecture',
        'Provide a comprehensive analysis',
        'Give me a detailed report on performance',
      ];

      queries.forEach((query) => {
        const analysis = analyzeQuery(query);
        expect(analysis.type).toBe('complex');
        expect(analysis.estimatedComplexity).toBeGreaterThan(0.8);
      });
    });
  });

  describe('getOptimalMaxTokens', () => {
    it('returns concise profile for simple queries', () => {
      const config = getOptimalMaxTokens('Is the service healthy?', undefined, false);

      expect(config.profile).toBe('concise');
      expect(config.maxTokens).toBeLessThan(2048);
    });

    it('returns standard profile for medium queries', () => {
      const config = getOptimalMaxTokens('List all active alerts', undefined, false);

      expect(config.profile).toBe('standard');
      expect(config.maxTokens).toBeGreaterThanOrEqual(1024);
      expect(config.maxTokens).toBeLessThanOrEqual(4096);
    });

    it('returns detailed profile for complex queries', () => {
      const config = getOptimalMaxTokens('Analyze the performance degradation', undefined, false);

      expect(config.profile).toBe('detailed');
      expect(config.maxTokens).toBeGreaterThanOrEqual(4096);
    });

    it('applies tool multiplier when tools are enabled', () => {
      const withoutTools = getOptimalMaxTokens('List all alerts', undefined, false);
      const withTools = getOptimalMaxTokens('List all alerts', undefined, true);

      expect(withTools.maxTokens).toBeGreaterThan(withoutTools.maxTokens);
    });

    it('respects preferred profile', () => {
      const config = getOptimalMaxTokens(
        'Analyze the system',
        'concise',
        false
      );

      expect(config.profile).toBe('concise');
    });
  });

  describe('adjustForContext', () => {
    const baseConfig = {
      maxTokens: 4096,
      profile: 'standard' as const,
      queryType: 'simple',
    };

    it('reduces tokens for long conversations', () => {
      const short = adjustForContext(baseConfig, 5, false);
      const long = adjustForContext(baseConfig, 15, false);
      const veryLong = adjustForContext(baseConfig, 25, false);

      expect(long).toBeLessThan(short);
      expect(veryLong).toBeLessThan(long);
    });

    it('increases tokens when files are present', () => {
      const withoutFiles = adjustForContext(baseConfig, 5, false);
      const withFiles = adjustForContext(baseConfig, 5, true);

      expect(withFiles).toBeGreaterThan(withoutFiles);
    });

    it('enforces minimum floor', () => {
      const verySmall = { ...baseConfig, maxTokens: 100 };
      const adjusted = adjustForContext(verySmall, 30, false);

      expect(adjusted).toBeGreaterThanOrEqual(256);
    });
  });

  describe('getThinkingBudget', () => {
    it('scales budget based on complexity', () => {
      const maxTokens = 16000; // Plenty of room for all budgets
      const low = getThinkingBudget(0.2, maxTokens);
      const medium = getThinkingBudget(0.5, maxTokens);
      const high = getThinkingBudget(0.9, maxTokens);

      expect(low).toBeLessThan(medium);
      expect(medium).toBeLessThan(high);
    });

    it('returns 2000 for simple queries', () => {
      expect(getThinkingBudget(0.1, 16000)).toBe(2000);
    });

    it('returns 10000 for complex queries', () => {
      expect(getThinkingBudget(0.8, 16000)).toBe(10000);
    });

    it('constrains budget to be less than maxTokens', () => {
      // When maxTokens is low, budget should be constrained
      const smallMax = 4096;
      const budget = getThinkingBudget(0.9, smallMax);

      // Budget should be less than maxTokens (leaves room for response)
      expect(budget).toBeLessThan(smallMax);
    });

    it('ensures budget never exceeds maxTokens - 1024', () => {
      const maxTokens = 2048;
      const budget = getThinkingBudget(0.9, maxTokens);

      // Should cap at maxTokens - 1024 to leave room for response
      expect(budget).toBeLessThanOrEqual(maxTokens - 1024);
    });
  });

  describe('enforceTokenLimits', () => {
    it('enforces minimum', () => {
      expect(enforceTokenLimits(100)).toBe(256);
    });

    it('enforces maximum', () => {
      expect(enforceTokenLimits(10000)).toBe(8192);
    });

    it('allows valid values', () => {
      expect(enforceTokenLimits(2048)).toBe(2048);
    });

    describe('with extended thinking', () => {
      it('enforces higher minimum for extended thinking', () => {
        expect(enforceTokenLimits(100, true)).toBe(4096);
        expect(enforceTokenLimits(2048, true)).toBe(4096);
      });

      it('allows higher maximum for extended thinking', () => {
        expect(enforceTokenLimits(12000, true)).toBe(12000);
        expect(enforceTokenLimits(20000, true)).toBe(16000);
      });
    });
  });

  describe('getResponseLengthConfig', () => {
    it('provides complete configuration', () => {
      const config = getResponseLengthConfig({
        message: 'Is the service healthy?',
        conversationLength: 5,
        hasFiles: false,
        toolsEnabled: false,
      });

      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('thinkingBudget');
      expect(config).toHaveProperty('profile');
      expect(config).toHaveProperty('analysis');
      expect(config.maxTokens).toBeGreaterThanOrEqual(256);
      expect(config.maxTokens).toBeLessThanOrEqual(8192);
    });

    it('adjusts for conversation length', () => {
      const shortConv = getResponseLengthConfig({
        message: 'List all alerts',
        conversationLength: 2,
        hasFiles: false,
        toolsEnabled: false,
      });

      const longConv = getResponseLengthConfig({
        message: 'List all alerts',
        conversationLength: 25,
        hasFiles: false,
        toolsEnabled: false,
      });

      expect(longConv.maxTokens).toBeLessThan(shortConv.maxTokens);
    });

    it('increases tokens for tools and files', () => {
      const baseline = getResponseLengthConfig({
        message: 'Analyze performance',
        conversationLength: 5,
        hasFiles: false,
        toolsEnabled: false,
      });

      const withToolsAndFiles = getResponseLengthConfig({
        message: 'Analyze performance',
        conversationLength: 5,
        hasFiles: true,
        toolsEnabled: true,
      });

      expect(withToolsAndFiles.maxTokens).toBeGreaterThan(baseline.maxTokens);
    });

    it('increases tokens for extended thinking mode', () => {
      const withoutThinking = getResponseLengthConfig({
        message: 'Analyze the system',
        conversationLength: 5,
        hasFiles: false,
        toolsEnabled: false,
        extendedThinking: false,
      });

      const withThinking = getResponseLengthConfig({
        message: 'Analyze the system',
        conversationLength: 5,
        hasFiles: false,
        toolsEnabled: false,
        extendedThinking: true,
      });

      expect(withThinking.maxTokens).toBeGreaterThan(withoutThinking.maxTokens);
      // Critical: thinkingBudget must ALWAYS be less than maxTokens
      expect(withThinking.thinkingBudget).toBeLessThan(withThinking.maxTokens);
    });

    it('ensures thinkingBudget is always less than maxTokens', () => {
      // Test various scenarios to ensure constraint is always met
      const scenarios = [
        { message: 'Is it working?', extendedThinking: true },
        { message: 'Analyze everything comprehensively', extendedThinking: true },
        { message: 'List all items', extendedThinking: true },
      ];

      scenarios.forEach((scenario) => {
        const config = getResponseLengthConfig({
          ...scenario,
          conversationLength: 0,
          hasFiles: false,
          toolsEnabled: false,
        });

        expect(config.thinkingBudget).toBeLessThan(config.maxTokens);
      });
    });
  });
});
