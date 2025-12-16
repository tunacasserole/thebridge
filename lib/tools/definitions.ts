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
 * GitHub Code Tools - Read/Write Code in Repositories
 */
export const githubReadFile: ToolDefinition = {
  name: 'github_read_file',
  description: `Read the contents of a file from a GitHub repository. Use this to:
- View source code files
- Read configuration files
- Check existing implementations before making changes
- Understand code structure`,
  input_schema: {
    type: 'object' as const,
    properties: {
      repository: {
        type: 'string',
        description: 'Repository name (e.g., "my-repo")',
      },
      path: {
        type: 'string',
        description: 'File path in the repository (e.g., "src/index.ts")',
      },
      branch: {
        type: 'string',
        description: 'Branch name. Defaults to main branch if not specified.',
      },
    },
    required: ['repository', 'path'],
  },
};

export const githubWriteFile: ToolDefinition = {
  name: 'github_write_file',
  description: `Create or update a file in a GitHub repository. This commits directly to the specified branch. Use this to:
- Create new source files
- Update existing code
- Add configuration files
- Write documentation`,
  input_schema: {
    type: 'object' as const,
    properties: {
      repository: {
        type: 'string',
        description: 'Repository name (e.g., "my-repo")',
      },
      path: {
        type: 'string',
        description: 'File path in the repository (e.g., "src/newfile.ts")',
      },
      content: {
        type: 'string',
        description: 'The full content to write to the file',
      },
      message: {
        type: 'string',
        description: 'Commit message describing the change',
      },
      branch: {
        type: 'string',
        description: 'Branch to commit to. Defaults to main branch.',
      },
    },
    required: ['repository', 'path', 'content', 'message'],
  },
};

export const githubDeleteFile: ToolDefinition = {
  name: 'github_delete_file',
  description: `Delete a file from a GitHub repository. This commits the deletion to the specified branch.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      repository: {
        type: 'string',
        description: 'Repository name',
      },
      path: {
        type: 'string',
        description: 'File path to delete',
      },
      message: {
        type: 'string',
        description: 'Commit message for the deletion',
      },
      branch: {
        type: 'string',
        description: 'Branch to commit to. Defaults to main branch.',
      },
    },
    required: ['repository', 'path', 'message'],
  },
};

export const githubListDirectory: ToolDefinition = {
  name: 'github_list_directory',
  description: `List the contents of a directory in a GitHub repository. Use this to:
- Explore repository structure
- Find files to read or modify
- Understand project layout`,
  input_schema: {
    type: 'object' as const,
    properties: {
      repository: {
        type: 'string',
        description: 'Repository name',
      },
      path: {
        type: 'string',
        description: 'Directory path. Use empty string or "/" for root.',
      },
      branch: {
        type: 'string',
        description: 'Branch name. Defaults to main branch.',
      },
    },
    required: ['repository'],
  },
};

export const githubCreateBranch: ToolDefinition = {
  name: 'github_create_branch',
  description: `Create a new branch in a GitHub repository. Use this before making changes if you want to work on a feature branch.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      repository: {
        type: 'string',
        description: 'Repository name',
      },
      branch_name: {
        type: 'string',
        description: 'Name for the new branch',
      },
      from_branch: {
        type: 'string',
        description: 'Source branch to create from. Defaults to "main".',
      },
    },
    required: ['repository', 'branch_name'],
  },
};

export const githubListBranches: ToolDefinition = {
  name: 'github_list_branches',
  description: `List all branches in a GitHub repository.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      repository: {
        type: 'string',
        description: 'Repository name',
      },
    },
    required: ['repository'],
  },
};

export const githubSearchCode: ToolDefinition = {
  name: 'github_search_code',
  description: `Search for code within a GitHub repository. Use this to find specific functions, classes, or patterns.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      repository: {
        type: 'string',
        description: 'Repository name',
      },
      query: {
        type: 'string',
        description: 'Search query (function names, class names, code patterns)',
      },
    },
    required: ['repository', 'query'],
  },
};

export const githubGetTree: ToolDefinition = {
  name: 'github_get_tree',
  description: `Get the full file tree of a GitHub repository. Returns all files and directories. Use this to understand the complete project structure.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      repository: {
        type: 'string',
        description: 'Repository name',
      },
      branch: {
        type: 'string',
        description: 'Branch name. Defaults to "main".',
      },
    },
    required: ['repository'],
  },
};

export const githubCreatePR: ToolDefinition = {
  name: 'github_create_pr',
  description: `Create a pull request to merge changes from one branch to another. Use this after making changes on a feature branch.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      repository: {
        type: 'string',
        description: 'Repository name',
      },
      title: {
        type: 'string',
        description: 'PR title',
      },
      head: {
        type: 'string',
        description: 'Source branch (the branch with your changes)',
      },
      base: {
        type: 'string',
        description: 'Target branch (usually "main")',
      },
      body: {
        type: 'string',
        description: 'PR description/body',
      },
      draft: {
        type: 'boolean',
        description: 'Create as draft PR. Default: false',
      },
    },
    required: ['repository', 'title', 'head', 'base'],
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
  // GitHub - Code Operations
  githubReadFile,
  githubWriteFile,
  githubDeleteFile,
  githubListDirectory,
  githubCreateBranch,
  githubListBranches,
  githubSearchCode,
  githubGetTree,
  githubCreatePR,
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
  code: [
    'github_read_file',
    'github_write_file',
    'github_delete_file',
    'github_list_directory',
    'github_create_branch',
    'github_list_branches',
    'github_search_code',
    'github_get_tree',
    'github_create_pr',
  ],
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
