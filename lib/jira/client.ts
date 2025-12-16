// Jira API Client

import {
  JiraIssue,
  JiraSearchResponse,
  JiraDashboardData,
  Task,
  Epic,
} from './types';

// Make API request to Jira
async function jiraFetch<T>(
  baseUrl: string,
  endpoint: string,
  email: string,
  apiToken: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${baseUrl}/rest/api/3${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  // Jira uses Basic Auth with email:api_token
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    // Add 10 second timeout to prevent hanging
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jira API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Helper to catch and format timeout errors
export async function safeJiraFetch<T>(
  baseUrl: string,
  endpoint: string,
  email: string,
  apiToken: string,
  params?: Record<string, string>
): Promise<T> {
  try {
    return await jiraFetch<T>(baseUrl, endpoint, email, apiToken, params);
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a timeout error
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Jira request timed out after 10 seconds. Please try again or check your Jira connection.');
      }
    }
    throw error;
  }
}

// Map Jira status category to simplified status
function mapStatusCategory(statusCategoryKey: string): 'todo' | 'inprogress' | 'done' {
  switch (statusCategoryKey.toLowerCase()) {
    case 'new':
    case 'indeterminate':
      return 'todo';
    case 'done':
      return 'done';
    default:
      return 'inprogress';
  }
}

// Map Jira issue type to simplified type
function mapIssueType(issueTypeName: string): 'epic' | 'story' | 'task' | 'bug' | 'subtask' {
  const type = issueTypeName.toLowerCase();
  if (type.includes('epic')) return 'epic';
  if (type.includes('story')) return 'story';
  if (type.includes('bug')) return 'bug';
  if (type.includes('subtask') || type.includes('sub-task')) return 'subtask';
  return 'task';
}

// Transform Jira issue to TheBridge format
function transformIssue(issue: JiraIssue, baseUrl: string, epicLinkField?: string): Task {
  const fields = issue.fields;
  const issueType = mapIssueType(fields.issuetype.name);

  // Determine parent key: use epic link for stories, parent for subtasks
  let parentKey = fields.parent?.key;
  let parentTitle = fields.parent?.fields.summary;

  // If this is a story/task/bug (not a subtask), check for epic link
  if (epicLinkField && !fields.issuetype.subtask && fields[epicLinkField]) {
    parentKey = fields[epicLinkField];
    parentTitle = undefined; // Epic title would need separate lookup
  }

  return {
    id: issue.id,
    key: issue.key,
    type: issueType,
    title: fields.summary,
    description: fields.description,
    status: fields.status.name,
    statusCategory: mapStatusCategory(fields.status.statusCategory.key),
    priority: fields.priority?.name || 'Medium',
    priorityIcon: fields.priority?.iconUrl,
    assignee: fields.assignee ? {
      name: fields.assignee.displayName,
      email: fields.assignee.emailAddress,
      avatar: fields.assignee.avatarUrls['48x48'],
    } : undefined,
    parentKey,
    parentTitle,
    subtasks: fields.subtasks?.map(subtask => ({
      key: subtask.key,
      title: subtask.fields.summary,
      status: subtask.fields.status.name,
    })) || [],
    labels: fields.labels || [],
    projectKey: fields.project.key,
    projectName: fields.project.name,
    created: new Date(fields.created),
    updated: new Date(fields.updated),
    dueDate: fields.duedate ? new Date(fields.duedate) : null,
    url: `${baseUrl}/browse/${issue.key}`,
  };
}

// Main function to fetch all Jira dashboard data
export async function fetchJiraDashboardData(
  baseUrl: string,
  email: string,
  apiToken: string,
  projectKey?: string,
  epicLinkField?: string
): Promise<JiraDashboardData> {
  // Build JQL query - get all tasks assigned to current user
  let jql = 'assignee = currentUser() ORDER BY updated DESC';

  // Optional: filter by project if specified
  if (projectKey) {
    jql = `project = ${projectKey} AND assignee = currentUser() ORDER BY updated DESC`;
  }

  console.log('[Jira] Executing JQL:', jql);
  console.log('[Jira] Epic Link Field:', epicLinkField || 'Not configured');

  // Build fields list including epic link field
  const fieldsList = [
    'summary',
    'description',
    'status',
    'issuetype',
    'priority',
    'assignee',
    'created',
    'updated',
    'duedate',
    'parent',
    'subtasks',
    'labels',
    'project'
  ];

  // Add epic link field if configured
  if (epicLinkField) {
    fieldsList.push(epicLinkField);
  }

  // Fetch all issues assigned to current user
  const searchResponse = await safeJiraFetch<JiraSearchResponse>(
    baseUrl,
    '/search/jql',
    email,
    apiToken,
    {
      jql,
      maxResults: '100',
      fields: fieldsList.join(','),
    }
  );

  console.log(`[Jira] Found ${searchResponse.total} total issues, returning ${searchResponse.issues.length}`);

  // Transform all issues
  const allTasks = searchResponse.issues.map(issue => transformIssue(issue, baseUrl, epicLinkField));

  // Separate by type
  const epics: Epic[] = [];
  const stories: Task[] = [];
  const tasks: Task[] = [];
  const bugs: Task[] = [];

  allTasks.forEach(task => {
    switch (task.type) {
      case 'epic':
        epics.push({
          ...task,
          type: 'epic',
          stories: allTasks.filter(t => t.parentKey === task.key),
        });
        break;
      case 'story':
        stories.push(task);
        break;
      case 'bug':
        bugs.push(task);
        break;
      case 'task':
      case 'subtask':
        tasks.push(task);
        break;
    }
  });

  // Calculate summary metrics
  const now = new Date();
  const overdue = allTasks.filter(
    task => task.dueDate && task.dueDate < now && task.statusCategory !== 'done'
  ).length;

  const summary = {
    totalEpics: epics.length,
    totalStories: stories.length,
    totalTasks: tasks.length,
    totalBugs: bugs.length,
    inProgress: allTasks.filter(t => t.statusCategory === 'inprogress').length,
    todo: allTasks.filter(t => t.statusCategory === 'todo').length,
    done: allTasks.filter(t => t.statusCategory === 'done').length,
    overdue,
  };

  return {
    epics,
    stories,
    tasks,
    bugs,
    summary,
  };
}

