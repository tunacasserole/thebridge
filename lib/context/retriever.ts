/**
 * RAG Context Retriever
 *
 * Implements retrieval-augmented context management:
 * - Fetch only relevant previous context on demand
 * - Use semantic similarity for relevance
 * - Score and rank context by relevance
 */

import { prisma } from '@/lib/db';
import type {
  ContextMessage,
  RetrievalResult,
} from './types';
import {
  estimateMessageTokens,
  estimateTotalTokens,
  addTokenEstimates,
} from './tokenEstimator';

/**
 * Retrieval options
 */
export interface RetrievalOptions {
  conversationId: string;
  query: string;
  maxMessages?: number;
  minRelevanceScore?: number;
  maxTokens?: number;
  useSemanticSearch?: boolean;
}

/**
 * Simple keyword-based relevance scoring
 * In production, replace with embedding-based similarity
 */
function calculateKeywordRelevance(query: string, content: string): number {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();

  // Extract keywords from query (remove common words)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'what', 'how', 'why', 'when', 'where',
  ]);

  const keywords = queryLower
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  if (keywords.length === 0) return 0;

  // Count keyword matches
  let matches = 0;
  let totalKeywords = keywords.length;

  for (const keyword of keywords) {
    if (contentLower.includes(keyword)) {
      matches++;
    }
  }

  // Base score from keyword overlap
  let score = matches / totalKeywords;

  // Boost for exact phrase match
  if (contentLower.includes(queryLower)) {
    score += 0.3;
  }

  // Boost for topic-related terms
  const topicTerms = extractTopicTerms(queryLower);
  for (const term of topicTerms) {
    if (contentLower.includes(term)) {
      score += 0.1;
    }
  }

  return Math.min(1, score);
}

/**
 * Extract topic-related terms from query
 */
function extractTopicTerms(query: string): string[] {
  const terms: string[] = [];

  // Common technical topics
  const topicPatterns = [
    { pattern: /error|bug|issue|problem/i, terms: ['error', 'exception', 'failed', 'issue'] },
    { pattern: /deploy|deployment/i, terms: ['deploy', 'release', 'production'] },
    { pattern: /api|endpoint/i, terms: ['api', 'endpoint', 'request', 'response'] },
    { pattern: /database|db|query/i, terms: ['database', 'query', 'sql', 'table'] },
    { pattern: /performance|slow|latency/i, terms: ['performance', 'slow', 'latency', 'optimize'] },
    { pattern: /security|auth|permission/i, terms: ['security', 'auth', 'permission', 'access'] },
  ];

  for (const { pattern, terms: topicTerms } of topicPatterns) {
    if (pattern.test(query)) {
      terms.push(...topicTerms);
    }
  }

  return terms;
}

/**
 * Context Retriever class
 */
export class ContextRetriever {
  /**
   * Retrieve relevant messages from database
   */
  async retrieveRelevantContext(options: RetrievalOptions): Promise<RetrievalResult> {
    const {
      conversationId,
      query,
      maxMessages = 20,
      minRelevanceScore = 0.3,
      maxTokens = 10000,
      useSemanticSearch = false,
    } = options;

    try {
      // Fetch messages from database
      const dbMessages = await prisma.message.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 200, // Limit initial fetch for performance
      });

