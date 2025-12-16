/**
 * Query Complexity Scorer
 *
 * Analyzes user queries to determine complexity level for intelligent model routing.
 * Higher complexity queries are routed to more capable (and expensive) models.
 *
 * Complexity Score: 0-100
 * - 0-30: Simple (route to Haiku)
 * - 31-70: Moderate (route to Sonnet)
 * - 71-100: Complex (route to Opus)
 */

export interface ComplexityAnalysis {
  score: number;
  level: 'simple' | 'moderate' | 'complex';
  factors: {
    messageLength: number;
    technicalDepth: number;
    multiStep: number;
    dataAnalysis: number;
    codeGeneration: number;
    conversationLength: number;
    toolUsage: number;
  };
  reasoning: string;
  recommendedModel: 'haiku' | 'sonnet' | 'opus';
}

/**
 * Keywords and patterns for different complexity factors
 */
const COMPLEXITY_PATTERNS = {
  // Simple queries - factual, lookup, basic info
  simple: [
    /^(what|when|where|who|how many)\s+is/i,
    /^(list|show|display|get)\s+/i,
    /^(check|verify|confirm)\s+/i,
    /status of/i,
    /how do i/i,
  ],

  // Technical depth indicators
  technical: [
    /architecture/i,
    /algorithm/i,
    /optimize|optimization/i,
    /performance|throughput|latency/i,
    /distributed system/i,
    /microservice/i,
    /kubernetes|k8s/i,
    /database|sql|query/i,
    /security|vulnerability|cve/i,
    /debug|troubleshoot|investigate/i,
  ],

  // Multi-step reasoning indicators
  multiStep: [
    /analyze and/i,
    /investigate and/i,
    /compare and/i,
    /first.*then/i,
    /step by step/i,
    /workflow/i,
    /process/i,
    /multiple/i,
    /comprehensive/i,
  ],

  // Data analysis indicators
  dataAnalysis: [
    /analyze.*data/i,
    /trend|pattern/i,
    /correlate|correlation/i,
    /aggregate|aggregation/i,
    /metric|metrics/i,
    /dashboard/i,
    /report/i,
    /statistics|stats/i,
    /time series/i,
  ],

  // Code generation indicators
  codeGeneration: [
    /write.*code/i,
    /create.*function/i,
    /implement/i,
    /refactor/i,
    /generate/i,
    /build.*component/i,
    /develop/i,
  ],

  // Tool usage indicators (complex queries often need tools)
  toolRequired: [
    /query.*logs/i,
    /check.*newrelic|new relic/i,
    /coralogix/i,
    /jira/i,
    /github/i,
    /prometheus/i,
    /rootly/i,
    /incident/i,
  ],
};

/**
 * Analyze query complexity
 */
export function analyzeComplexity(
  message: string,
  conversationHistory?: { role: string; content: string }[],
  enabledTools?: string[]
): ComplexityAnalysis {
  const factors = {
    messageLength: scoreMessageLength(message),
    technicalDepth: scoreTechnicalDepth(message),
    multiStep: scoreMultiStep(message),
    dataAnalysis: scoreDataAnalysis(message),
    codeGeneration: scoreCodeGeneration(message),
    conversationLength: scoreConversationLength(conversationHistory || []),
    toolUsage: scoreToolUsage(message, enabledTools || []),
  };

  // Calculate weighted score
  const score = Math.min(
    100,
    factors.messageLength * 0.1 +
    factors.technicalDepth * 0.25 +
    factors.multiStep * 0.2 +
    factors.dataAnalysis * 0.15 +
    factors.codeGeneration * 0.15 +
    factors.conversationLength * 0.05 +
    factors.toolUsage * 0.1
  );

  // Determine complexity level
  let level: 'simple' | 'moderate' | 'complex';
  let recommendedModel: 'haiku' | 'sonnet' | 'opus';

  if (score <= 30) {
    level = 'simple';
    recommendedModel = 'haiku';
  } else if (score <= 70) {
    level = 'moderate';
    recommendedModel = 'sonnet';
  } else {
    level = 'complex';
    recommendedModel = 'opus';
  }

  // Generate reasoning
  const reasoning = generateReasoning(factors, score, level);

  return {
    score,
    level,
    factors,
    reasoning,
    recommendedModel,
  };
}

/**
 * Score based on message length
 * Longer messages often indicate more complex requests
 */
