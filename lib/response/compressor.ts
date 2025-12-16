/**
 * Response Compressor
 *
 * Post-processes responses to remove verbosity and extract key information.
 * Provides summary modes for different use cases.
 */

export type CompressionMode = 'none' | 'light' | 'moderate' | 'aggressive';

export interface CompressionResult {
  compressed: string;
  originalLength: number;
  compressedLength: number;
  compressionRatio: number;
  tokensRemoved: number;
}

/**
 * Estimates token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Removes common verbose phrases
 */
function removeVerbosity(text: string): string {
  const verbosePhrases = [
    /I'll help you with that\.\s*/gi,
    /Let me help you\s*/gi,
    /I understand that you want to\s*/gi,
    /Based on your request,?\s*/gi,
    /As you can see,?\s*/gi,
    /It's important to note that\s*/gi,
    /Please note that\s*/gi,
    /I hope this helps!?\s*/gi,
    /Feel free to ask if you have any questions\.?\s*/gi,
    /Let me know if you need anything else\.?\s*/gi,
    /Is there anything else I can help you with\??\s*/gi,
  ];

  let compressed = text;
  for (const phrase of verbosePhrases) {
    compressed = compressed.replace(phrase, '');
  }

  return compressed;
}

/**
 * Removes redundant whitespace
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .replace(/ {2,}/g, ' ')      // Max 1 space
    .trim();
}

/**
 * Extracts key points from text
 */
function extractKeyPoints(text: string): string[] {
  const points: string[] = [];

  // Extract numbered lists
  const numberedMatches = text.match(/^\d+\.\s+(.+)$/gm);
  if (numberedMatches) {
    points.push(...numberedMatches.map(m => m.replace(/^\d+\.\s+/, '')));
  }

  // Extract bullet points
  const bulletMatches = text.match(/^[-*]\s+(.+)$/gm);
  if (bulletMatches) {
    points.push(...bulletMatches.map(m => m.replace(/^[-*]\s+/, '')));
  }

  return points;
}

/**
 * Summarizes text by extracting first sentence and key points
 */
function createSummary(text: string): string {
  const sentences = text.split(/[.!?]+\s+/);
  const firstSentence = sentences[0];
  const keyPoints = extractKeyPoints(text);

  if (keyPoints.length === 0) {
    // No list items, return first 2-3 sentences
    return sentences.slice(0, 3).join('. ') + '.';
  }

  // Combine first sentence with key points
  const summary = `${firstSentence}.\n\nKey Points:\n${keyPoints
    .slice(0, 5) // Max 5 points
    .map(p => `- ${p}`)
    .join('\n')}`;

  return summary;
}

/**
 * Light compression - removes basic verbosity
 */
function compressLight(text: string): string {
  let compressed = removeVerbosity(text);
  compressed = normalizeWhitespace(compressed);
  return compressed;
}

/**
 * Moderate compression - removes verbosity and condenses
 */
