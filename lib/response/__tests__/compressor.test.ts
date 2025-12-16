/**
 * Tests for Response Compressor
 */

import {
  compressResponse,
  autoCompress,
  extractSummary,
  removeCodeBlocks,
  extractCodeBlocks,
  StreamCompressor,
} from '../compressor';

describe('Response Compressor', () => {
  describe('compressResponse', () => {
    const verboseText = `I'll help you with that. Based on your request, I understand that you want to check the status of the service. Let me analyze that for you.

The service is currently running in a healthy state. As you can see, all metrics are within normal ranges. The system is operating efficiently.

It's important to note that there were no errors in the last 24 hours. I hope this helps! Feel free to ask if you have any questions. Let me know if you need anything else.`;

    it('does not compress with "none" mode', () => {
      const result = compressResponse(verboseText, 'none');
      expect(result.compressed).toBe(verboseText);
      expect(result.compressionRatio).toBe(1.0);
    });

    it('removes verbose phrases with "light" mode', () => {
      const result = compressResponse(verboseText, 'light');

      expect(result.compressed).not.toContain("I'll help you with that");
      expect(result.compressed).not.toContain('I hope this helps');
      expect(result.compressed).not.toContain('Feel free to ask');
      expect(result.compressionRatio).toBeLessThan(1.0);
    });

    it('compresses more aggressively with "moderate" mode', () => {
      const light = compressResponse(verboseText, 'light');
      const moderate = compressResponse(verboseText, 'moderate');

      expect(moderate.compressedLength).toBeLessThan(light.compressedLength);
    });

    it('extracts key points with "aggressive" mode', () => {
      const textWithPoints = `Here's what I found:

1. Service is healthy
2. No errors in 24 hours
3. All metrics normal

Let me know if you need more details about this.`;

      const result = compressResponse(textWithPoints, 'aggressive');

      expect(result.compressed).toContain('Service is healthy');
      expect(result.compressed).toContain('No errors');
      expect(result.compressionRatio).toBeLessThan(0.8);
    });

    it('calculates tokens removed', () => {
      const result = compressResponse(verboseText, 'moderate');

      expect(result.tokensRemoved).toBeGreaterThan(0);
      expect(result.originalLength).toBeGreaterThan(result.compressedLength);
    });
  });

  describe('autoCompress', () => {
    it('uses "none" for short text', () => {
      const shortText = 'Service is healthy.';
      const result = autoCompress(shortText);

      expect(result.compressed).toBe(shortText);
    });

    it('uses "light" for medium text', () => {
      const mediumText = `I'll help you check that. ${' '.repeat(400)} The service is healthy. Let me know if you need more.`;
      const result = autoCompress(mediumText);

      expect(result.compressionRatio).toBeLessThan(1.0);
      expect(result.compressed.length).toBeGreaterThan(0);
    });

    it('uses "aggressive" for very long text', () => {
      const longText = `${'Long explanation. '.repeat(500)}`;
      const result = autoCompress(longText);

      expect(result.compressionRatio).toBeLessThan(0.7);
    });
  });

  describe('extractSummary', () => {
    it('extracts first sentences and key points', () => {
      const text = `The system is healthy and running normally. All services are operational.

Key findings:
1. Uptime: 99.9%
2. Error rate: 0.01%
3. Response time: 50ms

Everything looks good.`;

      const summary = extractSummary(text, 200);

      expect(summary).toContain('healthy');
      expect(summary.length).toBeLessThanOrEqual(200);
    });

    it('truncates if too long', () => {
      const longText = 'A'.repeat(1000);
      const summary = extractSummary(longText, 100);

      expect(summary.length).toBeLessThanOrEqual(103); // +3 for '...'
      expect(summary).toMatch(/\.\.\.$/);
    });
  });

  describe('removeCodeBlocks', () => {
    it('removes code blocks', () => {
      const text = `Here's an example:

\`\`\`javascript
console.log('Hello');
\`\`\`

And another:

\`\`\`python
print('World')
\`\`\`

That's it.`;

      const result = removeCodeBlocks(text);

      expect(result).not.toContain('console.log');
      expect(result).not.toContain('print(');
      expect(result).toContain('[code block]');
    });
  });

  describe('extractCodeBlocks', () => {
    it('extracts all code blocks', () => {
      const text = `Some text

\`\`\`javascript
const x = 1;
\`\`\`

More text

\`\`\`python
y = 2
\`\`\`

End`;

      const blocks = extractCodeBlocks(text);

      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toContain('javascript');
      expect(blocks[1]).toContain('python');
    });

    it('returns empty array if no code blocks', () => {
      const text = 'No code here';
      const blocks = extractCodeBlocks(text);

      expect(blocks).toEqual([]);
    });
  });

  describe('StreamCompressor', () => {
    it('processes chunks and flushes', () => {
      const compressor = new StreamCompressor('light');

      const chunk1 = "I'll help you with that. ";
      const chunk2 = 'The service is healthy. ';
      const chunk3 = 'I hope this helps!';

      compressor.processChunk(chunk1);
      compressor.processChunk(chunk2);
      compressor.processChunk(chunk3);

      const flushed = compressor.flush();

      expect(flushed).not.toContain("I'll help you");
      expect(flushed).not.toContain('I hope this helps');
      expect(flushed).toContain('service is healthy');
    });

    it('resets buffer', () => {
      const compressor = new StreamCompressor('light');

      compressor.processChunk('Test text. ');
      compressor.reset();

      const flushed = compressor.flush();
      expect(flushed).toBe('');
    });
  });
});
