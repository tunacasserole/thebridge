/**
 * Dashboard Types
 * Shared type definitions for dashboard components
 */

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
  url: string;
}

export interface Epic extends Task {
  type: 'epic';
  stories?: Task[];
}

export interface JiraData {
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
  };
}

export type FilterMode = 'todo' | 'backlog' | 'codereview' | 'inprogress' | 'done';
export type ActivePanel = 'jira' | 'slack' | 'confluence' | 'rootly' | 'newrelic' | 'coralogix' | 'metabase' | null;
