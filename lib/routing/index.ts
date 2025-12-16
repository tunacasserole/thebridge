/**
 * Model Routing Module
 *
 * Intelligent routing of queries to appropriate Claude models based on complexity.
 * Week 3: Model Router & Query Complexity Analysis
 */

// Complexity analysis
export {
  analyzeComplexity,
  isObviouslySimple,
  isObviouslyComplex,
  type ComplexityAnalysis,
} from './complexityScorer';

// Model routing
export {
  routeToModel,
  trackRoutingDecision,
  getRoutingStats,
  resetRoutingStats,
  logRoutingStats,
  type RoutingDecision,
} from './modelRouter';

// Configuration
export {
  getRoutingConfig,
  setRoutingConfig,
  getCurrentRoutingConfig,
  enableRouting,
  setAgentOverride,
  removeAgentOverride,
  enableAbTest,
  disableAbTest,
  DEFAULT_ROUTING_CONFIG,
  ROUTING_CONFIGS,
  type ModelName,
  type RoutingRule,
  type RoutingContext,
  type RoutingConfig,
} from './routingConfig';