function scoreMessageLength(message: string): number {
  const length = message.length;

  if (length < 50) return 10;
  if (length < 150) return 20;
  if (length < 300) return 40;
  if (length < 500) return 60;
  return 80;
}

/**
 * Score based on technical depth indicators
 */
function scoreTechnicalDepth(message: string): number {
  const matches = COMPLEXITY_PATTERNS.technical.filter((pattern) =>
    pattern.test(message)
  ).length;

  return Math.min(100, matches * 25);
}

/**
 * Score based on multi-step reasoning indicators
 */
function scoreMultiStep(message: string): number {
  const matches = COMPLEXITY_PATTERNS.multiStep.filter((pattern) =>
    pattern.test(message)
  ).length;

  return Math.min(100, matches * 30);
}

/**
 * Score based on data analysis indicators
 */
function scoreDataAnalysis(message: string): number {
  const matches = COMPLEXITY_PATTERNS.dataAnalysis.filter((pattern) =>
    pattern.test(message)
  ).length;

  return Math.min(100, matches * 25);
}

/**
 * Score based on code generation indicators
 */
function scoreCodeGeneration(message: string): number {
  const matches = COMPLEXITY_PATTERNS.codeGeneration.filter((pattern) =>
    pattern.test(message)
  ).length;

  return Math.min(100, matches * 30);
}

/**
 * Score based on conversation length
 * Longer conversations may have more context complexity
 */
function scoreConversationLength(history: { role: string; content: string }[]): number {
  const length = history.length;

  if (length < 2) return 0;
  if (length < 5) return 10;
  if (length < 10) return 20;
  if (length < 20) return 30;
  return 40;
}

/**
 * Score based on tool usage requirements
 * Queries requiring multiple tools or specific integrations are more complex
 */
function scoreToolUsage(message: string, enabledTools: string[]): number {
  const toolMatches = COMPLEXITY_PATTERNS.toolRequired.filter((pattern) =>
    pattern.test(message)
  ).length;

  const toolCount = enabledTools.length;

  // More tools enabled = potentially more complex query
  const toolScore = Math.min(50, toolMatches * 20 + toolCount * 5);

  return toolScore;
}

/**
 * Generate human-readable reasoning for the complexity score
 */
function generateReasoning(
  factors: ComplexityAnalysis['factors'],
  score: number,
  level: string
): string {
  const reasons: string[] = [];

  if (factors.messageLength > 40) {
    reasons.push('lengthy query');
  }

  if (factors.technicalDepth > 40) {
    reasons.push('high technical depth');
  }

  if (factors.multiStep > 40) {
    reasons.push('multi-step reasoning required');
  }

  if (factors.dataAnalysis > 40) {
    reasons.push('data analysis needed');
  }

  if (factors.codeGeneration > 40) {
    reasons.push('code generation required');
  }

  if (factors.conversationLength > 20) {
    reasons.push('long conversation context');
  }

  if (factors.toolUsage > 40) {
    reasons.push('multiple tool integrations');
  }

  if (reasons.length === 0) {
    return `Simple query (score: ${score.toFixed(0)})`;
  }

  return `${level.charAt(0).toUpperCase() + level.slice(1)} query (score: ${score.toFixed(0)}): ${reasons.join(', ')}`;
}

/**
 * Quick check if query is obviously simple (for fast routing)
 */
export function isObviouslySimple(message: string): boolean {
  // Very short messages
  if (message.length < 30) return true;

  // Matches simple patterns
  const isSimple = COMPLEXITY_PATTERNS.simple.some((pattern) =>
    pattern.test(message)
  );

  // No technical keywords
  const hasTechnical = COMPLEXITY_PATTERNS.technical.some((pattern) =>
    pattern.test(message)
  );

  return isSimple && !hasTechnical;
}

/**
 * Quick check if query is obviously complex (for fast routing)
 */
export function isObviouslyComplex(message: string): boolean {
  // Very long messages
  if (message.length > 800) return true;

  // Multiple complexity indicators
  const technicalCount = COMPLEXITY_PATTERNS.technical.filter((pattern) =>
    pattern.test(message)
  ).length;

  const multiStepCount = COMPLEXITY_PATTERNS.multiStep.filter((pattern) =>
    pattern.test(message)
  ).length;

  const codeGenCount = COMPLEXITY_PATTERNS.codeGeneration.filter((pattern) =>
    pattern.test(message)
  ).length;

  // If we have 3+ indicators from different categories, it's complex
  return technicalCount >= 2 && (multiStepCount >= 1 || codeGenCount >= 1);
}
