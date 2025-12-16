// GitHub API Client

import {
  GitHubCommit,
  GitHubPullRequest,
  GitHubRepository,
  GitHubData,
  Commit,
  PullRequest,
} from './types';

const GITHUB_API_URL = 'https://api.github.com';

// Make API request to GitHub
async function githubFetch<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Format duration from timestamp
function formatDuration(timestamp: string): string {
  const start = new Date(timestamp).getTime();
  const now = Date.now();
  const diffMs = now - start;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}

// Transform GitHub commit to TheBridge format
function transformCommit(commit: GitHubCommit): Commit {
  const messageLines = commit.commit.message.split('\n');
  const messageShort = messageLines[0].length > 72
    ? messageLines[0].substring(0, 72) + '...'
    : messageLines[0];

  return {
    sha: commit.sha,
    shortSha: commit.sha.substring(0, 7),
    message: commit.commit.message,
    messageShort,
    author: commit.author?.login || commit.commit.author.name,
    authorAvatar: commit.author?.avatar_url || null,
    timestamp: new Date(commit.commit.author.date),
    duration: formatDuration(commit.commit.author.date),
    url: commit.html_url,
  };
}

// Transform GitHub PR to TheBridge format
function transformPullRequest(pr: GitHubPullRequest): PullRequest {
  const state = pr.merged_at ? 'merged' : pr.state;

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    state: state as 'open' | 'closed' | 'merged',
    author: pr.user.login,
    authorAvatar: pr.user.avatar_url,
    url: pr.html_url,
    createdAt: new Date(pr.created_at),
    duration: formatDuration(pr.created_at),
    draft: pr.draft,
  };
}

