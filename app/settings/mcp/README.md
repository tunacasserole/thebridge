# MCP Server Management UI

A user interface for managing Model Context Protocol (MCP) server connections in TheBridge.

## Overview

This feature provides a complete UI for users to:
- View all available MCP servers (official and community)
- Enable/disable individual servers
- Configure server credentials (API keys, tokens, URLs)
- Test server connections
- Manage server priorities

## Architecture

### Components

**Page**: `/app/settings/mcp/page.tsx`
- Main settings page
- Fetches available servers and user configurations
- Groups servers by official/community
- Handles configuration updates and deletions

**MCPServerCard**: `/components/mcp/MCPServerCard.tsx`
- Individual server card with toggle, status, and actions
- Expandable configuration form
- Connection status indicator
- Documentation link

**MCPConfigForm**: `/components/mcp/MCPConfigForm.tsx`
- Dynamic form generation based on server's `configTemplate`
- Supports env variables, URLs, and headers
- Secret field masking for API keys/tokens
- Validation and error handling

**MCPTestButton**: `/components/mcp/MCPTestButton.tsx`
- Tests server connection
- Updates connection status (idle/testing/connected/failed)
- Shows error messages on failure

### API Endpoints

**GET /api/mcp/servers**
- Returns all available MCP server definitions
- Filters by `isEnabled: true`
- Ordered by official status, then name

**GET /api/mcp/user-configs**
- Returns current user's MCP configurations
- Includes full server details
- Ordered by priority, then creation date

**POST /api/mcp/user-configs**
- Creates or updates user's server configuration
- Body: `{ serverId, config, isEnabled, priority }`
- Returns updated configuration with server details

**DELETE /api/mcp/user-configs?serverId=xxx**
- Removes user's configuration for a server
- Query param: `serverId`

**POST /api/mcp/test-connection**
- Tests connection to a configured MCP server
- Body: `{ serverId }`
- Returns: `{ success, message?, error?, toolCount? }`
- Creates temporary connection, lists tools, then closes

## Database Schema

### MCPServerDefinition
```prisma
model MCPServerDefinition {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  icon        String?   // Material Symbols icon name

  transportType String  @default("sse") // "sse" | "http" | "stdio"
  configTemplate String @db.Text       // JSON configuration

  docsUrl     String?
  isOfficial  Boolean  @default(false)
  isEnabled   Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userConfigs UserMCPConfig[]
}
```

### UserMCPConfig
```prisma
model UserMCPConfig {
  id        String   @id @default(cuid())
  userId    String
  serverId  String

  config    String   @db.Text  // JSON user configuration
  isEnabled Boolean  @default(true)
  priority  Int      @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  server    MCPServerDefinition @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@unique([userId, serverId])
}
```

## Configuration Template Format

The `configTemplate` field in `MCPServerDefinition` defines what configuration is needed:

```typescript
interface ConfigTemplate {
  // For command-based servers
  command?: string;           // e.g., "npx"
  args?: string[];           // e.g., ["-y", "mcp-remote", "https://..."]

  // Environment variables (required fields)
  env?: Record<string, string>;  // e.g., { "API_KEY": "", "REGION": "us1" }

  // For HTTP/SSE servers
  type?: "sse" | "http" | "stdio";
  url?: string;                  // Server URL (can use ${ENV_VAR} placeholders)
  headers?: Record<string, string>;  // e.g., { "Api-Key": "${API_KEY}" }
}
```

User configuration merges with this template:
- `env` values override template defaults
- `url` can be customized
- `headers` can be added/overridden

## Seeding MCP Servers

To populate the database with MCP server definitions:

```bash
npx tsx prisma/seed-mcp.ts
```

This seeds 20+ servers including:
- **Official**: Coralogix, New Relic, Rootly, Jira, Confluence, GitHub, Slack, Cloudflare, Figma, Chrome DevTools
- **Community**: Metabase, Kubernetes, Prometheus, Snowflake, Airbyte, Argo CD, Grafana, Sidekiq, Zoom, Shell

### Important Notes

#### Jira Integration
**Note:** Jira integration in TheBridge uses the built-in REST API client (`lib/jira/client.ts`), not the Atlassian MCP Server.

The Atlassian Remote MCP Server requires complex OAuth setup and is not recommended for serverless environments like Vercel. Instead, configure Jira via environment variables:

```bash
JIRA_BASE_URL=https://your-org.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=ATATT...
JIRA_PROJECT_KEY=PROJ
```

To get your Jira API token:
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the token and add it to your `.env` file

The built-in Jira client provides:
- Dashboard with epics, stories, tasks, and bugs
- Issue search and filtering
- Status updates and transitions
- Comment management
- Create new issues

#### Confluence Integration
**Note:** Confluence also has the same OAuth requirements as Jira when using the Atlassian MCP Server. For production use, consider using the Confluence REST API similar to the Jira implementation.

## Usage Flow

1. User navigates to Settings → MCP Servers (from user menu)
2. User sees all available servers grouped by official/community
3. User clicks toggle to enable a server
   - If no config exists, card expands to show configuration form
   - If config exists, server is enabled immediately
4. User fills in required fields (API keys, URLs, etc.)
5. User saves configuration
6. User clicks "Test Connection" to verify setup
7. Connection status updates based on test result

## Security Considerations

- Secret fields (API keys, tokens, passwords) are masked by default
- Show/hide toggle for viewing secrets
- API keys should be stored encrypted (not yet implemented - future enhancement)
- Server configs are user-specific (isolated by userId)
- stdio transport is disabled in serverless environment for security

## Future Enhancements

- [ ] Encrypt API keys/tokens in database
- [ ] Add server health monitoring
- [ ] Show available tools per server
- [ ] Add server usage statistics
- [ ] Support custom server definitions (user-created)
- [ ] Import/export configurations
- [ ] Server connection pooling/caching
