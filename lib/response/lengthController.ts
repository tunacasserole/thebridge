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
 */
export function getThinkingBudget(complexity: number): number {
  // Scale thinking budget based on complexity
  if (complexity < 0.3) {
    return 2000;  // Simple queries don't need much thinking
  } else if (complexity < 0.7) {
    return 5000;  // Standard thinking for medium complexity
  } else {
    return 10000; // Full thinking for complex queries
  }
}

/**
 * Validates and enforces max_tokens limits
 */
export function enforceTokenLimits(requestedTokens: number): number {
  const MIN_TOKENS = 256;
  const MAX_TOKENS = 8192;

  if (requestedTokens < MIN_TOKENS) {
    console.warn(`[LengthController] Requested tokens ${requestedTokens} below minimum, using ${MIN_TOKENS}`);
    return MIN_TOKENS;
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
  } = params;

  // Get base configuration
  const baseConfig = getOptimalMaxTokens(message, profile, toolsEnabled);

  // Adjust for context
  const adjustedMaxTokens = adjustForContext(
    baseConfig,
    conversationLength,
    hasFiles
  );

  // Enforce limits
  const maxTokens = enforceTokenLimits(adjustedMaxTokens);

  // Get thinking budget
  const analysis = analyzeQuery(message);
  const thinkingBudget = getThinkingBudget(analysis.estimatedComplexity);

  console.log('[LengthController] Configuration:', {
    profile: baseConfig.profile,
    queryType: baseConfig.queryType,
    complexity: analysis.estimatedComplexity,
    maxTokens,
    thinkingBudget,
  });

  return {
    maxTokens,
    thinkingBudget,
    profile: baseConfig.profile,
    analysis,
  };
}
