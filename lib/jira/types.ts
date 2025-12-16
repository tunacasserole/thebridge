// Jira API Types

// Raw API response types
export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string | null;
    status: {
      name: string;
      statusCategory: {
        key: string;
        colorName: string;
      };
    };
    issuetype: {
      name: string;
      iconUrl: string;
      subtask: boolean;
    };
    priority?: {
      name: string;
      iconUrl: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
      avatarUrls: {
        '48x48': string;
      };
    } | null;
    created: string;
    updated: string;
    duedate?: string | null;
    parent?: {
      key: string;
      fields: {
        summary: string;
        issuetype: {
          name: string;
        };
      };
    };
    subtasks?: Array<{
      key: string;
      fields: {
        summary: string;
        status: {
          name: string;
        };
      };
    }>;
    labels?: string[];
    project: {
      key: string;
      name: string;
    };
    // Dynamic epic link field (e.g., customfield_10014)
    [key: string]: any;
  };
}

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

// Transformed types for TheBridge
export interface Task {
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
  subtasks: Array<{
    key: string;
    title: string;
    status: string;
  }>;
  labels: string[];
  projectKey: string;
  projectName: string;
  created: Date;
  updated: Date;
  dueDate?: Date | null;
  url: string;
}

export interface Epic extends Task {
  type: 'epic';
  stories: Task[];
}

export interface JiraDashboardData {
  epics: Epic[];
  stories: Task[];
  tasks: Task[];
  bugs: Task[];
  summary: {
    totalEpics: number;
    totalStories: number;
    totalTasks: number;
    totalBugs: number;
    inProgress: number;
    todo: number;
    done: number;
    overdue: number;
  };
}