// Create a new story in Jira
export async function createJiraStory(
  baseUrl: string,
  email: string,
  apiToken: string,
  projectKey: string,
  summary: string,
  description?: string
): Promise<JiraIssue> {
  const url = `${baseUrl}/rest/api/3/issue`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  const payload = {
    fields: {
      project: {
        key: projectKey,
      },
      summary,
      description: description
        ? {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: description,
                  },
                ],
              },
            ],
          }
        : undefined,
      issuetype: {
        name: 'Story',
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create story (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Get available transitions for an issue
export async function getIssueTransitions(
  baseUrl: string,
  email: string,
  apiToken: string,
  issueKey: string
): Promise<{ id: string; name: string; to: { name: string } }[]> {
  const url = `${baseUrl}/rest/api/3/issue/${issueKey}/transitions`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get transitions (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.transitions || [];
}

// Update issue status via transition
export async function updateJiraIssueStatus(
  baseUrl: string,
  email: string,
  apiToken: string,
  issueKey: string,
  transitionId: string
): Promise<void> {
  const url = `${baseUrl}/rest/api/3/issue/${issueKey}/transitions`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  const payload = {
    transition: {
      id: transitionId,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update status (${response.status}): ${errorText}`);
  }
}

// Get direct issue URL
export function getIssueUrl(baseUrl: string, issueKey: string): string {
  return `${baseUrl}/browse/${issueKey}`;
}

// Update issue fields (summary, description, etc.)
export async function updateJiraIssueFields(
  baseUrl: string,
  email: string,
  apiToken: string,
  issueKey: string,
  fields: { summary?: string; description?: string }
): Promise<void> {
  const url = `${baseUrl}/rest/api/3/issue/${issueKey}`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  const payload: { fields: Record<string, unknown> } = { fields: {} };

  if (fields.summary) {
    payload.fields.summary = fields.summary;
  }

  if (fields.description) {
    payload.fields.description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: fields.description,
            },
          ],
        },
      ],
    };
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update issue (${response.status}): ${errorText}`);
  }
}

// Add comment to an issue
export async function addJiraComment(
  baseUrl: string,
  email: string,
  apiToken: string,
  issueKey: string,
  comment: string
): Promise<{ id: string; body: string }> {
  const url = `${baseUrl}/rest/api/3/issue/${issueKey}/comment`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  const payload = {
    body: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: comment,
            },
          ],
        },
      ],
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add comment (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Search issues with filters - optimized for AI chat queries
export interface JiraSearchFilters {
  assignee?: string;
  status?: string;
  project?: string;
  issueType?: string;
  jql?: string;
  maxResults?: number;
}

export interface JiraSearchResult {
  issues: {
    key: string;
    summary: string;
    status: string;
    type: string;
    priority: string;
    assignee: string | null;
    url: string;
    created: string;
    updated: string;
  }[];
  total: number;
  maxResults: number;
}

export async function searchJiraIssues(
  baseUrl: string,
  email: string,
  apiToken: string,
  filters: JiraSearchFilters
): Promise<JiraSearchResult> {
  let jql: string;

  if (filters.jql) {
    // Use raw JQL if provided
    jql = filters.jql;
  } else {
    // Build JQL from filters
    const conditions: string[] = [];

    if (filters.assignee) {
      // Handle both display names and emails
      conditions.push(`assignee ~ "${filters.assignee}"`);
    }

    if (filters.status) {
      conditions.push(`status = "${filters.status}"`);
    }

    if (filters.project) {
      conditions.push(`project = "${filters.project}"`);
    }

    if (filters.issueType) {
      conditions.push(`issuetype = "${filters.issueType}"`);
    }

    jql = conditions.length > 0
      ? conditions.join(' AND ') + ' ORDER BY updated DESC'
      : 'ORDER BY updated DESC';
  }

  const maxResults = Math.min(filters.maxResults || 20, 50);

  console.log('[Jira Search] Executing JQL:', jql);

  const searchResponse = await safeJiraFetch<JiraSearchResponse>(
    baseUrl,
    '/search/jql',
    email,
    apiToken,
    {
      jql,
      maxResults: String(maxResults),
      fields: 'summary,status,issuetype,priority,assignee,created,updated',
    }
  );

  // Transform to simplified format for AI consumption
  const issues = searchResponse.issues.map(issue => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    type: issue.fields.issuetype.name,
    priority: issue.fields.priority?.name || 'None',
    assignee: issue.fields.assignee?.displayName || null,
    url: `${baseUrl}/browse/${issue.key}`,
    created: issue.fields.created,
    updated: issue.fields.updated,
  }));

  return {
    issues,
    total: searchResponse.total,
    maxResults,
  };
}
