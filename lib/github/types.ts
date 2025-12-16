// GitHub API Types

// Raw API response types
export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  open_issues_count: number;
  forks_count: number;
  updated_at: string;
}

// Transformed types for TheBridge
export interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  messageShort: string;
  author: string;
  authorAvatar: string | null;
  timestamp: Date;
  duration: string;
  url: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  authorAvatar: string;
  url: string;
  createdAt: Date;
  duration: string;
  draft: boolean;
}

export interface MergedPR {
  id: number;
  number: number;
  title: string;
  author: string;
  authorAvatar: string;
  url: string;
  repository: string;
  mergedAt: Date;
  mergedAgo: string;
  branch: string;
}

export interface OpenPR {
  id: number;
  number: number;
  title: string;
  author: string;
  authorAvatar: string;
  url: string;
  repository: string;
  createdAt: Date;
  updatedAt: Date;
  createdAgo: string;
  draft: boolean;
}

export interface GitHubData {
  repository: {
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    stars: number;
    openIssues: number;
    forks: number;
  };
  commits: Commit[];
  pullRequests: PullRequest[];
  summary: {
    commitsToday: number;
    commitsThisWeek: number;
    openPRs: number;
    mergedPRsThisWeek: number;
  };
  lastUpdated: string;
}

export interface RepoInfo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  openIssues: number;
  forks: number;
  defaultBranch: string;
  language: string | null;
  updatedAt: string;
}

export interface GitHubMultiRepoDashboardData {
  mergedPRs: MergedPR[];
  repositories: RepoInfo[];
  summary: {
    totalMerged: number;
    lastUpdated: Date;
    byRepo: Record<string, number>;
  };
}

export interface GitHubOpenPRsDashboardData {
  openPRs: OpenPR[];
  summary: {
    totalOpen: number;
    lastUpdated: Date;
    byRepo: Record<string, number>;
  };
}

// API Response wrapper
export interface GitHubAPIResponse {
  success: boolean;
  data?: GitHubData;
  error?: string;
}
