/**
 * MCP Hub Server
 *
 * A single server that bridges multiple stdio-based MCP servers to SSE/HTTP
 * for use in serverless environments like Vercel.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────┐
 * │                     MCP Hub Server                       │
 * │                   (Single Deployment)                    │
 * ├─────────────────────────────────────────────────────────┤
 * │  /sse/:server    →  SSE connection to MCP server        │
 * │  /rpc/:server    →  Direct JSON-RPC POST endpoint       │
 * │  /health         →  Health check for all servers         │
 * │  /servers        →  List available servers               │
 * └─────────────────────────────────────────────────────────┘
 */

import express from 'express';
import { config } from 'dotenv';
import { ProcessManager } from './process-manager.js';
import { SSEHandler } from './sse-handler.js';
import { MCP_SERVERS, getServerConfig, getAllServerSlugs } from './servers.js';
import type { MCPRequest } from './types.js';

// Load environment variables
config();

const app = express();
app.use(express.json());

// Initialize managers
const processManager = new ProcessManager({
  requestTimeout: 30000,
  maxIdleTime: 300000, // 5 minutes
});

const sseHandler = new SSEHandler(processManager);

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const processHealth = processManager.getHealth();
  const connectionCount = sseHandler.getConnectionCount();

  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    connections: connectionCount,
    processes: processHealth,
    availableServers: getAllServerSlugs(),
  });
});

// List available servers
app.get('/servers', (req, res) => {
  const servers = MCP_SERVERS.map((s) => ({
    slug: s.slug,
    name: s.name,
    requiredEnv: Object.keys(s.env),
  }));

  res.json({ servers });
});

// SSE endpoint for specific server
app.get('/sse/:server', async (req, res) => {
  const { server } = req.params;
  await sseHandler.handleConnection(req, res, server);
});

// JSON-RPC endpoint for direct requests (alternative to SSE)
app.post('/rpc/:server', async (req, res) => {
  const { server } = req.params;
  const config = getServerConfig(server);

  if (!config) {
    res.status(404).json({ error: `Unknown server: ${server}` });
    return;
  }

  const request = req.body as MCPRequest;

  if (!request.jsonrpc || request.jsonrpc !== '2.0' || !request.method) {
    res.status(400).json({ error: 'Invalid JSON-RPC request' });
    return;
  }

  try {
    let response;

    if (request.method === 'tools/list') {
      response = await processManager.listTools(server, config);
    } else if (request.method === 'tools/call') {
      const params = request.params as { name: string; arguments: Record<string, unknown> };
      response = await processManager.callTool(server, config, params.name, params.arguments);
    } else {
      response = {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32601, message: `Method not supported: ${request.method}` },
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
      },
    });
  }
});

// Batch endpoint for multiple requests
app.post('/rpc/:server/batch', async (req, res) => {
  const { server } = req.params;
  const config = getServerConfig(server);

  if (!config) {
    res.status(404).json({ error: `Unknown server: ${server}` });
    return;
  }

  const requests = req.body as MCPRequest[];

  if (!Array.isArray(requests)) {
    res.status(400).json({ error: 'Expected array of JSON-RPC requests' });
    return;
  }

  const responses = await Promise.all(
    requests.map(async (request) => {
      try {
        if (request.method === 'tools/list') {
          return await processManager.listTools(server, config);
        } else if (request.method === 'tools/call') {
          const params = request.params as { name: string; arguments: Record<string, unknown> };
          return await processManager.callTool(server, config, params.name, params.arguments);
        }
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32601, message: `Method not supported: ${request.method}` },
        };
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error',
          },
        };
      }
    })
  );

  res.json(responses);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[Server] Shutting down...');
  sseHandler.shutdown();
  await processManager.shutdown();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    MCP Hub Server                          ║
╠════════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: ${PORT.toString().padEnd(52)}║
║  Servers: ${MCP_SERVERS.length.toString().padEnd(49)}║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    GET  /health        - Health check                      ║
║    GET  /servers       - List available servers            ║
║    GET  /sse/:server   - SSE connection                    ║
║    POST /rpc/:server   - JSON-RPC endpoint                 ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export { app };
