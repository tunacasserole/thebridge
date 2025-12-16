# MCP Hub Server

A single server that bridges multiple stdio-based MCP servers to SSE/HTTP for use in serverless environments like Vercel.

## Why?

Many MCP servers (GitHub, Kubernetes, Grafana, etc.) use the `stdio` transport, which requires spawning a child process. This doesn't work in serverless environments like Vercel where:
- Functions are stateless and short-lived
- Child processes can't persist between requests
- Cold starts would be too slow for spawning processes

The MCP Hub solves this by:
1. Running as a **single persistent server** (on Fly.io, Railway, a VM, etc.)
2. Managing all stdio MCP processes internally
3. Exposing them via **SSE** or **HTTP** endpoints that work with serverless

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TheBridge (Vercel)                     │
│                                                             │
│   lib/mcp/client.ts → HTTP/SSE → MCP Hub                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Hub Server (Fly.io)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   GET  /sse/kubernetes   ←──┐                               │
│   GET  /sse/github       ←──┤  SSE Connections              │
│   GET  /sse/grafana      ←──┘                               │
│                                                             │
│   POST /rpc/kubernetes   ←──┐                               │
│   POST /rpc/github       ←──┤  Direct JSON-RPC              │
│   POST /rpc/grafana      ←──┘                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Process Manager                          │
│                                                             │
│   [kubernetes]  ←── stdio ──→  mcp-server-kubernetes        │
│   [github]      ←── stdio ──→  server-github                │
│   [grafana]     ←── stdio ──→  mcp-grafana                  │
│   [metabase]    ←── stdio ──→  metabase-mcp-server          │
│   [slack]       ←── stdio ──→  mcp-server-slack             │
│   ... (14 total stdio servers)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Supported MCP Servers

| Server | Package | Required Env Vars |
|--------|---------|-------------------|
| GitHub | `@modelcontextprotocol/server-github` | `GITHUB_PERSONAL_ACCESS_TOKEN` |
| Slack | `@anthropic/mcp-server-slack` | `SLACK_BOT_TOKEN`, `SLACK_TEAM_ID` |
| Metabase | `@cognitionai/metabase-mcp-server` | `METABASE_URL`, `METABASE_API_KEY` |
| Kubernetes | `mcp-server-kubernetes` | `KUBECONFIG` |
| Prometheus | `prometheus-mcp-server` (uvx) | `PROMETHEUS_URL` |
| Gmail | `@gongrzhe/server-gmail-autoauth-mcp` | OAuth credentials |
| Google Calendar | `@nspady/google-calendar-mcp` | OAuth credentials |
| Snowflake | `mcp-snowflake-server` (uvx) | Connection details |
| Airbyte | `airbyte-mcp` (uvx) | `AIRBYTE_API_KEY` |
| Argo CD | `argocd-mcp` | `ARGOCD_SERVER`, `ARGOCD_AUTH_TOKEN` |
| Grafana | `@grafana/mcp-grafana` | `GRAFANA_URL`, `GRAFANA_API_KEY` |
| Figma | `@anthropic-ai/figma-mcp-server` | `FIGMA_PERSONAL_ACCESS_TOKEN` |
| Zoom | `@anthropic-ai/zoom-mcp-server` | OAuth credentials |
| Chrome DevTools | `chrome-devtools-mcp` | None |
| Shell | `mcp-shell-server` | `MCP_SHELL_SECURITY_MODE` |

## Quick Start

### Local Development

```bash
cd packages/mcp-hub

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your credentials

# Start in development mode
npm run dev
```

### Test a Server

```bash
# List available servers
npx tsx src/cli.ts list

# Test a specific server (e.g., kubernetes)
KUBECONFIG=~/.kube/config npx tsx src/cli.ts test kubernetes
```

## API Endpoints

### `GET /health`
Health check returning server status and active processes.

### `GET /servers`
List all available MCP servers and their required environment variables.

### `GET /sse/:server`
Open an SSE connection to a specific MCP server.

Example:
```javascript
const eventSource = new EventSource('https://mcp-hub.fly.dev/sse/kubernetes');
eventSource.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

### `POST /rpc/:server`
Send a JSON-RPC request directly.

Example:
```bash
curl -X POST https://mcp-hub.fly.dev/rpc/kubernetes \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Deployment

### Fly.io (Recommended)

```bash
cd packages/mcp-hub

# First time setup
fly launch --config fly.toml

# Set secrets
fly secrets set GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx
fly secrets set KUBECONFIG="$(cat ~/.kube/config | base64)"
# ... set other secrets as needed

# Deploy
fly deploy
```

### Docker

```bash
cd packages/mcp-hub
docker build -t mcp-hub .
docker run -p 3001:3001 --env-file .env mcp-hub
```

## Updating TheBridge

After deploying the hub, update your MCP seed to use the hub URL:

```typescript
// In prisma/seed-mcp.ts, change stdio servers to use the hub:
{
  slug: 'kubernetes',
  transportType: 'http',  // Changed from 'stdio'
  configTemplate: {
    type: 'http',
    url: 'https://your-mcp-hub.fly.dev/rpc/kubernetes',
  },
}
```

## Process Management

The hub automatically:
- **Spawns processes on-demand** when first requested
- **Keeps processes alive** for 5 minutes of inactivity
- **Cleans up idle processes** to save resources
- **Reconnects** if a process crashes
- **Health checks** all running processes

## Security Considerations

1. **Authentication**: Add authentication headers to protect your hub
2. **CORS**: Configure `CORS_ORIGIN` to restrict access
3. **Shell MCP**: Runs in restrictive mode by default
4. **Secrets**: Use Fly.io secrets or similar for credentials