// Main function to fetch all GitHub data
export async function fetchGitHubData(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubData> {
  // Fetch repository info
  const repository = await githubFetch<GitHubRepository>(
    `/repos/${owner}/${repo}`,
    token
  );

  // Fetch recent commits (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const commits = await githubFetch<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits?since=${thirtyDaysAgo.toISOString()}&per_page=50`,
    token
  );

  // Fetch pull requests (open and recently closed)
  const [openPRs, closedPRs] = await Promise.all([
    githubFetch<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=open&per_page=20`,
      token
    ),
    githubFetch<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=closed&per_page=20&sort=updated&direction=desc`,
      token
    ),
  ]);

  // Transform data
  const transformedCommits = commits.map(transformCommit);
  const allPRs = [...openPRs, ...closedPRs];
  const transformedPRs = allPRs.map(transformPullRequest);

  // Sort PRs by created date
  transformedPRs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Calculate summary metrics
  const now = Date.now();
  const oneDayAgo = now - 86400000;
  const oneWeekAgo = now - 604800000;

  const commitsToday = transformedCommits.filter(
    c => c.timestamp.getTime() > oneDayAgo
  ).length;

  const commitsThisWeek = transformedCommits.filter(
    c => c.timestamp.getTime() > oneWeekAgo
  ).length;

  const openPRCount = transformedPRs.filter(pr => pr.state === 'open').length;

  const mergedPRsThisWeek = transformedPRs.filter(
    pr => pr.state === 'merged' && pr.createdAt.getTime() > oneWeekAgo
  ).length;

  return {
    repository: {
      name: repository.name,
      fullName: repository.full_name,
      description: repository.description,
      url: repository.html_url,
      stars: repository.stargazers_count,
      openIssues: repository.open_issues_count,
      forks: repository.forks_count,
    },
    commits: transformedCommits.slice(0, 20), // Limit to 20 most recent
    pullRequests: transformedPRs.slice(0, 20), // Limit to 20 most recent
    summary: {
      commitsToday,
      commitsThisWeek,
      openPRs: openPRCount,
      mergedPRsThisWeek,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Fetch merged PRs to main from multiple repositories
export async function fetchMergedPRsMultiRepo(
  token: string,
  owner: string,
  repos: string[]
): Promise<import('./types').GitHubMultiRepoDashboardData> {
  const mergedPRs: import('./types').MergedPR[] = [];
  const repositories: import('./types').RepoInfo[] = [];
  const byRepo: Record<string, number> = {};

  // Fetch both repo info and PRs from each repo in parallel
  await Promise.all(
    repos.map(async (repo) => {
      try {
        // Fetch repository info
        const repoInfo = await githubFetch<GitHubRepository>(
          `/repos/${owner}/${repo}`,
          token
        );

        repositories.push({
          name: repoInfo.name,
          fullName: repoInfo.full_name,
          description: repoInfo.description,
          url: repoInfo.html_url,
          stars: repoInfo.stargazers_count,
          openIssues: repoInfo.open_issues_count,
          forks: repoInfo.forks_count,
          defaultBranch: (repoInfo as GitHubRepository & { default_branch?: string }).default_branch || 'main',
          language: (repoInfo as GitHubRepository & { language?: string }).language || null,
          updatedAt: repoInfo.updated_at,
        });

        // Fetch merged PRs
        const prs = await githubFetch<GitHubPullRequest[]>(
          `/repos/${owner}/${repo}/pulls?state=closed&base=main&per_page=20&sort=updated&direction=desc`,
          token
        );

        // Filter for only merged PRs
        const merged = prs.filter(pr => pr.merged_at !== null);

        // Transform and add to results
        merged.forEach(pr => {
          mergedPRs.push({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            author: pr.user.login,
            authorAvatar: pr.user.avatar_url,
            url: pr.html_url,
            repository: repo,
            mergedAt: new Date(pr.merged_at!),
            mergedAgo: formatDuration(pr.merged_at!),
            branch: repo, // For grouping purposes
          });
        });

        byRepo[repo] = merged.length;
      } catch (error) {
        // Handle 404 errors (repository not found) more gracefully
        if (error instanceof Error && error.message.includes('404')) {
          console.warn(`[GitHub] Repository not found: ${owner}/${repo} - Check GITHUB_REPOS configuration`);
        } else if (error instanceof Error && error.message.includes('403')) {
          console.error(`[GitHub] Permission denied for ${owner}/${repo} - Check GITHUB_TOKEN permissions`);
        } else {
          console.error(`[GitHub] Error fetching merged PRs from ${owner}/${repo}:`, error instanceof Error ? error.message : error);
        }
        byRepo[repo] = 0;
      }
    })
  );

  // Sort all PRs by merged date (most recent first)
  mergedPRs.sort((a, b) => b.mergedAt.getTime() - a.mergedAt.getTime());

  return {
    mergedPRs: mergedPRs.slice(0, 50), // Limit to 50 most recent
    repositories,
    summary: {
      totalMerged: mergedPRs.length,
      lastUpdated: new Date(),
      byRepo,
    },
  };
}

// Fetch open PRs from multiple repositories
export async function fetchOpenPRsMultiRepo(
  token: string,
  owner: string,
  repos: string[]
): Promise<import('./types').GitHubOpenPRsDashboardData> {
  const openPRs: import('./types').OpenPR[] = [];
  const byRepo: Record<string, number> = {};

  // Fetch PRs from each repo in parallel
  await Promise.all(
    repos.map(async (repo) => {
      try {
        // Fetch open PRs
        const prs = await githubFetch<GitHubPullRequest[]>(
          `/repos/${owner}/${repo}/pulls?state=open&per_page=50&sort=updated&direction=desc`,
          token
        );

        // Transform and add to results
        prs.forEach(pr => {
          openPRs.push({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            author: pr.user.login,
            authorAvatar: pr.user.avatar_url,
            url: pr.html_url,
            repository: repo,
            createdAt: new Date(pr.created_at),
            updatedAt: new Date(pr.updated_at),
            createdAgo: formatDuration(pr.created_at),
            draft: pr.draft,
          });
        });

        byRepo[repo] = prs.length;
      } catch (error) {
        // Handle errors gracefully with specific messages
        if (error instanceof Error && error.message.includes('404')) {
          console.warn(`[GitHub] Repository not found: ${owner}/${repo} - Check GITHUB_REPOS configuration`);
        } else if (error instanceof Error && error.message.includes('403')) {
          console.error(`[GitHub] Permission denied for ${owner}/${repo} - Check GITHUB_TOKEN permissions`);
        } else {
          console.error(`[GitHub] Error fetching open PRs from ${owner}/${repo}:`, error instanceof Error ? error.message : error);
        }
        byRepo[repo] = 0;
      }
    })
  );

  // Sort all PRs by updated date (most recently updated first)
  openPRs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return {
    openPRs,
    summary: {
      totalOpen: openPRs.length,
      lastUpdated: new Date(),
      byRepo,
    },
  };
}

export { type GitHubData, type Commit, type PullRequest, type MergedPR, type GitHubMultiRepoDashboardData, type RepoInfo, type OpenPR, type GitHubOpenPRsDashboardData } from './types';

// ===== Code Writing Operations =====

interface GitHubFileContent {
  type: string;
  encoding: string;
  size: number;
  name: string;
  path: string;
  content: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string;
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: string;
  sha?: string;
  size?: number;
  url?: string;
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

/**
 * Get file content from a repository
 */
export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<{ content: string; sha: string; encoding: string }> {
  const endpoint = ref
    ? `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
    : `/repos/${owner}/${repo}/contents/${path}`;

  const file = await githubFetch<GitHubFileContent>(endpoint, token);

  if (file.type !== 'file') {
    throw new Error(`Path ${path} is not a file, it's a ${file.type}`);
  }

  // Decode base64 content
  const content = Buffer.from(file.content, 'base64').toString('utf-8');

  return {
    content,
    sha: file.sha,
    encoding: file.encoding,
  };
}

/**
 * List directory contents
 */
export async function listDirectory(
  token: string,
  owner: string,
  repo: string,
  path: string = '',
  ref?: string
): Promise<Array<{ name: string; path: string; type: 'file' | 'dir'; size?: number }>> {
  const endpoint = ref
    ? `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
    : `/repos/${owner}/${repo}/contents/${path}`;

  const contents = await githubFetch<GitHubFileContent[]>(endpoint, token);

  return contents.map(item => ({
    name: item.name,
    path: item.path,
    type: item.type as 'file' | 'dir',
    size: item.size,
  }));
}

/**
 * Create or update a file in the repository
 */
export async function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch?: string,
  existingSha?: string
): Promise<{ commit: { sha: string; html_url: string }; content: { sha: string } }> {
  // First, try to get existing file SHA if not provided
  let sha = existingSha;
  if (!sha) {
    try {
      const existing = await getFileContent(token, owner, repo, path, branch);
      sha = existing.sha;
    } catch {
      // File doesn't exist, which is fine for creation
    }
  }

  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content).toString('base64'),
  };

  if (branch) {
    body.branch = branch;
  }

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Delete a file from the repository
 */
export async function deleteFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  message: string,
  branch?: string
): Promise<{ commit: { sha: string; html_url: string } }> {
  // Get existing file SHA (required for deletion)
  const existing = await getFileContent(token, owner, repo, path, branch);

  const body: Record<string, unknown> = {
    message,
    sha: existing.sha,
  };

  if (branch) {
    body.branch = branch;
  }

  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Create a new branch from an existing ref
 */
export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  branchName: string,
  fromRef: string = 'main'
): Promise<{ ref: string; url: string }> {
  // Get the SHA of the source ref
  const sourceRef = await githubFetch<{ object: { sha: string } }>(
    `/repos/${owner}/${repo}/git/ref/heads/${fromRef}`,
    token
  );

  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: sourceRef.object.sha,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * List branches in a repository
 */
export async function listBranches(
  token: string,
  owner: string,
  repo: string
): Promise<Array<{ name: string; sha: string; protected: boolean }>> {
  const branches = await githubFetch<GitHubBranch[]>(
    `/repos/${owner}/${repo}/branches?per_page=100`,
    token
  );

  return branches.map(b => ({
    name: b.name,
    sha: b.commit.sha,
    protected: b.protected,
  }));
}

/**
 * Search for files in a repository
 */
export async function searchCode(
  token: string,
  owner: string,
  repo: string,
  query: string
): Promise<Array<{ path: string; sha: string; score: number; html_url: string }>> {
  const searchQuery = encodeURIComponent(`${query} repo:${owner}/${repo}`);

  const response = await fetch(`${GITHUB_API_URL}/search/code?q=${searchQuery}&per_page=30`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  return result.items.map((item: { path: string; sha: string; score: number; html_url: string }) => ({
    path: item.path,
    sha: item.sha,
    score: item.score,
    html_url: item.html_url,
  }));
}

/**
 * Get repository tree (all files)
 */
export async function getRepoTree(
  token: string,
  owner: string,
  repo: string,
  ref: string = 'main',
  recursive: boolean = true
): Promise<Array<{ path: string; type: 'blob' | 'tree'; sha: string; size?: number }>> {
  const endpoint = `/repos/${owner}/${repo}/git/trees/${ref}${recursive ? '?recursive=1' : ''}`;

  const response = await githubFetch<{ tree: GitHubTreeItem[]; truncated: boolean }>(endpoint, token);

  return response.tree.map(item => ({
    path: item.path,
    type: item.type as 'blob' | 'tree',
    sha: item.sha || '',
    size: item.size,
  }));
}

/**
 * Create a pull request
 */
export async function createPullRequest(
  token: string,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string,
  draft: boolean = false
): Promise<{ number: number; html_url: string; id: number }> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      head,
      base,
      body: body || '',
      draft,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
