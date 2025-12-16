/**
 * Response Length Controller
 *
 * Optimizes max_tokens parameter based on query type and response profile.
 * Provides adaptive token limits to reduce unnecessary output generation.
 */

export type ResponseProfile = 'concise' | 'standard' | 'detailed';

export interface QueryAnalysis {
  type: 'simple' | 'complex' | 'analysis' | 'data_retrieval';
  requiresDetail: boolean;
  estimatedComplexity: number; // 0-1 scale
}

export interface LengthConfig {
  maxTokens: number;
  profile: ResponseProfile;
  queryType: string;
}

/**
 * Token limits for different response profiles
 */
const PROFILE_LIMITS: Record<ResponseProfile, number> = {
  concise: 1024,    // Quick answers, status checks
  standard: 4096,   // Normal conversations, moderate detail
  detailed: 8192,   // Complex analysis, comprehensive responses
};

/**
 * Token limits based on query type
 */
const QUERY_TYPE_LIMITS: Record<string, number> = {
  status_check: 512,        // "What's the status of X?"
  yes_no: 256,             // "Is X working?"
  list: 1024,              // "List all X"
  simple_query: 1024,      // Simple data retrieval
  analysis: 4096,          // "Analyze X"
  troubleshooting: 6144,   // "Why is X failing?"
  comprehensive: 8192,     // "Explain everything about X"
};

/**
 * Analyzes user query to determine optimal response length
 */
export function analyzeQuery(message: string): QueryAnalysis {
  const lowerMsg = message.toLowerCase();

  // Simple yes/no questions
  if (
    lowerMsg.startsWith('is ') ||
    lowerMsg.startsWith('are ') ||
    lowerMsg.startsWith('can ') ||
    lowerMsg.startsWith('does ') ||
    lowerMsg.startsWith('do ')
  ) {
    return {
      type: 'simple',
      requiresDetail: false,
      estimatedComplexity: 0.1,
    };
  }

  // Status checks
  if (
    lowerMsg.includes('status of') ||
    lowerMsg.includes('what is the status') ||
    lowerMsg.includes('check status')
  ) {
    return {
      type: 'simple',
      requiresDetail: false,
      estimatedComplexity: 0.2,
    };
  }

  // List requests
  if (
    lowerMsg.startsWith('list ') ||
    lowerMsg.includes('show me all') ||
    lowerMsg.includes('get all')
  ) {
    return {
      type: 'data_retrieval',
      requiresDetail: true,
      estimatedComplexity: 0.4,
    };
  }

  // Analysis requests
  if (
    lowerMsg.includes('analyze') ||
    lowerMsg.includes('investigate') ||
    lowerMsg.includes('why is') ||
    lowerMsg.includes('what caused')
  ) {
    return {
      type: 'analysis',
      requiresDetail: true,
      estimatedComplexity: 0.7,
    };
  }

  // Comprehensive requests
  if (
    lowerMsg.includes('explain everything') ||
    lowerMsg.includes('comprehensive') ||
    lowerMsg.includes('detailed analysis') ||
    lowerMsg.includes('full report')
  ) {
    return {
      type: 'complex',
      requiresDetail: true,
      estimatedComplexity: 0.9,
    };
  }

  // Default to standard complexity
  return {
    type: 'simple',
    requiresDetail: true,
    estimatedComplexity: 0.5,
  };
}

/**
 * Determines optimal max_tokens for a query
 */
export function getOptimalMaxTokens(
  message: string,
  preferredProfile?: ResponseProfile,
  toolsEnabled: boolean = false
): LengthConfig {
  const analysis = analyzeQuery(message);

  // If tools are enabled, we may need more tokens for tool use
  const toolMultiplier = toolsEnabled ? 1.5 : 1.0;

  // Determine profile based on analysis
  let profile: ResponseProfile;
  if (preferredProfile) {
    profile = preferredProfile;
  } else if (analysis.estimatedComplexity < 0.3) {
    profile = 'concise';
  } else if (analysis.estimatedComplexity < 0.7) {
    profile = 'standard';
  } else {
    profile = 'detailed';
  }

  // Get base limit from profile
  let maxTokens = PROFILE_LIMITS[profile];

  // Adjust based on query type
  if (analysis.type === 'simple' && !analysis.requiresDetail) {
    maxTokens = Math.min(maxTokens, QUERY_TYPE_LIMITS.yes_no);
  } else if (analysis.type === 'data_retrieval') {
    maxTokens = Math.max(maxTokens, QUERY_TYPE_LIMITS.list);
  }

  // Apply tool multiplier
  maxTokens = Math.round(maxTokens * toolMultiplier);

  // Cap at maximum
  maxTokens = Math.min(maxTokens, 8192);

  return {
    maxTokens,
    profile,
    queryType: analysis.type,
  };
}

/**
 * Adjusts max_tokens based on conversation context
 */
