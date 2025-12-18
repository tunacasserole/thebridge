# Jira Integration Guide

## Overview

TheBridge integrates with Jira through the **Jira REST API v3** using Basic Authentication. This provides reliable, serverless-compatible access to Jira functionality without complex OAuth setup.

## Why Not Use Atlassian MCP Server?

The Atlassian Remote MCP Server (`https://mcp.atlassian.com/v1/sse`) requires:
- Complex OAuth 2.0 flow with redirect handling
- Site admin authorization for app registration
- OAuth scope configuration in Atlassian Developer Console
- Token refresh management
- Not recommended for serverless environments

**Our Approach:** Use the proven Jira REST API v3 with API tokens for simpler, more reliable integration.

## Setup Instructions

### 1. Generate Jira API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Give it a descriptive name (e.g., "TheBridge Integration")
4. Copy the generated token immediately (you won't be able to see it again)

### 2. Configure Environment Variables

Add these to your `.env` or `.env.local` file:

```bash
# Jira Integration
JIRA_BASE_URL=https://your-org.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=ATATT3xFfGF0...  # Your API token from step 1
JIRA_PROJECT_KEY=PROJ  # Optional: default project key
```

**Required:**
- `JIRA_BASE_URL`: Your Atlassian Cloud instance URL
- `JIRA_EMAIL`: Email address associated with your Atlassian account
- `JIRA_API_TOKEN`: API token from step 1

**Optional:**
- `JIRA_PROJECT_KEY`: Default project for creating issues

### 3. Verify Configuration

The Jira client automatically validates credentials on first use. If authentication fails, you'll see:
```
Jira API error (401): Authentication failed
```

## Features

TheBridge's Jira integration provides:

### Dashboard Features
- **Epic Tracking**: View all epics with their stories
- **Story Management**: Track stories linked to epics
- **Task Overview**: See all tasks and subtasks
- **Bug Tracking**: Monitor bugs assigned to you
- **Status Summary**: Real-time counts by status (To Do, In Progress, Done)
- **Overdue Alerts**: Automatic highlighting of overdue items

### API Capabilities
- **Search Issues**: Advanced JQL queries with filters
- **Create Issues**: Create stories, tasks, bugs
- **Update Issues**: Modify summaries, descriptions, fields
- **Transition Issues**: Move issues through workflow states
- **Comment Management**: Add and view comments
- **Relationship Tracking**: Epic links, subtasks, parent issues

## Usage Examples

### Dashboard Panel

The Jira dashboard panel (`components/dashboard/JiraPanel.tsx`) automatically fetches and displays:
- Your assigned issues grouped by type
- Progress indicators
- Quick status overview

### API Endpoints

```typescript
// Search for issues
GET /api/jira/search?assignee=currentUser&status=In Progress

// Get specific issue
GET /api/jira/PROJ-123

// Create new story
POST /api/jira/issues
{
  "projectKey": "PROJ",
  "summary": "New feature request",
  "description": "Detailed description..."
}

// Add comment
POST /api/jira/PROJ-123/comments
{
  "comment": "Status update..."
}
```

## Architecture

### Client Library
**Location:** `lib/jira/client.ts`

**Key Functions:**
- `fetchJiraDashboardData()`: Get all dashboard data
- `searchJiraIssues()`: Execute JQL queries
- `createJiraStory()`: Create new issues
- `updateJiraIssueStatus()`: Transition workflow
- `addJiraComment()`: Add comments
- `getIssueTransitions()`: Get available transitions

### Authentication
Uses HTTP Basic Authentication:
```
Authorization: Basic base64(email:api_token)
```

### Error Handling
- 10-second timeout on all requests
- Automatic retry suggestions on timeout
- Detailed error messages with HTTP status codes
- Graceful degradation for missing fields

## Troubleshooting

### 401 Unauthorized Error

**Cause:** Invalid credentials or API token

**Solution:**
1. Verify `JIRA_EMAIL` matches your Atlassian account
2. Generate a new API token
3. Ensure no extra spaces in environment variables
4. Check that your Atlassian account has access to the Jira instance

### Connection Timeout

**Cause:** Network issues or Jira instance unavailable

**Solution:**
- Check your network connection
- Verify `JIRA_BASE_URL` is correct
- Try accessing Jira directly in browser
- Check Atlassian status page: https://status.atlassian.com/

### No Issues Returned

**Cause:** Incorrect project key or no assigned issues

**Solution:**
1. Verify `JIRA_PROJECT_KEY` is correct
2. Check that you have issues assigned in Jira
3. Try without project filter to see all your issues

### Rate Limiting

**Cause:** Too many API requests

**Solution:**
- Jira Cloud has rate limits (10,000 requests/hour per IP)
- TheBridge implements 10-second timeouts to prevent request spam
- Dashboard data is cached client-side with SWR

## Security Best Practices

1. **Never Commit API Tokens**: Keep `.env` in `.gitignore`
2. **Use Environment-Specific Tokens**: Different tokens for dev/staging/production
3. **Rotate Tokens Regularly**: Generate new tokens periodically
4. **Restrict Token Permissions**: Use least-privilege principle
5. **Monitor Token Usage**: Check Atlassian audit logs

## API Reference

### Jira REST API v3
- **Documentation**: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/
- **Authentication**: https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/
- **JQL Guide**: https://support.atlassian.com/jira-service-management-cloud/docs/use-advanced-search-with-jira-query-language-jql/

## Future Enhancements

Planned improvements:
- [ ] Epic link field auto-detection
- [ ] Custom field mapping
- [ ] Bulk operations
- [ ] Attachment support
- [ ] Advanced JQL builder UI
- [ ] Issue linking
- [ ] Sprint integration
- [ ] Time tracking

## Related Documentation

- **TheBridge MCP Settings**: `app/settings/mcp/README.md`
- **Jira Types**: `lib/jira/types.ts`
- **Dashboard Integration**: `components/dashboard/JiraPanel.tsx`
- **API Routes**: `app/api/jira/*`
