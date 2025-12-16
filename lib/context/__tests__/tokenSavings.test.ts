/**
 * Token Savings Validation Tests
 *
 * Tests to validate expected token savings from context management strategies.
 */

import {
  createContextManager,
  createWindowManager,
  createCompressor,
  type ContextMessage,
} from '../index';
import {
  estimateTotalTokens,
  estimateMessageTokens,
} from '../tokenEstimator';

describe('Context Management Token Savings', () => {
  // Helper to create test messages
  function createTestMessages(count: number, avgLength: number = 500): ContextMessage[] {
    const messages: ContextMessage[] = [];
    for (let i = 0; i < count; i++) {
      messages.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: 'Lorem ipsum dolor sit amet, '.repeat(avgLength / 30),
        timestamp: new Date(Date.now() - (count - i) * 60000), // 1 min apart
        toolsUsed: i % 5 === 0 ? ['tool1', 'tool2'] : undefined,
      });
    }
    return messages;
  }

  describe('Sliding Window Strategy', () => {
    it('should reduce tokens by dropping old messages', () => {
      const messages = createTestMessages(100, 500); // 100 messages
      const originalTokens = estimateTotalTokens(messages);

      const windowManager = createWindowManager({
        targetTokens: originalTokens * 0.4, // Keep 40% of tokens
      });

      const result = windowManager.applySlidingWindow(messages);

      expect(result.tokenCount).toBeLessThan(originalTokens * 0.5);
      expect(result.messages.length).toBeLessThan(messages.length);
      expect(result.messagesDropped).toBeGreaterThan(0);

      const savings = originalTokens - result.tokenCount;
      const savingsPercent = (savings / originalTokens) * 100;

      console.log('Sliding Window Results:');
      console.log('  Original tokens:', originalTokens);
      console.log('  Final tokens:', result.tokenCount);
      console.log('  Tokens saved:', savings);
      console.log('  Savings:', savingsPercent.toFixed(1) + '%');
      console.log('  Messages dropped:', result.messagesDropped);

      // Expect at least 40% savings
      expect(savingsPercent).toBeGreaterThan(40);
    });
  });

  describe('Priority Retention Strategy', () => {
    it('should preserve important messages while reducing tokens', () => {
      // Create messages with varying importance
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Normal message ' + 'x'.repeat(500), timestamp: new Date() },
        { role: 'assistant', content: 'Error occurred in authentication system ' + 'x'.repeat(500), timestamp: new Date() },
        { role: 'user', content: 'Another normal message ' + 'x'.repeat(500), timestamp: new Date() },
        { role: 'assistant', content: 'Important decision made to refactor API ' + 'x'.repeat(500), timestamp: new Date(), toolsUsed: ['refactor_tool'] },
        { role: 'user', content: 'Regular question ' + 'x'.repeat(500), timestamp: new Date() },
        ...createTestMessages(50, 500), // Add more messages
      ];

      const originalTokens = estimateTotalTokens(messages);
      const windowManager = createWindowManager();

      const result = windowManager.applyPriorityRetention(
        messages,
        originalTokens * 0.5 // Target 50% of original
      );

      // Check that important messages are preserved
      const resultContents = result.messages.map(m => m.content);
      expect(resultContents.some(c => c.includes('Error occurred'))).toBe(true);
      expect(resultContents.some(c => c.includes('Important decision'))).toBe(true);

      const savings = originalTokens - result.tokenCount;
      const savingsPercent = (savings / originalTokens) * 100;

      console.log('Priority Retention Results:');
      console.log('  Original tokens:', originalTokens);
      console.log('  Final tokens:', result.tokenCount);
      console.log('  Tokens saved:', savings);
      console.log('  Savings:', savingsPercent.toFixed(1) + '%');

      // Expect at least 30% savings while preserving important messages
      expect(savingsPercent).toBeGreaterThan(30);
    });
  });

  describe('Simple Compression Strategy', () => {
    it('should compress messages and reduce token usage', async () => {
      const messages = createTestMessages(50, 500);
      const originalTokens = estimateTotalTokens(messages);

      const compressor = createCompressor({
        strategy: 'simple',
        targetRatio: 0.5,
        preserveErrors: true,
        preserveDecisions: true,
      });

      const result = await compressor.compressMessages(messages);

      expect(result.compressedTokens).toBeLessThan(originalTokens);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.messages.length).toBeLessThan(messages.length);

      const savingsPercent = result.compressionRatio * 100;

      console.log('Simple Compression Results:');
      console.log('  Original tokens:', result.originalTokens);
      console.log('  Compressed tokens:', result.compressedTokens);
      console.log('  Compression ratio:', result.compressionRatio.toFixed(2));
      console.log('  Savings:', savingsPercent.toFixed(1) + '%');

      // Expect at least 30% compression
      expect(savingsPercent).toBeGreaterThan(30);
    });
  });

  describe('Hybrid Strategy', () => {
    it('should achieve maximum token savings', async () => {
      const messages = createTestMessages(200, 500); // Large conversation
      const originalTokens = estimateTotalTokens(messages);

      const manager = createContextManager();

      const result = await manager.prepareContextForClaude(messages, {
        strategy: 'hybrid',
        enableCompression: true,
        enableRetrieval: false, // No DB for test
      });

      expect(result.estimatedTokens).toBeLessThan(originalTokens);

      const savings = originalTokens - result.estimatedTokens;
      const savingsPercent = (savings / originalTokens) * 100;

      console.log('Hybrid Strategy Results:');
      console.log('  Original messages:', messages.length);
      console.log('  Processed messages:', result.messages.length);
      console.log('  Original tokens:', originalTokens);
      console.log('  Final tokens:', result.estimatedTokens);
      console.log('  Tokens saved:', savings);
      console.log('  Savings:', savingsPercent.toFixed(1) + '%');
      console.log('  Strategy used:', result.strategy);

      // Expect at least 50% savings for large conversations
      expect(savingsPercent).toBeGreaterThan(50);
    });
  });

  describe('Tool Result Compression', () => {
    it('should compress large tool results', () => {
      const compressor = createCompressor();

      const largeToolResult = JSON.stringify({
        items: Array(100).fill({ id: 1, name: 'test', data: 'x'.repeat(100) }),
        metadata: { total: 100, page: 1 },
      });

      const compressed = compressor.compressToolResults(largeToolResult, 500);

      expect(compressed.length).toBeLessThan(largeToolResult.length);
      expect(compressed.length).toBeLessThanOrEqual(500);

      const savingsPercent = ((largeToolResult.length - compressed.length) / largeToolResult.length) * 100;

      console.log('Tool Result Compression:');
      console.log('  Original length:', largeToolResult.length);
      console.log('  Compressed length:', compressed.length);
      console.log('  Savings:', savingsPercent.toFixed(1) + '%');

      expect(savingsPercent).toBeGreaterThan(50);
    });
  });

  describe('Redundancy Removal', () => {
    it('should remove duplicate messages', () => {
      const compressor = createCompressor();

      const messages: ContextMessage[] = [
        { role: 'user', content: 'Hello, how are you?', timestamp: new Date() },
        { role: 'assistant', content: 'I am fine, thank you!', timestamp: new Date() },
        { role: 'user', content: 'Hello, how are you?', timestamp: new Date() }, // Duplicate
        { role: 'user', content: 'What is the weather?', timestamp: new Date() },
        { role: 'assistant', content: 'I am fine, thank you!', timestamp: new Date() }, // Duplicate
      ];

      const originalTokens = estimateTotalTokens(messages);
      const unique = compressor.removeRedundancy(messages);
      const uniqueTokens = estimateTotalTokens(unique);

      expect(unique.length).toBeLessThan(messages.length);
      expect(uniqueTokens).toBeLessThan(originalTokens);

      const savingsPercent = ((originalTokens - uniqueTokens) / originalTokens) * 100;

      console.log('Redundancy Removal:');
      console.log('  Original messages:', messages.length);
      console.log('  Unique messages:', unique.length);
      console.log('  Original tokens:', originalTokens);
      console.log('  Unique tokens:', uniqueTokens);
      console.log('  Savings:', savingsPercent.toFixed(1) + '%');

      expect(savingsPercent).toBeGreaterThan(20);
    });
  });

  describe('Long Conversation Scenario', () => {
    it('should handle 500-message conversation efficiently', async () => {
      const messages = createTestMessages(500, 400); // 500 messages, ~100 tokens each
      const originalTokens = estimateTotalTokens(messages);

      console.log('\nLong Conversation Test:');
      console.log('  Messages:', messages.length);
      console.log('  Original tokens:', originalTokens);

      const manager = createContextManager();

      // Test different strategies
      const strategies: Array<'sliding-window' | 'summarization' | 'hybrid'> = [
        'sliding-window',
        'summarization',
        'hybrid',
      ];

      for (const strategy of strategies) {
        const result = await manager.prepareContextForClaude(messages, {
          strategy,
          enableCompression: true,
        });

        const savings = originalTokens - result.estimatedTokens;
        const savingsPercent = (savings / originalTokens) * 100;

        console.log(`\n  ${strategy}:`);
        console.log('    Final messages:', result.messages.length);
        console.log('    Final tokens:', result.estimatedTokens);
        console.log('    Tokens saved:', savings);
        console.log('    Savings:', savingsPercent.toFixed(1) + '%');

        expect(result.estimatedTokens).toBeLessThan(originalTokens);
        expect(savingsPercent).toBeGreaterThan(40);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conversation', async () => {
      const messages: ContextMessage[] = [];
      const manager = createContextManager();

      const result = await manager.prepareContextForClaude(messages);

      expect(result.messages.length).toBe(0);
      expect(result.estimatedTokens).toBe(0);
    });

    it('should handle single message', async () => {
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Hello', timestamp: new Date() },
      ];
      const manager = createContextManager();

      const result = await manager.prepareContextForClaude(messages);

      expect(result.messages.length).toBe(1);
      expect(result.estimatedTokens).toBeGreaterThan(0);
    });

    it('should handle very short messages', () => {
      const messages = Array(50).fill(null).map((_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: 'ok',
        timestamp: new Date(),
      }));

      const originalTokens = estimateTotalTokens(messages);
      const windowManager = createWindowManager();

      const result = windowManager.truncateToFit(messages, originalTokens * 0.5);

      expect(result.messages.length).toBeLessThan(messages.length);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should process large conversations quickly', async () => {
      const messages = createTestMessages(300, 500);
      const manager = createContextManager();

      const startTime = Date.now();
      await manager.prepareContextForClaude(messages, {
        strategy: 'hybrid',
        enableCompression: true,
      });
      const duration = Date.now() - startTime;

      console.log('\nPerformance Benchmark:');
      console.log('  Messages:', messages.length);
      console.log('  Duration:', duration + 'ms');

      // Should process in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
