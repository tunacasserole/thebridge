/**
 * Response Cache Tests
 */

import { test, expect } from '@playwright/test';
import { ResponseCache } from '../../lib/tokens/cache';

test.describe('Response Cache', () => {
  test.describe('Basic Operations', () => {
    test('should store and retrieve responses', () => {
      const cache = new ResponseCache();
      cache.set('weather query', 'Sunny, 72°F', 100);

      const result = cache.get('weather query');
      expect(result).toBe('Sunny, 72°F');
    });

    test('should return null for cache miss', () => {
      const cache = new ResponseCache();
      const result = cache.get('unknown query');
      expect(result).toBe(null);
    });

    test('should normalize queries', () => {
      const cache = new ResponseCache();
      cache.set('Hello World', 'Response', 100);

      // Should match despite different case/whitespace
      expect(cache.get('hello world')).toBe('Response');
      expect(cache.get('  HELLO WORLD  ')).toBe('Response');
    });

    test('should support context-based keys', () => {
      const cache = new ResponseCache();
      cache.set('status', 'NYC status', 100, 'nyc');
      cache.set('status', 'LA status', 100, 'la');

      expect(cache.get('status', 'nyc')).toBe('NYC status');
      expect(cache.get('status', 'la')).toBe('LA status');
    });
  });

  test.describe('TTL and Expiration', () => {
    test('should expire entries after TTL', async () => {
      const cache = new ResponseCache(1000, 0.01); // 0.01 minute = 600ms
      cache.set('query', 'response', 100);

      expect(cache.get('query')).toBe('response');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 700));

      expect(cache.get('query')).toBe(null);
    });

    test('should not expire entries before TTL', async () => {
      const cache = new ResponseCache(1000, 1); // 1 minute
      cache.set('query', 'response', 100);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.get('query')).toBe('response');
    });

    test('should prune expired entries', async () => {
      const cache = new ResponseCache(1000, 0.01); // 600ms TTL
      cache.set('query1', 'response1', 100);
      cache.set('query2', 'response2', 100);

      await new Promise((resolve) => setTimeout(resolve, 700));

      const pruned = cache.prune();
      expect(pruned).toBe(2);

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  test.describe('Capacity Management', () => {
    test('should enforce max entries limit', () => {
      const cache = new ResponseCache(3); // max 3 entries

      cache.set('query1', 'response1', 100);
      cache.set('query2', 'response2', 100);
      cache.set('query3', 'response3', 100);
      cache.set('query4', 'response4', 100); // Should evict oldest

      const stats = cache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(3);
    });

    test('should evict oldest entries first', () => {
      const cache = new ResponseCache(2);

      cache.set('old query', 'old response', 100);
      cache.set('mid query', 'mid response', 100);
      cache.set('new query', 'new response', 100);

      // Old should be evicted
      expect(cache.get('old query')).toBe(null);
      expect(cache.get('mid query')).toBe('mid response');
      expect(cache.get('new query')).toBe('new response');
    });
  });

  test.describe('Statistics', () => {
    test('should track hits and misses', () => {
      const cache = new ResponseCache();
      cache.set('query', 'response', 100);

      cache.get('query'); // hit
      cache.get('query'); // hit
      cache.get('unknown'); // miss
      cache.get('another'); // miss

      const stats = cache.getStats();
      expect(stats.totalHits).toBe(2);
      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(50, 1);
    });

    test('should calculate hit rate correctly', () => {
      const cache = new ResponseCache();
      cache.set('q1', 'r1', 100);
      cache.set('q2', 'r2', 100);

      for (let i = 0; i < 8; i++) {
        cache.get('q1'); // 8 hits
      }
      cache.get('unknown'); // 1 miss
      cache.get('another'); // 1 miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(80, 1); // 8/(8+2) = 80%
    });

    test('should track tokens saved', () => {
      const cache = new ResponseCache();
      cache.set('query1', 'response', 500); // saves 500 tokens
      cache.set('query2', 'response', 300); // saves 300 tokens

      cache.get('query1'); // 1 hit
      cache.get('query1'); // 2 hits
      cache.get('query2'); // 1 hit

      const stats = cache.getStats();
      // 2 * 500 + 1 * 300 = 1300 tokens saved
      expect(stats.tokensSaved).toBe(1300);
    });

    test('should handle zero requests', () => {
      const cache = new ResponseCache();
      const stats = cache.getStats();

      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.tokensSaved).toBe(0);
    });
  });

  test.describe('Top Entries', () => {
    test('should return most valuable entries', () => {
      const cache = new ResponseCache();

      cache.set('low value', 'response', 100);
      cache.set('high value', 'response', 1000);
      cache.set('mid value', 'response', 500);

      // Generate hits
      cache.get('high value');
      cache.get('high value');
      cache.get('mid value');

      const top = cache.getTopEntries(2);

      expect(top.length).toBe(2);
      expect(top[0].key).toBe('high value');
    });

    test('should limit number of entries returned', () => {
      const cache = new ResponseCache();

      for (let i = 0; i < 10; i++) {
        cache.set(`query${i}`, 'response', 100 * i);
      }

      const top = cache.getTopEntries(3);
      expect(top.length).toBe(3);
    });
  });

  test.describe('Clear', () => {
    test('should clear all entries and stats', () => {
      const cache = new ResponseCache();

      cache.set('q1', 'r1', 100);
      cache.set('q2', 'r2', 200);
      cache.get('q1');
      cache.get('q2');

      cache.clear();

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
    });
  });

  test.describe('Performance Requirements', () => {
    test('should achieve >80% hit rate target', () => {
      const cache = new ResponseCache();

      // Set up common queries
      const commonQueries = ['status', 'metrics', 'logs', 'alerts'];
      commonQueries.forEach((q) => cache.set(q, `${q} response`, 500));

      // Simulate realistic usage (80% common, 20% unique)
      for (let i = 0; i < 80; i++) {
        const query = commonQueries[i % commonQueries.length];
        cache.get(query);
      }

      for (let i = 0; i < 20; i++) {
        cache.get(`unique-${i}`);
      }

      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThanOrEqual(80);
    });

    test('should save significant tokens with caching', () => {
      const cache = new ResponseCache();

      // Cache expensive responses
      cache.set('complex query 1', 'complex response', 2000);
      cache.set('complex query 2', 'complex response', 1500);

      // Simulate repeated queries
      for (let i = 0; i < 10; i++) {
        cache.get('complex query 1');
        cache.get('complex query 2');
      }

      const stats = cache.getStats();
      // Should save at least 30,000 tokens (conservative estimate)
      expect(stats.tokensSaved).toBeGreaterThan(30000);
    });
  });
});
