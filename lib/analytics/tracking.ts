/**
 * Token Usage Tracking Helper
 *
 * Records token usage to the database for analytics and cost tracking.
 */

import { prisma } from '@/lib/db';
import { calculateCost } from './costCalculator';
import type Anthropic from '@anthropic-ai/sdk';

export interface TrackingData {
  userId: string;
  model: string;
  usage: Anthropic.Usage;
  conversationId?: string;
  agentSlug?: string;
  toolsUsed?: string[];
  responseTimeMs?: number;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Record token usage to database
 */
export async function trackTokenUsage(data: TrackingData) {
  try {
    const inputTokens = data.usage.input_tokens || 0;
    const outputTokens = data.usage.output_tokens || 0;

    // Note: thinking tokens aren't always available in usage object
    // They may be included in input_tokens or tracked separately
    const thinkingTokens = 0; // Will need to extract from response if available

    // Calculate cost
    const costBreakdown = calculateCost(data.model, {
      inputTokens,
      outputTokens,
      thinkingTokens,
    });

    // Store in database
    await prisma.tokenUsage.create({
      data: {
        userId: data.userId,
        model: data.model,
        modelType: costBreakdown.modelType,
        inputTokens,
        outputTokens,
        thinkingTokens,
        totalTokens: costBreakdown.totalTokens,
        estimatedCostCents: costBreakdown.totalCostCents,
        conversationId: data.conversationId,
        agentSlug: data.agentSlug,
        toolsUsed: data.toolsUsed ? JSON.stringify(data.toolsUsed) : null,
        responseTimeMs: data.responseTimeMs,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
      },
    });

    console.log('[Analytics] Tracked token usage:', {
      model: costBreakdown.modelType,
      tokens: costBreakdown.totalTokens,
      cost: costBreakdown.totalCostCents,
    });

    return costBreakdown;
  } catch (error) {
    console.error('[Analytics] Failed to track token usage:', error);
    // Don't throw - tracking failures shouldn't break the main flow
    return null;
  }
}

/**
 * Batch track multiple usage records
 */
export async function trackBatchUsage(records: TrackingData[]) {
  const results = await Promise.allSettled(
    records.map(record => trackTokenUsage(record))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`[Analytics] Batch tracked ${successful} records, ${failed} failed`);

  return { successful, failed };
}
