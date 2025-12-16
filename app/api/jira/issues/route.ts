import { NextRequest, NextResponse } from 'next/server';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'PE';
const JIRA_EPIC_LINK_FIELD = process.env.JIRA_EPIC_LINK_FIELD || 'customfield_10014';

interface Task {
  id: string;
  key: string;
  type: 'epic' | 'story' | 'task' | 'bug' | 'subtask';
  title: string;
  description?: string | null;
  status: string;
  statusCategory: 'todo' | 'inprogress' | 'done';
  priority: string;
  priorityIcon?: string;
  assignee?: {
    name: string;
    email: string;
    avatar: string;
  };
  parentKey?: string;
  parentTitle?: string;
  url: string;
}

interface Epic extends Task {
  type: 'epic';
  stories?: Task[];
}

function mapStatusCategory(category: string): 'todo' | 'inprogress' | 'done' {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('done') || cat.includes('complete')) return 'done';
  if (cat.includes('progress') || cat.includes('review')) return 'inprogress';
  return 'todo';
}

function mapIssueType(issueTypeName: string): 'epic' | 'story' | 'task' | 'bug' | 'subtask' {
  const type = issueTypeName.toLowerCase();
  if (type.includes('epic')) return 'epic';
  if (type.includes('story')) return 'story';
  if (type.includes('bug')) return 'bug';
  if (type.includes('subtask') || type.includes('sub-task')) return 'subtask';
  return 'task';
}

function transformIssue(issue: any, baseUrl: string, epicLinkField: string): Task {
  const fields = issue.fields;
  const issueType = mapIssueType(fields.issuetype.name);

  // Determine parent key: use epic link for stories/tasks/bugs, parent for subtasks
  let parentKey = fields.parent?.key;
  let parentTitle = fields.parent?.fields?.summary;

  // If this is a story/task/bug (not a subtask), check for epic link
  if (epicLinkField && !fields.issuetype.subtask && fields[epicLinkField]) {
    parentKey = fields[epicLinkField];
    parentTitle = undefined; // Epic title would need separate lookup
  }

  return {
    id: issue.id,
    key: issue.key,
    type: issueType,
    title: fields.summary || '',
    description: fields.description,
    status: fields.status?.name || 'Unknown',
    statusCategory: mapStatusCategory(fields.status?.statusCategory?.name || ''),
    priority: fields.priority?.name || 'Medium',
    priorityIcon: fields.priority?.iconUrl,
    assignee: fields.assignee ? {
      name: fields.assignee.displayName,
      email: fields.assignee.emailAddress || '',
      avatar: fields.assignee.avatarUrls?.['48x48'] || fields.assignee.avatarUrls?.['24x24'] || '',
    } : undefined,
    parentKey,
    parentTitle,
    url: `${baseUrl}/browse/${issue.key}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Jira credentials not configured' },
        { status: 500 }
      );
    }

    // Build JQL query - get all issues assigned to current user
    const jql = `project = ${JIRA_PROJECT_KEY} AND assignee = currentUser() ORDER BY updated DESC`;

    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

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
      'parent',
      'labels',
      'project',
      JIRA_EPIC_LINK_FIELD,
    ];

    const apiUrl = `${JIRA_BASE_URL}/rest/api/3/search/jql`;
    const queryParams = new URLSearchParams({
      jql: jql,
      maxResults: '100',
      fields: fieldsList.join(','),
    });

    console.log('Fetching Jira issues from:', apiUrl);
    console.log('JQL:', jql);
    console.log('Epic Link Field:', JIRA_EPIC_LINK_FIELD);

    const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
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
      console.error('Jira API error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Jira authentication failed. Check your API token.' },
          { status: 401 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { success: false, error: 'Access denied. Check your Jira permissions.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Jira API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log(`[Jira] Found ${data.total} total issues, returning ${data.issues?.length || 0}`);

    // Transform all issues
    const allTasks = (data.issues || []).map((issue: any) =>
      transformIssue(issue, JIRA_BASE_URL, JIRA_EPIC_LINK_FIELD)
    );

    // Separate by type
    const epics: Epic[] = [];
    const stories: Task[] = [];
    const tasks: Task[] = [];
    const bugs: Task[] = [];

    allTasks.forEach((task: Task) => {
      switch (task.type) {
        case 'epic':
          epics.push({
            ...task,
            type: 'epic',
            stories: allTasks.filter((t: Task) => t.parentKey === task.key),
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
    const summary = {
      totalEpics: epics.length,
      totalStories: stories.length,
      totalTasks: tasks.length,
      totalBugs: bugs.length,
      inProgress: allTasks.filter((t: Task) => t.statusCategory === 'inprogress').length,
      todo: allTasks.filter((t: Task) => t.statusCategory === 'todo').length,
      done: allTasks.filter((t: Task) => t.statusCategory === 'done').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        epics,
        stories,
        tasks,
        bugs,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching Jira issues:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          { success: false, error: 'Jira request timed out after 10 seconds. Please try again or check your Jira connection.' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch Jira issues' },
      { status: 500 }
    );
  }
}
