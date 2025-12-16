/**
 * Tool Definitions for Claude
 *
 * These tools are exposed to Claude for the agent loop.
 * Claude decides which tool to call based on user intent.
 */

import type Anthropic from '@anthropic-ai/sdk';

// Type alias for tool definition
type ToolDefinition = Anthropic.Tool;

/**
 * Rootly Tools - Incident Management
 */
export const rootlyGetIncidents: ToolDefinition = {
  name: 'rootly_get_incidents',
  description: `Get incidents from Rootly incident management system. Returns active incidents, recent incidents, alerts, and summary statistics including MTTR. Use this when the user asks about:
- Current incidents or outages
- Active alerts
- On-call status
- Incident history
- MTTR or incident metrics`,
  input_schema: {
    type: 'object' as const,
    properties: {
      include_resolved: {
        type: 'boolean',
        description: 'Whether to include resolved incidents in the response. Default: false (only active)',
      },
    },
    required: [],
  },
};

export const rootlyUpdateIncident: ToolDefinition = {
  name: 'rootly_update_incident',
  description: `Update the status of a Rootly incident. Use this to transition an incident through its lifecycle (in_triage -> started -> mitigated -> resolved).`,
  input_schema: {
    type: 'object' as const,
    properties: {
      incident_id: {
        type: 'string',
        description: 'The Rootly incident ID',
      },
      status: {
        type: 'string',
        enum: ['in_triage', 'started', 'mitigated', 'resolved', 'cancelled'],
        description: 'The new status for the incident',
      },
    },
    required: ['incident_id', 'status'],
  },
};

export const rootlyPostComment: ToolDefinition = {
  name: 'rootly_post_comment',
  description: `Post a comment/note on a Rootly incident. Use this to add updates, findings, or status notes to an incident.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      incident_id: {
        type: 'string',
        description: 'The Rootly incident ID',
      },
      comment: {
        type: 'string',
        description: 'The comment text to add',
      },
    },
    required: ['incident_id', 'comment'],
  },
};

/**
 * GitHub Tools - Repository Management
 */
export const githubGetPRs: ToolDefinition = {
  name: 'github_get_prs',
  description: `Get pull requests from GitHub repositories. Returns open PRs, recently merged PRs, and commit history. Use when the user asks about:
- Open pull requests
- Recently merged PRs
- Code changes
- Repository activity`,
  input_schema: {
    type: 'object' as const,
    properties: {
      type: {
        type: 'string',
        enum: ['open', 'merged', 'all'],
        description: 'Type of PRs to fetch. Default: all',
      },
      repository: {
        type: 'string',
        description: 'Specific repository name. If not provided, fetches from all configured repos.',
      },
    },
    required: [],
  },
};

/**
 * Jira Tools - Issue Management
 */
export const jiraSearchIssues: ToolDefinition = {
  name: 'jira_search_issues',
  description: `Search for Jira issues using filters or JQL. Use when the user asks about:
- Their assigned tickets/tasks
- Issues in a project
- Bugs or stories
- Work items with specific status`,
  input_schema: {
    type: 'object' as const,
    properties: {
      assignee: {
        type: 'string',
        description: 'Filter by assignee name or email',
      },
      status: {
        type: 'string',
        description: 'Filter by status (e.g., "In Progress", "Done")',
      },
      project: {
        type: 'string',
        description: 'Filter by project key',
      },
      issue_type: {
        type: 'string',
        description: 'Filter by issue type (Story, Bug, Task, Epic)',
      },
      jql: {
        type: 'string',
        description: 'Raw JQL query. If provided, other filters are ignored.',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results (default: 20, max: 50)',
      },
    },
    required: [],
  },
};

export const jiraGetIssue: ToolDefinition = {
  name: 'jira_get_issue',
  description: `Get details of a specific Jira issue by its key (e.g., PROJ-123).`,
  input_schema: {
    type: 'object' as const,
    properties: {
      issue_key: {
        type: 'string',
        description: 'The Jira issue key (e.g., PROJ-123)',
      },
    },
    required: ['issue_key'],
  },
};

export const jiraAddComment: ToolDefinition = {
  name: 'jira_add_comment',
  description: `Add a comment to a Jira issue.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      issue_key: {
        type: 'string',
        description: 'The Jira issue key (e.g., PROJ-123)',
      },
      comment: {
        type: 'string',
        description: 'The comment text to add',
      },
    },
    required: ['issue_key', 'comment'],
  },
};