export function adjustForContext(
  baseConfig: LengthConfig,
  conversationLength: number,
  hasFiles: boolean
): number {
  let adjusted = baseConfig.maxTokens;

  // Reduce tokens for very long conversations (context is already large)
  if (conversationLength > 10) {
    adjusted = Math.round(adjusted * 0.8);
  } else if (conversationLength > 20) {
    adjusted = Math.round(adjusted * 0.6);
  }

  // Increase slightly if files are attached (may need to reference them)
  if (hasFiles) {
    adjusted = Math.round(adjusted * 1.2);
  }

  // Floor at minimum
  adjusted = Math.max(adjusted, 256);

  return adjusted;
}

/**
 * Gets max_tokens for extended thinking mode
 *
 * IMPORTANT: max_tokens must be > budget_tokens for extended thinking.
 * Claude requires max_tokens to be greater than thinking.budget_tokens.
 * See: https://docs.claude.com/en/docs/build-with-claude/extended-thinking
 */
export function getThinkingBudget(complexity: number, maxTokens: number): number {
  // Scale thinking budget based on complexity
  let budget: number;
  if (complexity < 0.3) {
    budget = 2000;  // Simple queries don't need much thinking
  } else if (complexity < 0.7) {
    budget = 5000;  // Standard thinking for medium complexity
  } else {
    budget = 10000; // Full thinking for complex queries
  }

  // CRITICAL: budget_tokens must be < max_tokens for extended thinking
  // Leave at least 1024 tokens for the actual response
  const maxBudget = Math.max(1024, maxTokens - 1024);

  if (budget >= maxTokens) {
    console.warn(`[LengthController] Reducing thinking budget from ${budget} to ${maxBudget} (max_tokens: ${maxTokens})`);
    return maxBudget;
  }

  return budget;
}

/**
 * Validates and enforces max_tokens limits
 *
 * Note: When extended thinking is enabled, we need higher max_tokens
 * to accommodate both the thinking budget and the actual response.
 */
export function enforceTokenLimits(requestedTokens: number, extendedThinking: boolean = false): number {
  const MIN_TOKENS = 256;
  // Extended thinking requires higher max_tokens to fit both thinking + response
  // Minimum for extended thinking: budget_tokens + response_tokens
  const MAX_TOKENS = extendedThinking ? 16000 : 8192;
  const MIN_THINKING_TOKENS = extendedThinking ? 4096 : MIN_TOKENS;

  const effectiveMin = extendedThinking ? MIN_THINKING_TOKENS : MIN_TOKENS;

  if (requestedTokens < effectiveMin) {
    console.warn(`[LengthController] Requested tokens ${requestedTokens} below minimum, using ${effectiveMin}`);
    return effectiveMin;
  }

  if (requestedTokens > MAX_TOKENS) {
    console.warn(`[LengthController] Requested tokens ${requestedTokens} above maximum, using ${MAX_TOKENS}`);
    return MAX_TOKENS;
  }

  return requestedTokens;
}

/**
 * Main function to get optimized max_tokens configuration
 */
export function getResponseLengthConfig(params: {
  message: string;
  profile?: ResponseProfile;
  conversationLength?: number;
  hasFiles?: boolean;
  toolsEnabled?: boolean;
  extendedThinking?: boolean;
}): {
  maxTokens: number;
  thinkingBudget: number;
  profile: ResponseProfile;
  analysis: QueryAnalysis;
} {
  const {
    message,
    profile,
    conversationLength = 0,
    hasFiles = false,
    toolsEnabled = false,
    extendedThinking = false,
  } = params;

  // Get base configuration
  const baseConfig = getOptimalMaxTokens(message, profile, toolsEnabled);

  // Adjust for context
  let adjustedMaxTokens = adjustForContext(
    baseConfig,
    conversationLength,
    hasFiles
  );

  // Boost max_tokens for extended thinking mode
  // Extended thinking needs: budget_tokens + actual response tokens
  if (extendedThinking) {
    // Ensure we have enough room for thinking + a meaningful response
    adjustedMaxTokens = Math.max(adjustedMaxTokens * 2, 8192);
  }

  // Enforce limits (with extended thinking awareness)
  const maxTokens = enforceTokenLimits(adjustedMaxTokens, extendedThinking);

  // Get thinking budget (must be < maxTokens for extended thinking to work)
  const analysis = analyzeQuery(message);
  const thinkingBudget = getThinkingBudget(analysis.estimatedComplexity, maxTokens);

  console.log('[LengthController] Configuration:', {
    profile: baseConfig.profile,
    queryType: baseConfig.queryType,
    complexity: analysis.estimatedComplexity,
    maxTokens,
    thinkingBudget,
    extendedThinking,
  });

  return {
    maxTokens,
    thinkingBudget,
    profile: baseConfig.profile,
    analysis,
  };
}
