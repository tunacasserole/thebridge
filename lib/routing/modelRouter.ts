/**
 * Model Router
 *
 * Intelligent routing of queries to appropriate Claude models based on complexity.
 * Routes simple queries to Haiku (cheaper/faster), complex queries to Sonnet,
 * and critical/complex queries to Opus only when necessary.
 */

import {
  analyzeComplexity,
  isObviouslySimple,
  isObviouslyComplex,
  ComplexityAnalysis,
} from './complexityScorer';
import {
  getCurrentRoutingConfig,
  RoutingContext,
  RoutingRule,
  ModelName,
} from './routingConfig';

export interface RoutingDecision {
  model: ModelName;
  modelId: string;
  reason: string;
  complexity?: ComplexityAnalysis;
  ruleName?: string;
  isOverride: boolean;
  costSavings?: string;
}

/**
 * Model ID mapping
 */
const MODEL_IDS: Record<ModelName, string> = {
  haiku: 'claude-3-5-haiku-latest',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
};

/**
 * Relative cost per million tokens (approximate)
 */
const MODEL_COSTS: Record<ModelName, number> = {
  haiku: 1.0, // Baseline
  sonnet: 3.0, // 3x more expensive than Haiku
  opus: 15.0, // 15x more expensive than Haiku
};

/**
 * Route a query to the appropriate model
 */
export function routeToModel(
  message: string,
  options: {
    conversationHistory?: { role: string; content: string }[];
    enabledTools?: string[];
    agentId?: string;
    userPreference?: ModelName;
    forceModel?: ModelName;
  } = {}
): RoutingDecision {
  const config = getCurrentRoutingConfig();

  // If routing is disabled, use default model
  if (!config.enabled) {
    return {
      model: config.defaultModel,
      modelId: MODEL_IDS[config.defaultModel],
      reason: 'Routing disabled, using default model',
      isOverride: false,
    };
  }

  // Force model override (for testing)
  if (options.forceModel) {
    return {
      model: options.forceModel,
      modelId: MODEL_IDS[options.forceModel],
      reason: 'Forced model selection',
      isOverride: true,
    };
  }

  // Check for agent-specific override
  if (options.agentId && config.agentOverrides[options.agentId]) {
    const model = config.agentOverrides[options.agentId];
    return {
      model,
      modelId: MODEL_IDS[model],
      reason: `Agent override for ${options.agentId}`,
      isOverride: true,
    };
  }

  // A/B testing variant
  if (config.abTest?.enabled && shouldUseAbTestVariant(config.abTest.percentage)) {
    const model = getAbTestModel(config.abTest.variant);
    return {
      model,
      modelId: MODEL_IDS[model],
      reason: `A/B test variant: ${config.abTest.variant}`,
      isOverride: true,
    };
  }

  // Fast path: Obviously simple queries
  if (isObviouslySimple(message)) {
    const defaultModel = config.defaultModel === 'haiku' ? 'haiku' : 'haiku';
    return {
      model: 'haiku',
      modelId: MODEL_IDS.haiku,
      reason: 'Obviously simple query (fast path)',
      isOverride: false,
      costSavings: calculateSavings('haiku', defaultModel),
    };
  }

  // Fast path: Obviously complex queries
  if (isObviouslyComplex(message)) {
    return {
      model: 'opus',
      modelId: MODEL_IDS.opus,
      reason: 'Obviously complex query (fast path)',
      isOverride: false,
    };
  }

  // Analyze complexity
  const complexity = analyzeComplexity(
    message,
    options.conversationHistory,
    options.enabledTools
  );

  // Build routing context
  const context: RoutingContext = {
    message,
    conversationHistory: options.conversationHistory || [],
    enabledTools: options.enabledTools || [],
    agentId: options.agentId,
    userPreference: options.userPreference,
    complexityScore: complexity.score,
  };

  // Evaluate routing rules
  const decision = evaluateRoutingRules(context, config.rules, complexity);

  // Log decision if enabled
  if (config.logging.enabled && config.logging.logDecisions) {
    logRoutingDecision(decision, complexity);
  }

  return decision;
}

/**
 * Evaluate routing rules in priority order
 */
function evaluateRoutingRules(
  context: RoutingContext,
  rules: RoutingRule[],
  complexity: ComplexityAnalysis
): RoutingDecision {
  // Sort rules by priority (descending)
  const sortedRules = [...rules]
    .filter((rule) => rule.enabled)
    .sort((a, b) => b.priority - a.priority);

  // Evaluate rules in order
  for (const rule of sortedRules) {
    if (rule.condition(context)) {
      // Special handling for user preference rule
      const model =
        rule.name === 'user_preference' && context.userPreference
          ? context.userPreference
          : rule.targetModel;

      const config = getCurrentRoutingConfig();
      return {
        model,
        modelId: MODEL_IDS[model],
        reason: rule.reason,
        complexity,
        ruleName: rule.name,
        isOverride: rule.priority > 80,
        costSavings: calculateSavings(model, config.defaultModel),
      };
    }
  }

  // Fallback to complexity-based routing
  const model = complexity.recommendedModel;
  const config = getCurrentRoutingConfig();

  return {
    model,
    modelId: MODEL_IDS[model],
    reason: complexity.reasoning,
    complexity,
    ruleName: 'complexity_based',
    isOverride: false,
    costSavings: calculateSavings(model, config.defaultModel),
  };
}

