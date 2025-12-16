/**
 * Dynamic Tool Loader - Context-aware tool filtering
 *
 * Reduces token usage by only loading tools relevant to the current query.
 * Implements intelligent filtering based on:
 * - Query content analysis
 * - Tool usage history
 * - Category relevance
 * - Server priorities
 */

import type Anthropic from '@anthropic-ai/sdk';
import {
  ToolCategory,
  categorizeTool,
  detectCategoriesFromQuery,
  isCategoryRelevant,
  SERVER_CATEGORIES,
} from './toolCategories';
import { getToolUsageStats } from './analytics';

export interface ToolMetadata {
  name: string;
  serverName: string;
  categories: ToolCategory[];
  description?: string;
  usageCount?: number;
  lastUsed?: Date;
}

export interface LoaderOptions {
  /**
   * User query to analyze for context
   */
  query?: string;

  /**
   * Specific categories to prioritize
   */
  priorityCategories?: ToolCategory[];

  /**
   * Minimum usage count threshold (tools used less often are deprioritized)
   */
  minUsageThreshold?: number;

  /**
   * Maximum number of tools to load (null = no limit)
   */
  maxTools?: number | null;

  /**
   * User ID for personalized filtering based on history
   */
  userId?: string;

  /**
   * Agent ID for agent-specific tool preferences
   */
  agentId?: string;

  /**
   * Whether to include rarely-used tools
   */
  includeRareTools?: boolean;

  /**
   * Force include specific tool names (bypass filtering)
   */
  forceInclude?: string[];
}

export interface FilterResult {
  tools: Anthropic.Tool[];
  metadata: {
    totalAvailable: number;
    loaded: number;
    filtered: number;
    tokensSaved: number;
    categories: ToolCategory[];
  };
}

/**
 * Estimate tokens for a tool definition
 */
function estimateToolTokens(tool: Anthropic.Tool): number {
  // Rough estimation: name + description + schema
  const nameTokens = Math.ceil(tool.name.length / 4);
  const descTokens = Math.ceil((tool.description?.length || 0) / 4);
  const schemaTokens = Math.ceil(JSON.stringify(tool.input_schema).length / 3);
  return nameTokens + descTokens + schemaTokens;
}

/**
 * Score a tool based on relevance to query and usage history
 */
function scoreToolRelevance(
  tool: Anthropic.Tool,
  metadata: ToolMetadata,
  options: LoaderOptions
): number {
  let score = 0;

  // Base score: usage history (0-40 points)
  if (metadata.usageCount) {
    score += Math.min(40, metadata.usageCount * 2);
  }

  // Query relevance (0-40 points)
  if (options.query && metadata.categories) {
    const queryCategories = detectCategoriesFromQuery(options.query);

    if (queryCategories.length > 0) {
      const matchingCategories = metadata.categories.filter(cat =>
        queryCategories.includes(cat)
      );
      score += matchingCategories.length * 10;
    }
  }

  // Priority categories (0-20 points)
  if (options.priorityCategories && metadata.categories) {
    const priorityMatches = metadata.categories.filter(cat =>
      options.priorityCategories?.includes(cat)
    );
    score += priorityMatches.length * 10;
  }

  // Force include override
  if (options.forceInclude?.includes(tool.name)) {
    score += 1000; // Ensure these are always included
  }

  // Recency bonus (0-10 points)
  if (metadata.lastUsed) {
    const daysSinceUse = (Date.now() - metadata.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUse < 7) {
      score += 10;
    } else if (daysSinceUse < 30) {
      score += 5;
    }
  }

  return score;
}

/**
 * Filter tools based on context and options
 */