      // Convert to ContextMessage format
      const messages: ContextMessage[] = dbMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.createdAt,
        toolsUsed: msg.toolsUsed ? JSON.parse(msg.toolsUsed) : undefined,
      }));

      // Calculate relevance scores
      const scoredMessages = messages.map(msg => ({
        message: msg,
        score: useSemanticSearch
          ? await this.calculateSemanticRelevance(query, msg.content)
          : calculateKeywordRelevance(query, msg.content),
      }));

      // Filter by minimum score and sort by relevance
      const relevantMessages = scoredMessages
        .filter(({ score }) => score >= minRelevanceScore)
        .sort((a, b) => b.score - a.score);

      // Add token estimates
      const messagesWithTokens = addTokenEstimates(
        relevantMessages.map(({ message }) => message)
      );

      // Select messages within token budget
      const selectedMessages: ContextMessage[] = [];
      const relevanceScores: number[] = [];
      let currentTokens = 0;

      for (let i = 0; i < Math.min(maxMessages, relevantMessages.length); i++) {
        const { message, score } = relevantMessages[i];
        const msgWithTokens = messagesWithTokens[i];
        const tokens = estimateMessageTokens(msgWithTokens);

        if (currentTokens + tokens <= maxTokens) {
          selectedMessages.push(msgWithTokens);
          relevanceScores.push(score);
          currentTokens += tokens;
        } else {
          break;
        }
      }

      // Sort selected messages by original chronological order
      const messageIndices = new Map(messages.map((msg, idx) => [msg, idx]));
      selectedMessages.sort(
        (a, b) => (messageIndices.get(a) || 0) - (messageIndices.get(b) || 0)
      );

      return {
        relevantMessages: selectedMessages,
        relevanceScores,
        totalRetrieved: selectedMessages.length,
        estimatedTokens: currentTokens,
      };
    } catch (error) {
      console.error('[Retriever] Failed to retrieve context:', error);
      return {
        relevantMessages: [],
        relevanceScores: [],
        totalRetrieved: 0,
        estimatedTokens: 0,
      };
    }
  }

  /**
   * Calculate semantic relevance using embeddings
   * Placeholder for future implementation with actual embeddings
   */
  private async calculateSemanticRelevance(query: string, content: string): Promise<number> {
    // TODO: Implement with actual embedding model
    // For now, fall back to keyword-based relevance
    return calculateKeywordRelevance(query, content);
  }

  /**
   * Find messages with similar errors
   */
  async findSimilarErrors(
    conversationId: string,
    errorMessage: string,
    maxResults: number = 5
  ): Promise<ContextMessage[]> {
    const result = await this.retrieveRelevantContext({
      conversationId,
      query: errorMessage,
      maxMessages: maxResults,
      minRelevanceScore: 0.4,
    });

    return result.relevantMessages.filter(
      msg =>
        msg.content.toLowerCase().includes('error') ||
        msg.content.toLowerCase().includes('failed')
    );
  }

  /**
   * Find messages about specific topics
   */
  async findTopicMessages(
    conversationId: string,
    topic: string,
    maxResults: number = 10
  ): Promise<ContextMessage[]> {
    const result = await this.retrieveRelevantContext({
      conversationId,
      query: topic,
      maxMessages: maxResults,
      minRelevanceScore: 0.3,
    });

    return result.relevantMessages;
  }

  /**
   * Get messages with tool usage
   */
  async getMessagesWithTools(
    conversationId: string,
    toolName?: string,
    maxResults: number = 20
  ): Promise<ContextMessage[]> {
    try {
      const where: { conversationId: string; toolsUsed?: { not: null } } = {
        conversationId,
      };

      // Filter for messages with any tools
      where.toolsUsed = { not: null };

      const dbMessages = await prisma.message.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: maxResults,
      });

      const messages: ContextMessage[] = dbMessages
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.createdAt,
          toolsUsed: msg.toolsUsed ? JSON.parse(msg.toolsUsed) : undefined,
        }))
        .filter(msg => {
          if (!toolName) return true;
          return msg.toolsUsed?.includes(toolName);
        });

      // Reverse to chronological order
      return messages.reverse();
    } catch (error) {
      console.error('[Retriever] Failed to get messages with tools:', error);
      return [];
    }
  }

  /**
   * Get messages in time range
   */
  async getMessagesInTimeRange(
    conversationId: string,
    startTime: Date,
    endTime: Date
  ): Promise<ContextMessage[]> {
    try {
      const dbMessages = await prisma.message.findMany({
        where: {
          conversationId,
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return dbMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.createdAt,
        toolsUsed: msg.toolsUsed ? JSON.parse(msg.toolsUsed) : undefined,
      }));
    } catch (error) {
      console.error('[Retriever] Failed to get messages in time range:', error);
      return [];
    }
  }
}

/**
 * Create a context retriever instance
 */
export function createRetriever(): ContextRetriever {
  return new ContextRetriever();
}