function compressModerate(text: string): string {
  let compressed = removeVerbosity(text);

  // Remove example sections if text is long
  if (compressed.length > 1000) {
    compressed = compressed.replace(/Example:[\s\S]+?(?=\n\n|\n#|$)/gi, '');
  }

  // Condense repetitive explanations
  compressed = compressed.replace(
    /In other words,\s+/gi,
    ''
  );
  compressed = compressed.replace(
    /To put it another way,\s+/gi,
    ''
  );

  compressed = normalizeWhitespace(compressed);
  return compressed;
}

/**
 * Aggressive compression - extracts only key information
 */
function compressAggressive(text: string): string {
  // Try to extract structured data first
  const codeBlocks = text.match(/```[\s\S]+?```/g);
  const keyPoints = extractKeyPoints(text);

  // If we have code blocks and key points, prioritize those
  if (codeBlocks || keyPoints.length > 0) {
    const parts: string[] = [];

    // Add summary sentence
    const firstSentence = text.split(/[.!?]+\s+/)[0];
    parts.push(firstSentence + '.');

    // Add key points
    if (keyPoints.length > 0) {
      parts.push('\n\nKey Points:');
      parts.push(
        keyPoints
          .slice(0, 5)
          .map(p => `- ${p}`)
          .join('\n')
      );
    }

    // Add code blocks if present
    if (codeBlocks) {
      parts.push('\n\n' + codeBlocks.join('\n\n'));
    }

    return parts.join('');
  }

  // Fallback to summary
  return createSummary(text);
}

/**
 * Compresses response based on mode
 */
export function compressResponse(
  text: string,
  mode: CompressionMode = 'light'
): CompressionResult {
  const originalLength = text.length;
  const originalTokens = estimateTokens(text);

  let compressed: string;

  switch (mode) {
    case 'none':
      compressed = text;
      break;
    case 'light':
      compressed = compressLight(text);
      break;
    case 'moderate':
      compressed = compressModerate(text);
      break;
    case 'aggressive':
      compressed = compressAggressive(text);
      break;
    default:
      compressed = text;
  }

  const compressedLength = compressed.length;
  const compressedTokens = estimateTokens(compressed);

  return {
    compressed,
    originalLength,
    compressedLength,
    compressionRatio: compressedLength / originalLength,
    tokensRemoved: originalTokens - compressedTokens,
  };
}

/**
 * Automatically determines compression mode based on response length
 */
export function autoCompress(text: string): CompressionResult {
  const tokens = estimateTokens(text);

  let mode: CompressionMode;

  if (tokens < 500) {
    mode = 'none'; // Short responses don't need compression
  } else if (tokens < 1500) {
    mode = 'light'; // Medium responses get light compression
  } else if (tokens < 3000) {
    mode = 'moderate'; // Long responses get moderate compression
  } else {
    mode = 'aggressive'; // Very long responses get aggressive compression
  }

  console.log(`[Compressor] Auto mode: ${mode} (${tokens} estimated tokens)`);

  return compressResponse(text, mode);
}

/**
 * Extracts summary from response
 */
export function extractSummary(text: string, maxLength: number = 500): string {
  const summary = createSummary(text);

  if (summary.length <= maxLength) {
    return summary;
  }

  // Truncate to max length
  return summary.substring(0, maxLength - 3) + '...';
}

/**
 * Removes code blocks from response (useful for previews)
 */
export function removeCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]+?```/g, '[code block]');
}

/**
 * Extracts only code blocks from response
 */
export function extractCodeBlocks(text: string): string[] {
  const matches = text.match(/```[\s\S]+?```/g);
  return matches || [];
}

/**
 * Compresses specific sections while preserving important data
 */
export function compressSelective(
  text: string,
  preservePatterns: RegExp[] = []
): CompressionResult {
  const originalLength = text.length;

  // Extract sections to preserve
  const preserved: { pattern: RegExp; matches: string[] }[] = [];
  for (const pattern of preservePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      preserved.push({ pattern, matches });
    }
  }

  // Compress the text
  let compressed = compressModerate(text);

  // Restore preserved sections
  for (const { matches } of preserved) {
    for (const match of matches) {
      if (!compressed.includes(match)) {
        compressed += '\n\n' + match;
      }
    }
  }

  const compressedLength = compressed.length;

  return {
    compressed: normalizeWhitespace(compressed),
    originalLength,
    compressedLength,
    compressionRatio: compressedLength / originalLength,
    tokensRemoved: estimateTokens(text) - estimateTokens(compressed),
  };
}

/**
 * Stream compression - processes streaming response chunks
 */
export class StreamCompressor {
  private buffer: string = '';
  private mode: CompressionMode;
  private sentenceThreshold: number;

  constructor(mode: CompressionMode = 'light', sentenceThreshold: number = 3) {
    this.mode = mode;
    this.sentenceThreshold = sentenceThreshold;
  }

  /**
   * Processes a chunk of streaming text
   */
  processChunk(chunk: string): string {
    this.buffer += chunk;

    // Check if we have complete sentences
    const sentences = this.buffer.split(/[.!?]+\s+/);

    if (sentences.length < this.sentenceThreshold) {
      // Not enough sentences yet, return chunk as-is
      return chunk;
    }

    // We have enough sentences, compress the buffer
    const compressed = compressResponse(this.buffer, this.mode);

    // Reset buffer and return compressed text
    this.buffer = '';
    return compressed.compressed;
  }

  /**
   * Flushes remaining buffer
   */
  flush(): string {
    if (this.buffer.length === 0) {
      return '';
    }

    const compressed = compressResponse(this.buffer, this.mode);
    this.buffer = '';
    return compressed.compressed;
  }

  /**
   * Resets the compressor
   */
  reset(): void {
    this.buffer = '';
  }
}

/**
 * Creates a compression report
 */
export function createCompressionReport(
  results: CompressionResult[]
): {
  totalOriginalTokens: number;
  totalCompressedTokens: number;
  totalTokensSaved: number;
  averageCompressionRatio: number;
  responsesProcessed: number;
} {
  const totalOriginalTokens = results.reduce(
    (sum, r) => sum + estimateTokens(String(r.originalLength)),
    0
  );
  const totalCompressedTokens = results.reduce(
    (sum, r) => sum + estimateTokens(String(r.compressedLength)),
    0
  );
  const totalTokensSaved = results.reduce((sum, r) => sum + r.tokensRemoved, 0);
  const averageCompressionRatio =
    results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;

  return {
    totalOriginalTokens,
    totalCompressedTokens,
    totalTokensSaved,
    averageCompressionRatio,
    responsesProcessed: results.length,
  };
}