export async function filterTools(
  allTools: Anthropic.Tool[],
  serverNames: string[],
  options: LoaderOptions = {}
): Promise<FilterResult> {
  // Build metadata for all tools
  const toolsWithMetadata = await Promise.all(
    allTools.map(async (tool) => {
      // Extract server name from tool name (format: serverName__toolName)
      const [serverName] = tool.name.split('__');

      // Get usage stats if userId provided
      let usageCount = 0;
      let lastUsed: Date | undefined;

      if (options.userId) {
        const stats = await getToolUsageStats(options.userId, tool.name);
        usageCount = stats.usageCount;
        lastUsed = stats.lastUsed;
      }

      // Categorize tool
      const categories = categorizeTool(
        tool.name,
        tool.description,
        serverName
      );

      return {
        tool,
        metadata: {
          name: tool.name,
          serverName,
          categories,
          description: tool.description,
          usageCount,
          lastUsed,
        },
      };
    })
  );

  // Filter based on category relevance if query provided
  let filtered = toolsWithMetadata;

  if (options.query) {
    const relevantCategories = detectCategoriesFromQuery(options.query);

    if (relevantCategories.length > 0) {
      filtered = filtered.filter(({ metadata }) =>
        metadata.categories.some(cat => relevantCategories.includes(cat))
      );
    }
  }

  // Apply minimum usage threshold
  if (options.minUsageThreshold !== undefined && !options.includeRareTools) {
    const threshold = options.minUsageThreshold;
    filtered = filtered.filter(
      ({ metadata }) => (metadata.usageCount || 0) >= threshold
    );
  }

  // Score and sort by relevance
  const scored = filtered.map(({ tool, metadata }) => ({
    tool,
    metadata,
    score: scoreToolRelevance(tool, metadata, options),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Apply max tools limit
  let finalTools = scored;
  if (options.maxTools !== null && options.maxTools !== undefined) {
    finalTools = scored.slice(0, options.maxTools);
  }

  // Calculate token savings
  const allToolsTokens = allTools.reduce((sum, tool) => sum + estimateToolTokens(tool), 0);
  const loadedToolsTokens = finalTools.reduce(
    (sum, { tool }) => sum + estimateToolTokens(tool),
    0
  );
  const tokensSaved = allToolsTokens - loadedToolsTokens;

  // Extract unique categories
  const categories = new Set<ToolCategory>();
  finalTools.forEach(({ metadata }) => {
    metadata.categories.forEach(cat => categories.add(cat));
  });

  return {
    tools: finalTools.map(({ tool }) => tool),
    metadata: {
      totalAvailable: allTools.length,
      loaded: finalTools.length,
      filtered: allTools.length - finalTools.length,
      tokensSaved,
      categories: Array.from(categories),
    },
  };
}

/**
 * Get smart tool recommendations based on query
 *
 * This function analyzes the query and recommends which MCP servers
 * should be enabled to minimize token usage while maintaining relevance.
 */
export function recommendServers(
  query: string,
  availableServers: string[]
): {
  recommended: string[];
  categories: ToolCategory[];
  confidence: number;
} {
  const categories = detectCategoriesFromQuery(query);

  if (categories.length === 0) {
    // No specific categories detected, recommend all observability servers
    const observabilityServers = availableServers.filter(server =>
      SERVER_CATEGORIES[server]?.includes(ToolCategory.OBSERVABILITY)
    );

    return {
      recommended: observabilityServers.length > 0 ? observabilityServers : availableServers,
      categories: [],
      confidence: 0.3, // Low confidence
    };
  }

  // Find servers that match detected categories
  const recommended = new Set<string>();
  let matchScore = 0;

  for (const server of availableServers) {
    const serverCategories = SERVER_CATEGORIES[server] || [];
    const matches = serverCategories.filter(cat => categories.includes(cat));

    if (matches.length > 0) {
      recommended.add(server);
      matchScore += matches.length;
    }
  }

  // Calculate confidence based on match quality
  const maxPossibleMatches = categories.length * availableServers.length;
  const confidence = Math.min(1, matchScore / (maxPossibleMatches * 0.5));

  return {
    recommended: Array.from(recommended),
    categories,
    confidence,
  };
}

/**
 * Get default tool loading strategy based on context
 */
export function getDefaultLoadingStrategy(
  query?: string,
  agentId?: string
): LoaderOptions {
  // Agent-specific strategies
  const agentStrategies: Record<string, Partial<LoaderOptions>> = {
    'incident-commander': {
      priorityCategories: [
        ToolCategory.INCIDENT,
        ToolCategory.ONCALL,
        ToolCategory.ALERTS,
        ToolCategory.LOGS,
      ],
      maxTools: 30,
    },
    'log-analyzer': {
      priorityCategories: [
        ToolCategory.LOGS,
        ToolCategory.TRACES,
        ToolCategory.METRICS,
      ],
      maxTools: 25,
    },
    'metrics-explorer': {
      priorityCategories: [
        ToolCategory.METRICS,
        ToolCategory.OBSERVABILITY,
        ToolCategory.ALERTS,
      ],
      maxTools: 25,
    },
  };

  const baseOptions: LoaderOptions = {
    query,
    includeRareTools: false,
    minUsageThreshold: 1,
    maxTools: 40, // Default limit to reduce tokens
  };

  // Apply agent-specific strategy if available
  if (agentId && agentStrategies[agentId]) {
    return {
      ...baseOptions,
      ...agentStrategies[agentId],
    };
  }

  return baseOptions;
}
