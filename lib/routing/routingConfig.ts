/**
 * Model Routing Configuration
 *
 * Defines rules and settings for intelligent model routing based on query complexity.
 * Supports per-agent overrides and A/B testing capabilities.
 */

export type ModelName = 'haiku' | 'sonnet' | 'opus';

export interface RoutingRule {
  name: string;
  enabled: boolean;
  priority: number; // Higher priority rules are evaluated first
  condition: (context: RoutingContext) => boolean;
  targetModel: ModelName;
  reason: string;
}

export interface RoutingContext {
  message: string;
  conversationHistory: { role: string; content: string }[];
  enabledTools: string[];
  agentId?: string;
  userPreference?: ModelName;
  complexityScore?: number;
}

export interface RoutingConfig {
  enabled: boolean;
  defaultModel: ModelName;
  rules: RoutingRule[];
  agentOverrides: Record<string, ModelName>;
  thresholds: {
    simple: number; // 0-30 = haiku
    moderate: number; // 31-70 = sonnet
    complex: number; // 71-100 = opus
  };
  abTest?: {
    enabled: boolean;
    percentage: number; // Percentage of requests to use alternative routing
    variant: 'always_sonnet' | 'always_opus' | 'aggressive_haiku';
  };
  logging: {
    enabled: boolean;
    logDecisions: boolean;
    logComplexityScores: boolean;
  };
}

/**
 * Default routing configuration
 */
export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  enabled: true,
  defaultModel: 'sonnet',

  thresholds: {
    simple: 30,
    moderate: 70,
    complex: 100,
  },

  // Priority-ordered routing rules
  rules: [
    // Rule 1: User explicitly requested a model
    {
      name: 'user_preference',
      enabled: true,
      priority: 100,
      condition: (ctx) => ctx.userPreference !== undefined,
      targetModel: 'sonnet', // Placeholder, overridden by userPreference
      reason: 'User explicitly requested this model',
    },

    // Rule 2: Critical/production agents always use Sonnet or Opus
    {
      name: 'critical_agents',
      enabled: true,
      priority: 90,
      condition: (ctx) =>
        ctx.agentId !== undefined &&
        ['incident', 'security', 'quota'].includes(ctx.agentId),
      targetModel: 'sonnet',
      reason: 'Critical agent requires reliable model',
    },

    // Rule 3: Very simple queries go to Haiku
    {
      name: 'simple_query',
      enabled: true,
      priority: 80,
      condition: (ctx) =>
        ctx.complexityScore !== undefined && ctx.complexityScore <= 30,
      targetModel: 'haiku',
      reason: 'Simple query suitable for Haiku',
    },

    // Rule 4: Very complex queries go to Opus
    {
      name: 'complex_query',
      enabled: true,
      priority: 75,
      condition: (ctx) =>
        ctx.complexityScore !== undefined && ctx.complexityScore >= 85,
      targetModel: 'opus',
      reason: 'Highly complex query requires Opus',
    },

    // Rule 5: Code generation tasks use Sonnet
    {
      name: 'code_generation',
      enabled: true,
      priority: 70,
      condition: (ctx) =>
        /write.*code|implement|refactor|generate|build.*component/i.test(
          ctx.message
        ),
      targetModel: 'sonnet',
      reason: 'Code generation task',
    },

    // Rule 6: Multi-tool queries use Sonnet
    {
      name: 'multi_tool',
      enabled: true,
      priority: 60,
      condition: (ctx) => ctx.enabledTools.length >= 3,
      targetModel: 'sonnet',
      reason: 'Multiple tools enabled, needs orchestration capability',
    },

    // Rule 7: Long conversations use Sonnet for context understanding
    {
      name: 'long_conversation',
      enabled: true,
      priority: 50,
      condition: (ctx) => ctx.conversationHistory.length >= 10,
      targetModel: 'sonnet',
      reason: 'Long conversation requires strong context retention',
    },

    // Rule 8: Default to Haiku for short, simple queries
    {
      name: 'default_simple',
      enabled: true,
      priority: 10,
      condition: (ctx) =>
        ctx.message.length < 100 && ctx.enabledTools.length === 0,
      targetModel: 'haiku',
      reason: 'Short query with no tools, suitable for Haiku',
    },
  ],

  // Per-agent model overrides
  agentOverrides: {
    // UI/UX agent can use Haiku for simple design questions
    'ui-ux': 'haiku',

    // Incident agent should use Sonnet for reliability
    incident: 'sonnet',

    // Security agent should use Opus for thorough analysis
    security: 'opus',

    // Quota agent can use Sonnet
    quota: 'sonnet',
  },

  // A/B testing configuration (disabled by default)
  abTest: {
    enabled: false,
    percentage: 10,
    variant: 'always_sonnet',
  },

  // Logging configuration
  logging: {
    enabled: true,
    logDecisions: true,
    logComplexityScores: true,
  },
};

/**
 * Custom routing configurations for specific environments
 */
export const ROUTING_CONFIGS: Record<string, Partial<RoutingConfig>> = {
  development: {
    // In dev, default to Haiku to save costs
    defaultModel: 'haiku',
    logging: {
      enabled: true,
      logDecisions: true,
      logComplexityScores: true,
    },
  },

  production: {
    // In prod, default to Sonnet for quality
    defaultModel: 'sonnet',
    logging: {
      enabled: true,
      logDecisions: true,
      logComplexityScores: false,
    },
  },

  cost_optimized: {
    // Aggressive Haiku routing for cost savings
    defaultModel: 'haiku',
    thresholds: {
      simple: 40, // Wider Haiku range
      moderate: 80, // Wider Sonnet range
      complex: 100,
    },
  },

  quality_optimized: {
    // Conservative routing for quality
    defaultModel: 'sonnet',
    thresholds: {
      simple: 20, // Narrow Haiku range
      moderate: 60, // Wider Sonnet range
      complex: 100,
    },
  },
};

/**
 * Get routing configuration for current environment
 */
export function getRoutingConfig(
  environment?: string
): RoutingConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  const envConfig = ROUTING_CONFIGS[env] || {};

  return {
    ...DEFAULT_ROUTING_CONFIG,
    ...envConfig,
  };
}

/**
 * Update routing configuration at runtime
 */
let runtimeConfig: RoutingConfig = DEFAULT_ROUTING_CONFIG;

export function setRoutingConfig(config: Partial<RoutingConfig>): void {
  runtimeConfig = {
    ...runtimeConfig,
    ...config,
  };
}

export function getCurrentRoutingConfig(): RoutingConfig {
  return runtimeConfig;
}

/**
 * Enable/disable routing globally
 */
export function enableRouting(enabled: boolean): void {
  runtimeConfig.enabled = enabled;
}

/**
 * Set agent-specific model override
 */
export function setAgentOverride(agentId: string, model: ModelName): void {
  runtimeConfig.agentOverrides[agentId] = model;
}

/**
 * Remove agent override
 */
export function removeAgentOverride(agentId: string): void {
  delete runtimeConfig.agentOverrides[agentId];
}

/**
 * Enable A/B testing
 */
export function enableAbTest(
  variant: 'always_sonnet' | 'always_opus' | 'aggressive_haiku',
  percentage: number
): void {
  runtimeConfig.abTest = {
    enabled: true,
    percentage: Math.max(0, Math.min(100, percentage)),
    variant,
  };
}

/**
 * Disable A/B testing
 */
export function disableAbTest(): void {
  if (runtimeConfig.abTest) {
    runtimeConfig.abTest.enabled = false;
  }
}
