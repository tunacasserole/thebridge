/**
 * Tool Executor
 *
 * Executes tools called by Claude using the existing API clients.
 */

import { fetchRootlyDashboardData, updateIncidentStatus, postIncidentComment } from '@/lib/rootly/client';
import {
  fetchOpenPRsMultiRepo,
  fetchMergedPRsMultiRepo,
  getFileContent,
  createOrUpdateFile,
  deleteFile,
  listDirectory,
  createBranch,
  listBranches,
  searchCode,
  getRepoTree,
  createPullRequest,
} from '@/lib/github/client';
import { searchJiraIssues, addJiraComment, createJiraStory, safeJiraFetch } from '@/lib/jira/client';
import {
  listDatabases,
  executeQuery,
  searchQuestions,
  runQuestion,
  formatQueryResults,
} from '@/lib/integrations/metabase';

// Environment variables
const getEnv = () => ({
  ROOTLY_API_KEY: process.env.ROOTLY_API_KEY || '',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GITHUB_OWNER: process.env.GITHUB_OWNER || '',
  GITHUB_REPOS: (process.env.GITHUB_REPOS || '').split(',').filter(Boolean),
  JIRA_BASE_URL: process.env.ATLASSIAN_DOMAIN ? `https://${process.env.ATLASSIAN_DOMAIN}` : '',
  JIRA_EMAIL: process.env.ATLASSIAN_EMAIL || '',
  JIRA_API_TOKEN: process.env.ATLASSIAN_API_TOKEN || '',
  NEW_RELIC_API_KEY: process.env.NEW_RELIC_API_KEY || '',
  NEW_RELIC_ACCOUNT_ID: process.env.NEW_RELIC_ACCOUNT_ID || '',
});

/**
 * Tool result type
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Execute a tool by name with the given input
 */
