/**
 * Tool Categories - Context-aware tool filtering
 *
 * Categorizes MCP tools by functionality and domain to enable
 * dynamic loading based on user query context.
 */

export enum ToolCategory {
  // Observability & Monitoring
  OBSERVABILITY = 'observability',
  METRICS = 'metrics',
  LOGS = 'logs',
  TRACES = 'traces',
  ALERTS = 'alerts',

  // Incident Management
  INCIDENT = 'incident',
  ONCALL = 'oncall',
  RUNBOOK = 'runbook',

  // Code & Development
  CODE = 'code',
  GIT = 'git',
  REPOSITORY = 'repository',
  PR = 'pr',
  ISSUE = 'issue',

  // Communication
  SLACK = 'slack',
  NOTIFICATION = 'notification',

  // Documentation
  WIKI = 'wiki',
  CONFLUENCE = 'confluence',
  JIRA = 'jira',

  // Infrastructure
  INFRASTRUCTURE = 'infrastructure',
  DEPLOYMENT = 'deployment',
  KUBERNETES = 'kubernetes',

  // General/Utility
  SEARCH = 'search',
  UTILITY = 'utility',
}

/**
 * Tool name patterns for automatic categorization
 * Maps regex patterns to categories
 */
export const TOOL_PATTERNS: Record<string, RegExp[]> = {
  [ToolCategory.OBSERVABILITY]: [
    /query|search|list/i,
    /dashboard|widget/i,
    /monitor/i,
  ],
  [ToolCategory.METRICS]: [
    /metric/i,
    /timeseries/i,
    /stat/i,
  ],
  [ToolCategory.LOGS]: [
    /log/i,
    /query.*log/i,
    /search.*log/i,
  ],
  [ToolCategory.TRACES]: [
    /trace/i,
    /span/i,
    /apm/i,
  ],
  [ToolCategory.ALERTS]: [
    /alert/i,
    /notification/i,
    /trigger/i,
  ],
  [ToolCategory.INCIDENT]: [
    /incident/i,
    /postmortem/i,
    /retrospective/i,
  ],
  [ToolCategory.ONCALL]: [
    /oncall|on.call/i,
    /schedule/i,
    /rotation/i,
  ],
  [ToolCategory.RUNBOOK]: [
    /runbook/i,
    /playbook/i,
    /procedure/i,
  ],
  [ToolCategory.CODE]: [
    /code|file|source/i,
    /search.*code/i,
  ],
  [ToolCategory.GIT]: [
    /git|commit|branch/i,
    /diff|merge/i,
  ],
  [ToolCategory.REPOSITORY]: [
    /repo|repository/i,
    /clone|fork/i,
  ],
  [ToolCategory.PR]: [
    /pull.request|pr/i,
    /review/i,
  ],
  [ToolCategory.ISSUE]: [
    /issue|ticket/i,
    /bug|task/i,
  ],
  [ToolCategory.SLACK]: [
    /slack/i,
    /channel|message|post/i,
  ],
  [ToolCategory.WIKI]: [
    /wiki|page|article/i,
  ],
  [ToolCategory.CONFLUENCE]: [
    /confluence/i,
    /space|page/i,
  ],
  [ToolCategory.JIRA]: [
    /jira/i,
    /epic|story/i,
  ],
  [ToolCategory.INFRASTRUCTURE]: [
    /infra|server|host/i,
    /service|resource/i,
  ],
  [ToolCategory.DEPLOYMENT]: [
    /deploy/i,
    /release|rollout/i,
  ],
  [ToolCategory.KUBERNETES]: [
    /k8s|kubernetes/i,
    /pod|container|namespace/i,
  ],
  [ToolCategory.SEARCH]: [
    /search|find|query/i,
    /list|get/i,
  ],
};

/**
 * Query keywords that suggest certain tool categories
 */