/**
 * Calculate cost savings compared to default model
 */
function calculateSavings(selectedModel: ModelName, defaultModel: ModelName): string {
  const selectedCost = MODEL_COSTS[selectedModel];
  const defaultCost = MODEL_COSTS[defaultModel];

  if (selectedCost >= defaultCost) {
    return 'none';
  }

  const savings = ((defaultCost - selectedCost) / defaultCost) * 100;
  return `${savings.toFixed(0)}%`;
}

/**
 * Check if request should use A/B test variant
 */
function shouldUseAbTestVariant(percentage: number): boolean {
  return Math.random() * 100 < percentage;
}

/**
 * Get model for A/B test variant
 */
function getAbTestModel(variant: string): ModelName {
  switch (variant) {
    case 'always_sonnet':
      return 'sonnet';
    case 'always_opus':
      return 'opus';
    case 'aggressive_haiku':
      return 'haiku';
    default:
      return 'sonnet';
  }
}

/**
 * Log routing decision
 */
function logRoutingDecision(
  decision: RoutingDecision,
  complexity?: ComplexityAnalysis
): void {
  const config = getCurrentRoutingConfig();

  console.log('[Model Router] Decision:', {
    model: decision.model,
    reason: decision.reason,
    ruleName: decision.ruleName,
    isOverride: decision.isOverride,
    costSavings: decision.costSavings,
  });

  if (config.logging.logComplexityScores && complexity) {
    console.log('[Model Router] Complexity:', {
      score: complexity.score.toFixed(1),
      level: complexity.level,
      factors: complexity.factors,
    });
  }
}

/**
 * Get model statistics
 */
interface ModelStats {
  totalRequests: number;
  modelCounts: Record<ModelName, number>;
  averageComplexity: number;
  costSavingsTotal: number;
}

const modelStats: ModelStats = {
  totalRequests: 0,
  modelCounts: { haiku: 0, sonnet: 0, opus: 0 },
  averageComplexity: 0,
  costSavingsTotal: 0,
};

/**
 * Track routing decision
 */
export function trackRoutingDecision(decision: RoutingDecision): void {
  modelStats.totalRequests++;
  modelStats.modelCounts[decision.model]++;

  if (decision.complexity) {
    // Update rolling average
    const prevTotal = modelStats.averageComplexity * (modelStats.totalRequests - 1);
    modelStats.averageComplexity =
      (prevTotal + decision.complexity.score) / modelStats.totalRequests;
  }

  // Track cost savings (simplified)
  if (decision.costSavings && decision.costSavings !== 'none') {
    const savings = parseFloat(decision.costSavings);
    if (!isNaN(savings)) {
      modelStats.costSavingsTotal += savings;
    }
  }
}

/**
 * Get routing statistics
 */
export function getRoutingStats(): ModelStats & {
  haikuPercentage: number;
  sonnetPercentage: number;
  opusPercentage: number;
} {
  const total = modelStats.totalRequests || 1;

  return {
    ...modelStats,
    haikuPercentage: (modelStats.modelCounts.haiku / total) * 100,
    sonnetPercentage: (modelStats.modelCounts.sonnet / total) * 100,
    opusPercentage: (modelStats.modelCounts.opus / total) * 100,
  };
}

/**
 * Reset routing statistics
 */
export function resetRoutingStats(): void {
  modelStats.totalRequests = 0;
  modelStats.modelCounts = { haiku: 0, sonnet: 0, opus: 0 };
  modelStats.averageComplexity = 0;
  modelStats.costSavingsTotal = 0;
}

/**
 * Log routing statistics
 */
export function logRoutingStats(): void {
  const stats = getRoutingStats();

  console.log('[Model Router] Statistics:', {
    totalRequests: stats.totalRequests,
    distribution: {
      haiku: `${stats.haikuPercentage.toFixed(1)}%`,
      sonnet: `${stats.sonnetPercentage.toFixed(1)}%`,
      opus: `${stats.opusPercentage.toFixed(1)}%`,
    },
    averageComplexity: stats.averageComplexity.toFixed(1),
    estimatedSavings: `${(stats.costSavingsTotal / stats.totalRequests).toFixed(0)}%`,
  });
}