export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  const env = getEnv();

  try {
    switch (toolName) {
      // ===== ROOTLY TOOLS =====
      case 'rootly_get_incidents': {
        if (!env.ROOTLY_API_KEY) {
          return { success: false, error: 'Rootly is not configured. Set ROOTLY_API_KEY.' };
        }
        const data = await fetchRootlyDashboardData(env.ROOTLY_API_KEY);

        // Filter if only active requested
        const includeResolved = input.include_resolved as boolean;
        if (!includeResolved) {
          return {
            success: true,
            data: {
              activeIncidents: data.activeIncidents,
              activeAlerts: data.activeAlerts,
              summary: data.summary,
              timeBasedMetrics: data.timeBasedMetrics,
            },
          };
        }
        return { success: true, data };
      }

      case 'rootly_update_incident': {
        if (!env.ROOTLY_API_KEY) {
          return { success: false, error: 'Rootly is not configured. Set ROOTLY_API_KEY.' };
        }
        const incidentId = input.incident_id as string;
        const status = input.status as 'in_triage' | 'started' | 'mitigated' | 'resolved' | 'cancelled';
        await updateIncidentStatus(env.ROOTLY_API_KEY, incidentId, status);
        return { success: true, data: { message: `Incident ${incidentId} updated to ${status}` } };
      }

      case 'rootly_post_comment': {
        if (!env.ROOTLY_API_KEY) {
          return { success: false, error: 'Rootly is not configured. Set ROOTLY_API_KEY.' };
        }
        const incidentId = input.incident_id as string;
        const comment = input.comment as string;
        await postIncidentComment(env.ROOTLY_API_KEY, incidentId, comment);
        return { success: true, data: { message: `Comment added to incident ${incidentId}` } };
      }

      // ===== GITHUB TOOLS =====
      case 'github_get_prs': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const type = (input.type as string) || 'all';
        const specificRepo = input.repository as string | undefined;

        const repos = specificRepo ? [specificRepo] : env.GITHUB_REPOS;

        if (repos.length === 0) {
          return { success: false, error: 'No GitHub repositories configured. Set GITHUB_REPOS.' };
        }

        if (type === 'open') {
          const data = await fetchOpenPRsMultiRepo(env.GITHUB_TOKEN, env.GITHUB_OWNER, repos);
          return { success: true, data };
        } else if (type === 'merged') {
          const data = await fetchMergedPRsMultiRepo(env.GITHUB_TOKEN, env.GITHUB_OWNER, repos);
          return { success: true, data };
        } else {
          // Fetch both
          const [open, merged] = await Promise.all([
            fetchOpenPRsMultiRepo(env.GITHUB_TOKEN, env.GITHUB_OWNER, repos),
            fetchMergedPRsMultiRepo(env.GITHUB_TOKEN, env.GITHUB_OWNER, repos),
          ]);
          return {
            success: true,
            data: {
              openPRs: open.openPRs,
              mergedPRs: merged.mergedPRs,
              summary: {
                totalOpen: open.summary.totalOpen,
                totalMerged: merged.summary.totalMerged,
              },
            },
          };
        }
      }

      // ===== GITHUB CODE TOOLS =====
      case 'github_read_file': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const repo = input.repository as string;
        const path = input.path as string;
        const branch = input.branch as string | undefined;

        const result = await getFileContent(env.GITHUB_TOKEN, env.GITHUB_OWNER, repo, path, branch);
        return {
          success: true,
          data: {
            path,
            content: result.content,
            sha: result.sha,
            encoding: result.encoding,
          },
        };
      }

      case 'github_write_file': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const repo = input.repository as string;
        const path = input.path as string;
        const content = input.content as string;
        const message = input.message as string;
        const branch = input.branch as string | undefined;

        const result = await createOrUpdateFile(
          env.GITHUB_TOKEN,
          env.GITHUB_OWNER,
          repo,
          path,
          content,
          message,
          branch
        );
        return {
          success: true,
          data: {
            message: `File ${path} has been created/updated`,
            commit: {
              sha: result.commit.sha,
              url: result.commit.html_url,
            },
            file: {
              sha: result.content.sha,
            },
          },
        };
      }

      case 'github_delete_file': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const repo = input.repository as string;
        const path = input.path as string;
        const message = input.message as string;
        const branch = input.branch as string | undefined;

        const result = await deleteFile(env.GITHUB_TOKEN, env.GITHUB_OWNER, repo, path, message, branch);
        return {
          success: true,
          data: {
            message: `File ${path} has been deleted`,
            commit: {
              sha: result.commit.sha,
              url: result.commit.html_url,
            },
          },
        };
      }

      case 'github_list_directory': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const repo = input.repository as string;
        const path = (input.path as string) || '';
        const branch = input.branch as string | undefined;

        const contents = await listDirectory(env.GITHUB_TOKEN, env.GITHUB_OWNER, repo, path, branch);
        return {
          success: true,
          data: {
            path: path || '/',
            contents,
            count: {
              files: contents.filter(c => c.type === 'file').length,
              directories: contents.filter(c => c.type === 'dir').length,
            },
          },
        };
      }

      case 'github_create_branch': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const repo = input.repository as string;
        const branchName = input.branch_name as string;
        const fromBranch = (input.from_branch as string) || 'main';

        const result = await createBranch(env.GITHUB_TOKEN, env.GITHUB_OWNER, repo, branchName, fromBranch);
        return {
          success: true,
          data: {
            message: `Branch '${branchName}' created from '${fromBranch}'`,
            ref: result.ref,
            url: result.url,
          },
        };
      }

      case 'github_list_branches': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const repo = input.repository as string;

        const branches = await listBranches(env.GITHUB_TOKEN, env.GITHUB_OWNER, repo);
        return {
          success: true,
          data: {
            branches,
            count: branches.length,
          },
        };
      }

      case 'github_search_code': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const repo = input.repository as string;
        const query = input.query as string;

        const results = await searchCode(env.GITHUB_TOKEN, env.GITHUB_OWNER, repo, query);
        return {
          success: true,
          data: {
            query,
            results,
            count: results.length,
          },
        };
      }

      case 'github_get_tree': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const repo = input.repository as string;
        const branch = (input.branch as string) || 'main';

        const tree = await getRepoTree(env.GITHUB_TOKEN, env.GITHUB_OWNER, repo, branch);
        return {
          success: true,
          data: {
            branch,
            tree: tree.filter(item => item.type === 'blob'), // Only return files, not directories
            count: {
              files: tree.filter(item => item.type === 'blob').length,
              directories: tree.filter(item => item.type === 'tree').length,
            },
          },
        };
      }

      case 'github_create_pr': {
        if (!env.GITHUB_TOKEN) {
          return { success: false, error: 'GitHub is not configured. Set GITHUB_TOKEN.' };
        }
        const repo = input.repository as string;
        const title = input.title as string;
        const head = input.head as string;
        const base = input.base as string;
        const body = input.body as string | undefined;
        const draft = (input.draft as boolean) || false;

        const result = await createPullRequest(
          env.GITHUB_TOKEN,
          env.GITHUB_OWNER,
          repo,
          title,
          head,
          base,
          body,
          draft
        );
        return {
          success: true,
          data: {
            message: `Pull request #${result.number} created`,
            number: result.number,
            url: result.html_url,
            id: result.id,
          },
        };
      }

      // ===== JIRA TOOLS =====
      case 'jira_search_issues': {
        if (!env.JIRA_BASE_URL || !env.JIRA_EMAIL || !env.JIRA_API_TOKEN) {
          return { success: false, error: 'Jira is not configured. Set ATLASSIAN_DOMAIN, ATLASSIAN_EMAIL, and ATLASSIAN_API_TOKEN.' };
        }
        const filters = {
          assignee: input.assignee as string | undefined,
          status: input.status as string | undefined,
          project: input.project as string | undefined,
          issueType: input.issue_type as string | undefined,
          jql: input.jql as string | undefined,
          maxResults: input.max_results as number | undefined,
        };
        const data = await searchJiraIssues(env.JIRA_BASE_URL, env.JIRA_EMAIL, env.JIRA_API_TOKEN, filters);
        return { success: true, data };
      }

      case 'jira_get_issue': {
        if (!env.JIRA_BASE_URL || !env.JIRA_EMAIL || !env.JIRA_API_TOKEN) {
          return { success: false, error: 'Jira is not configured.' };
        }
        const issueKey = input.issue_key as string;
        const issue = await safeJiraFetch(
          env.JIRA_BASE_URL,
          `/issue/${issueKey}`,
          env.JIRA_EMAIL,
          env.JIRA_API_TOKEN,
          { fields: 'summary,description,status,issuetype,priority,assignee,created,updated,duedate,parent,subtasks,labels,project,comment' }
        );
        return { success: true, data: issue };
      }

      case 'jira_add_comment': {
        if (!env.JIRA_BASE_URL || !env.JIRA_EMAIL || !env.JIRA_API_TOKEN) {
          return { success: false, error: 'Jira is not configured.' };
        }
        const issueKey = input.issue_key as string;
        const comment = input.comment as string;
        const result = await addJiraComment(env.JIRA_BASE_URL, env.JIRA_EMAIL, env.JIRA_API_TOKEN, issueKey, comment);
        return { success: true, data: { message: `Comment added to ${issueKey}`, id: result.id } };
      }

      case 'jira_create_story': {
        if (!env.JIRA_BASE_URL || !env.JIRA_EMAIL || !env.JIRA_API_TOKEN) {
          return { success: false, error: 'Jira is not configured.' };
        }
        const projectKey = input.project_key as string;
        const summary = input.summary as string;
        const description = input.description as string | undefined;
        const issue = await createJiraStory(env.JIRA_BASE_URL, env.JIRA_EMAIL, env.JIRA_API_TOKEN, projectKey, summary, description);
        return { success: true, data: { message: `Story created: ${issue.key}`, issue } };
      }

      // ===== NEW RELIC TOOLS =====
      case 'newrelic_get_applications': {
        if (!env.NEW_RELIC_API_KEY || !env.NEW_RELIC_ACCOUNT_ID) {
          return { success: false, error: 'New Relic is not configured. Set NEW_RELIC_API_KEY and NEW_RELIC_ACCOUNT_ID.' };
        }

        const query = `
          {
            actor {
              entitySearch(query: "domain = 'APM' AND type = 'APPLICATION'") {
                results {
                  entities {
                    guid
                    name
                    alertSeverity
                    reporting
                    ... on ApmApplicationEntityOutline {
                      language
                      settings {
                        apdexTarget
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch('https://api.newrelic.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'API-Key': env.NEW_RELIC_API_KEY,
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error(`New Relic API error: ${response.status}`);
        }

        const result = await response.json();
        const entities = result.data?.actor?.entitySearch?.results?.entities || [];

        const applications = entities.map((entity: Record<string, unknown>, index: number) => ({
          id: index + 1,
          name: entity.name,
          health_status: mapAlertSeverity(entity.alertSeverity as string | null),
          reporting: entity.reporting ?? true,
          language: entity.language || 'Unknown',
        }));

        const summary = {
          healthy: applications.filter((app: { health_status: string }) => app.health_status === 'green').length,
          warning: applications.filter((app: { health_status: string }) => app.health_status === 'yellow').length,
          critical: applications.filter((app: { health_status: string }) => app.health_status === 'red').length,
          notReporting: applications.filter((app: { health_status: string; reporting: boolean }) => !app.reporting || app.health_status === 'gray').length,
        };

        return { success: true, data: { applications, summary } };
      }

      // ===== METABASE TOOLS =====
      case 'metabase_list_databases': {
        const databases = await listDatabases();
        return { success: true, data: { databases } };
      }

      case 'metabase_execute_query': {
        const databaseId = input.database_id as number;
        const sql = input.sql as string;
        const result = await executeQuery(databaseId, sql);
        const formatted = formatQueryResults(result);
        return {
          success: true,
          data: {
            rowCount: result.row_count,
            columns: result.data.cols.map((c) => c.display_name || c.name),
            formatted,
            raw: result.data.rows.slice(0, 100), // Limit raw data
          },
        };
      }

      case 'metabase_search_questions': {
        const query = input.query as string;
        const questions = await searchQuestions(query);
        return { success: true, data: { questions } };
      }

      case 'metabase_run_question': {
        const questionId = input.question_id as number;
        const result = await runQuestion(questionId);
        const formatted = formatQueryResults(result);
        return {
          success: true,
          data: {
            rowCount: result.row_count,
            columns: result.data.cols.map((c) => c.display_name || c.name),
            formatted,
            raw: result.data.rows.slice(0, 100),
          },
        };
      }

      // ===== WEB TOOLS =====
      case 'web_search': {
        // For now, return a message that web search needs external service
        // In production, integrate with Brave Search, Serper, or similar
        const query = input.query as string;
        return {
          success: false,
          error: `Web search is not yet configured. Query was: "${query}". Consider integrating Brave Search or Serper API.`,
        };
      }

      case 'http_request': {
        const url = input.url as string;
        const method = (input.method as string) || 'GET';
        const headers = (input.headers as Record<string, string>) || {};
        const body = input.body as string | undefined;

        // Basic URL validation
        try {
          new URL(url);
        } catch {
          return { success: false, error: `Invalid URL: ${url}` };
        }

        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        };

        if (body && (method === 'POST' || method === 'PUT')) {
          fetchOptions.body = body;
        }

        const response = await fetch(url, fetchOptions);
        const contentType = response.headers.get('content-type');
        let data: unknown;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = text.slice(0, 10000); // Limit response size
        }

        return {
          success: response.ok,
          data: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data,
          },
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`[Tool Error] ${toolName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Helper function
function mapAlertSeverity(severity: string | null): 'green' | 'yellow' | 'red' | 'gray' {
  if (!severity) return 'gray';
  switch (severity.toUpperCase()) {
    case 'NOT_ALERTING':
      return 'green';
    case 'WARNING':
      return 'yellow';
    case 'CRITICAL':
      return 'red';
    case 'NOT_CONFIGURED':
    default:
      return 'gray';
  }
}