export const jiraCreateStory: ToolDefinition = {
  name: 'jira_create_story',
  description: `Create a new story in Jira.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      project_key: {
        type: 'string',
        description: 'The project key to create the story in',
      },
      summary: {
        type: 'string',
        description: 'The story title/summary',
      },
      description: {
        type: 'string',
        description: 'Optional description for the story',
      },
    },
    required: ['project_key', 'summary'],
  },
};

/**
 * New Relic Tools - APM & Observability
 */
export const newrelicGetApplications: ToolDefinition = {
  name: 'newrelic_get_applications',
  description: `Get APM application status from New Relic. Returns application health, alert status, and summary. Use when the user asks about:
- Application health
- Service status
- APM metrics
- Alert conditions`,
  input_schema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

/**
 * Metabase Tools - BI & Analytics
 */
export const metabaseListDatabases: ToolDefinition = {
  name: 'metabase_list_databases',
  description: `List all databases available in Metabase.`,
  input_schema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

export const metabaseExecuteQuery: ToolDefinition = {
  name: 'metabase_execute_query',
  description: `Execute a SQL query against a Metabase database. Use for data analysis and reporting queries.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      database_id: {
        type: 'number',
        description: 'The Metabase database ID to query',
      },
      sql: {
        type: 'string',
        description: 'The SQL query to execute',
      },
    },
    required: ['database_id', 'sql'],
  },
};

export const metabaseSearchQuestions: ToolDefinition = {
  name: 'metabase_search_questions',
  description: `Search for saved questions/reports in Metabase by name.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query for question names',
      },
    },
    required: ['query'],
  },
};

export const metabaseRunQuestion: ToolDefinition = {
  name: 'metabase_run_question',
  description: `Run a saved Metabase question/report and get results.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      question_id: {
        type: 'number',
        description: 'The Metabase question/card ID',
      },
    },
    required: ['question_id'],
  },
};

/**
 * Web Tools - Search & Fetch
 */
export const webSearch: ToolDefinition = {
  name: 'web_search',
  description: `Search the web for information. Use when you need current information, documentation, or answers not in your knowledge base.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
    },
    required: ['query'],
  },
};

export const httpRequest: ToolDefinition = {
  name: 'http_request',
  description: `Make an HTTP request to an API endpoint. Use for fetching data from REST APIs or webhooks.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'The URL to request',
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'HTTP method (default: GET)',
      },
      headers: {
        type: 'object',
        description: 'Request headers as key-value pairs',
      },
      body: {
        type: 'string',
        description: 'Request body (JSON string for POST/PUT)',
      },
    },
    required: ['url'],
  },
};

/**
 * All available tools grouped by category
 */
export const ALL_TOOLS: ToolDefinition[] = [
  // Rootly - Incident Management
  rootlyGetIncidents,
  rootlyUpdateIncident,
  rootlyPostComment,
  // GitHub - Repository Management
  githubGetPRs,
  // Jira - Issue Management
  jiraSearchIssues,
  jiraGetIssue,
  jiraAddComment,
  jiraCreateStory,
  // New Relic - APM
  newrelicGetApplications,
  // Metabase - BI
  metabaseListDatabases,
  metabaseExecuteQuery,
  metabaseSearchQuestions,
  metabaseRunQuestion,
  // Web
  webSearch,
  httpRequest,
];

/**
 * Tool categories for UI filtering
 */
export const TOOL_CATEGORIES = {
  incidents: ['rootly_get_incidents', 'rootly_update_incident', 'rootly_post_comment'],
  github: ['github_get_prs'],
  jira: ['jira_search_issues', 'jira_get_issue', 'jira_add_comment', 'jira_create_story'],
  observability: ['newrelic_get_applications'],
  analytics: ['metabase_list_databases', 'metabase_execute_query', 'metabase_search_questions', 'metabase_run_question'],
  web: ['web_search', 'http_request'],
};

/**
 * Get tools by enabled tool IDs (for UI toggle support)
 */
export function getEnabledTools(enabledToolIds: string[]): ToolDefinition[] {
  if (!enabledToolIds || enabledToolIds.length === 0) {
    return ALL_TOOLS;
  }
  return ALL_TOOLS.filter((tool) => enabledToolIds.includes(tool.name));
}
