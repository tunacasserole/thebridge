import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'http';
import type { BridgeConfig, BridgeRequest, BridgeResponse, ToolName, ToolParams } from './types.js';
import { validateOrigin, validateToken } from './security.js';
import * as tools from './tools.js';

/**
 * Handle HTTP requests (non-WebSocket) with a helpful message
 */
function handleHttpRequest(req: IncomingMessage, res: ServerResponse, config: BridgeConfig): void {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', type: 'thebridge-local' }));
    return;
  }

  // For any other HTTP request, return a helpful message
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>TheBridge Local Server</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    h1 { color: #333; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
    .success { color: #22c55e; }
    a { color: #3b82f6; }
  </style>
</head>
<body>
  <h1>TheBridge Local Server <span class="success">✓ Running</span></h1>
  <p>This is a WebSocket server for TheBridge. It's not meant to be accessed directly in a browser.</p>
  <p><strong>To use TheBridge:</strong></p>
  <ol>
    <li>Keep this server running</li>
    <li>Open <a href="http://localhost:3000/code">http://localhost:3000/code</a> in your browser</li>
    <li>The web app will connect to this server automatically</li>
  </ol>
  <p><strong>Status:</strong> Ready for connections on port ${config.port}</p>
  <p><strong>Allowed directories:</strong></p>
  <ul>
    ${config.allowedDirectories.map(d => `<li><code>${d}</code></li>`).join('')}
  </ul>
</body>
</html>
  `);
}

/**
 * Create and start the bridge WebSocket server with HTTP fallback
 */
export function createServer(config: BridgeConfig): WebSocketServer {
  // Create HTTP server to handle both HTTP and WebSocket
  const httpServer = createHttpServer((req, res) => {
    handleHttpRequest(req, res, config);
  });

  // Create WebSocket server attached to HTTP server
  const wss = new WebSocketServer({
    server: httpServer,
    verifyClient: (info, callback) => {
      const origin = info.origin || info.req.headers.origin;

      if (!validateOrigin(origin, config)) {
        console.warn(`Rejected connection from origin: ${origin}`);
        callback(false, 403, 'Forbidden origin');
        return;
      }

      // Check token if required
      if (config.requireToken) {
        const url = new URL(info.req.url || '/', `http://localhost:${config.port}`);
        const token = url.searchParams.get('token');

        if (!validateToken(token || undefined, config)) {
          console.warn('Rejected connection: invalid token');
          callback(false, 401, 'Invalid token');
          return;
        }
      }

      callback(true);
    },
  });

  // Start the HTTP server (which also handles WebSocket upgrades)
  httpServer.listen(config.port);

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const origin = req.headers.origin || 'unknown';
    console.log(`Client connected from: ${origin}`);

    // Send welcome message with available tools
    ws.send(
      JSON.stringify({
        type: 'connected',
        tools: [
          'read_file',
          'write_file',
          'list_directory',
          'create_directory',
          'delete_file',
          'run_command',
          'claude_code',
          'git_status',
          'git_diff',
          'search_files',
        ],
      })
    );

    ws.on('message', async (data) => {
      let request: BridgeRequest;

      try {
        request = JSON.parse(data.toString()) as BridgeRequest;
      } catch {
        ws.send(
          JSON.stringify({
            id: 'unknown',
            success: false,
            error: 'Invalid JSON',
          })
        );
        return;
      }

      const response = await handleRequest(request, config, ws);
      ws.send(JSON.stringify(response));
    });

    ws.on('close', () => {
      console.log(`Client disconnected from: ${origin}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  wss.on('error', (error) => {
    console.error('Server error:', error);
  });

  return wss;
}

/**
 * Handle an incoming request
 */
async function handleRequest(
  request: BridgeRequest,
  config: BridgeConfig,
  ws: WebSocket
): Promise<BridgeResponse> {
  const { id, tool, params } = request;

  try {
    let result: unknown;

    switch (tool as ToolName) {
      case 'read_file':
        result = await tools.readFile(params as ToolParams['read_file'], config);
        break;

      case 'write_file':
        result = await tools.writeFile(params as ToolParams['write_file'], config);
        break;

      case 'list_directory':
        result = await tools.listDirectory(params as ToolParams['list_directory'], config);
        break;

      case 'create_directory':
        result = await tools.createDirectory(params as ToolParams['create_directory'], config);
        break;

      case 'delete_file':
        result = await tools.deleteFile(params as ToolParams['delete_file'], config);
        break;

      case 'run_command':
        result = await tools.runCommand(params as ToolParams['run_command'], config);
        break;

      case 'claude_code':
        result = await tools.runClaudeCode(
          params as ToolParams['claude_code'],
          config,
          (chunk) => {
            // Stream output to client
            ws.send(
              JSON.stringify({
                id,
                type: 'stream',
                chunk,
              })
            );
          }
        );
        break;

      case 'git_status':
        result = await tools.gitStatus(params as ToolParams['git_status'], config);
        break;

      case 'git_diff':
        result = await tools.gitDiff(params as ToolParams['git_diff'], config);
        break;

      case 'search_files':
        result = await tools.searchFiles(params as ToolParams['search_files'], config);
        break;

      default:
        throw new Error(`Unknown tool: ${tool}`);
    }

    return { id, success: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Tool ${tool} failed:`, message);
    return { id, success: false, error: message };
  }
}

