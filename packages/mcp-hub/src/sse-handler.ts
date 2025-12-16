/**
 * SSE Handler
 *
 * Handles Server-Sent Events connections and message streaming
 */

import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import type { ProcessManager } from './process-manager.js';
import { getServerConfig } from './servers.js';
import type { MCPRequest } from './types.js';

interface SSEConnection {
  id: string;
  serverSlug: string;
  response: Response;
  lastPing: Date;
}

export class SSEHandler {
  private connections: Map<string, SSEConnection> = new Map();
  private processManager: ProcessManager;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(processManager: ProcessManager) {
    this.processManager = processManager;

    // Start ping interval to keep connections alive
    this.pingInterval = setInterval(() => this.pingConnections(), 30000);
  }

  /**
   * Handle new SSE connection
   */
  async handleConnection(req: Request, res: Response, serverSlug: string): Promise<void> {
    const config = getServerConfig(serverSlug);

    if (!config) {
      res.status(404).json({ error: `Unknown server: ${serverSlug}` });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    const connectionId = uuid();
    const connection: SSEConnection = {
      id: connectionId,
      serverSlug,
      response: res,
      lastPing: new Date(),
    };

    this.connections.set(connectionId, connection);

    // Send connection established event
    this.sendEvent(connection, 'connected', { connectionId, server: serverSlug });

    // Ensure the MCP process is running
    try {
      await this.processManager.getOrSpawn(config);
      this.sendEvent(connection, 'ready', { server: serverSlug });
    } catch (error) {
      this.sendEvent(connection, 'error', {
        message: error instanceof Error ? error.message : 'Failed to start server',
      });
    }

    // Handle client disconnect
    req.on('close', () => {
      this.connections.delete(connectionId);
      console.log(`[SSE] Connection closed: ${connectionId}`);
    });

    // Keep connection open
    res.on('error', () => {
      this.connections.delete(connectionId);
    });
  }

  /**
   * Handle JSON-RPC request over SSE
   */
  async handleRequest(connectionId: string, request: MCPRequest): Promise<void> {
    const connection = this.connections.get(connectionId);

    if (!connection) {
      console.error(`[SSE] Unknown connection: ${connectionId}`);
      return;
    }

    const config = getServerConfig(connection.serverSlug);

    if (!config) {
      this.sendEvent(connection, 'error', {
        id: request.id,
        error: { code: -32600, message: 'Server not found' },
      });
      return;
    }

    try {
      let response;

      if (request.method === 'tools/list') {
        response = await this.processManager.listTools(connection.serverSlug, config);
      } else if (request.method === 'tools/call') {
        const params = request.params as { name: string; arguments: Record<string, unknown> };
        response = await this.processManager.callTool(
          connection.serverSlug,
          config,
          params.name,
          params.arguments
        );
      } else {
        // Forward other methods directly
        const managed = await this.processManager.getOrSpawn(config);
        response = { jsonrpc: '2.0' as const, id: request.id, error: { code: -32601, message: 'Method not found' } };
      }

      this.sendEvent(connection, 'message', response);
    } catch (error) {
      this.sendEvent(connection, 'message', {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      });
    }
  }

  /**
   * Send SSE event to a connection
   */
  private sendEvent(connection: SSEConnection, event: string, data: unknown): void {
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      connection.response.write(message);
    } catch (error) {
      console.error(`[SSE] Failed to send event to ${connection.id}:`, error);
      this.connections.delete(connection.id);
    }
  }

  /**
   * Ping all connections to keep them alive
   */
  private pingConnections(): void {
    const now = new Date();

    for (const [id, connection] of this.connections) {
      try {
        this.sendEvent(connection, 'ping', { timestamp: now.toISOString() });
        connection.lastPing = now;
      } catch {
        this.connections.delete(id);
      }
    }
  }

  /**
   * Get active connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Shutdown handler
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Close all connections
    for (const [, connection] of this.connections) {
      try {
        connection.response.end();
      } catch {
        // Ignore errors during shutdown
      }
    }

    this.connections.clear();
  }
}