export const QUERY_KEYWORDS: Record<ToolCategory, string[]> = {
  [ToolCategory.OBSERVABILITY]: [
    'monitor', 'observability', 'dashboard', 'view', 'check',
  ],
  [ToolCategory.METRICS]: [
    'metric', 'performance', 'cpu', 'memory', 'latency', 'throughput',
    'response time', 'error rate',
  ],
  [ToolCategory.LOGS]: [
    'log', 'logs', 'error', 'exception', 'stack trace', 'debug',
  ],
  [ToolCategory.TRACES]: [
    'trace', 'tracing', 'distributed', 'request flow', 'latency',
  ],
  [ToolCategory.ALERTS]: [
    'alert', 'notification', 'alarm', 'trigger', 'threshold',
  ],
  [ToolCategory.INCIDENT]: [
    'incident', 'outage', 'downtime', 'postmortem', 'root cause',
    'issue', 'problem',
  ],
  [ToolCategory.ONCALL]: [
    'oncall', 'on-call', 'schedule', 'rotation', 'escalation',
  ],
  [ToolCategory.RUNBOOK]: [
    'runbook', 'playbook', 'procedure', 'how to', 'steps',
  ],
  [ToolCategory.CODE]: [
    'code', 'file', 'source', 'implementation', 'function', 'class',
  ],
  [ToolCategory.GIT]: [
    'git', 'commit', 'branch', 'diff', 'merge', 'version control',
  ],
  [ToolCategory.REPOSITORY]: [
    'repository', 'repo', 'project', 'codebase',
  ],
  [ToolCategory.PR]: [
    'pull request', 'pr', 'review', 'merge request',
  ],
  [ToolCategory.ISSUE]: [
    'issue', 'ticket', 'bug', 'task', 'backlog',
  ],
  [ToolCategory.SLACK]: [
    'slack', 'message', 'channel', 'dm', 'notify',
  ],
  [ToolCategory.NOTIFICATION]: [
    'notification', 'notify', 'send', 'alert', 'broadcast',
  ],
  [ToolCategory.WIKI]: [
    'wiki', 'documentation', 'docs', 'knowledge base',
  ],
  [ToolCategory.CONFLUENCE]: [
    'confluence', 'page', 'space',
  ],
  [ToolCategory.JIRA]: [
    'jira', 'epic', 'story', 'sprint',
  ],
  [ToolCategory.INFRASTRUCTURE]: [
    'infrastructure', 'server', 'host', 'service', 'resource',
  ],
  [ToolCategory.DEPLOYMENT]: [
    'deploy', 'deployment', 'release', 'rollout', 'version',
  ],
  [ToolCategory.KUBERNETES]: [
    'kubernetes', 'k8s', 'pod', 'container', 'namespace', 'cluster',
  ],
  [ToolCategory.SEARCH]: [
    'search', 'find', 'query', 'list', 'get', 'lookup',
  ],
  [ToolCategory.UTILITY]: [
    'utility', 'tool', 'helper', 'misc', 'general',
  ],
};

/**
 * Server-specific category mappings
 * Maps MCP server names to their primary categories
 */
export const SERVER_CATEGORIES: Record<string, ToolCategory[]> = {
  coralogix: [
    ToolCategory.OBSERVABILITY,
    ToolCategory.LOGS,
    ToolCategory.METRICS,
    ToolCategory.TRACES,
    ToolCategory.ALERTS,
  ],
  newrelic: [
    ToolCategory.OBSERVABILITY,
    ToolCategory.METRICS,
    ToolCategory.TRACES,
    ToolCategory.ALERTS,
  ],
  rootly: [
    ToolCategory.INCIDENT,
    ToolCategory.ONCALL,
    ToolCategory.RUNBOOK,
  ],
  github: [
    ToolCategory.CODE,
    ToolCategory.GIT,
    ToolCategory.REPOSITORY,
    ToolCategory.PR,
    ToolCategory.ISSUE,
  ],
  slack: [
    ToolCategory.SLACK,
    ToolCategory.NOTIFICATION,
  ],
  confluence: [
    ToolCategory.CONFLUENCE,
    ToolCategory.WIKI,
  ],
  jira: [
    ToolCategory.JIRA,
    ToolCategory.ISSUE,
  ],
};

/**
 * Categorize a tool based on its name and description
 */
export function categorizeTool(
  toolName: string,
  description?: string,
  serverName?: string
): ToolCategory[] {
  const categories = new Set<ToolCategory>();

  // Add server-specific categories
  if (serverName && SERVER_CATEGORIES[serverName]) {
    SERVER_CATEGORIES[serverName].forEach(cat => categories.add(cat));
  }

  // Check tool name and description against patterns
  const textToCheck = `${toolName} ${description || ''}`.toLowerCase();

  for (const [category, patterns] of Object.entries(TOOL_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(textToCheck))) {
      categories.add(category as ToolCategory);
    }
  }

  // Default to utility if no categories found
  if (categories.size === 0) {
    categories.add(ToolCategory.UTILITY);
  }

  return Array.from(categories);
}

/**
 * Detect relevant categories from user query
 */
export function detectCategoriesFromQuery(query: string): ToolCategory[] {
  const lowerQuery = query.toLowerCase();
  const detected = new Set<ToolCategory>();

  for (const [category, keywords] of Object.entries(QUERY_KEYWORDS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
      detected.add(category as ToolCategory);
    }
  }

  return Array.from(detected);
}

/**
 * Get category priority based on query context
 * Returns categories sorted by relevance (most relevant first)
 */
export function getCategoryPriority(query: string): ToolCategory[] {
  const detected = detectCategoriesFromQuery(query);

  if (detected.length === 0) {
    // Default priority when no specific categories detected
    return [
      ToolCategory.SEARCH,
      ToolCategory.OBSERVABILITY,
      ToolCategory.INCIDENT,
      ToolCategory.LOGS,
    ];
  }

  return detected;
}

/**
 * Check if a category is relevant for a query
 */
export function isCategoryRelevant(
  category: ToolCategory,
  query: string
): boolean {
  const relevantCategories = detectCategoriesFromQuery(query);

  // If no specific categories detected, consider all as relevant
  if (relevantCategories.length === 0) {
    return true;
  }

  return relevantCategories.includes(category);
}
