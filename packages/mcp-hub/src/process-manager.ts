/**
 * MCP Process Manager
 *
 * Manages spawning and lifecycle of MCP server processes
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import type { MCPServerConfig, MCPRequest, MCPResponse } from './types.js';

interface ManagedProcess {
  id: string;
  config: MCPServerConfig;
  process: ChildProcess;
  pendingRequests: Map<string | number, {
    resolve: (response: MCPResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>;
  buffer: string;
  ready: boolean;
  lastActivity: Date;
}

export class ProcessManager extends EventEmitter {
  private processes: Map<string, ManagedProcess> = new Map();
  private readonly requestTimeout: number;
  private readonly maxIdleTime: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: { requestTimeout?: number; maxIdleTime?: number } = {}) {
    super();
    this.requestTimeout = options.requestTimeout || 30000; // 30s default
    this.maxIdleTime = options.maxIdleTime || 300000; // 5min default

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupIdleProcesses(), 60000);
  }

  /**
   * Spawn or get existing MCP server process
   */
  async getOrSpawn(config: MCPServerConfig): Promise<string> {
    // Check if we already have a running process for this server
    const existing = this.processes.get(config.slug);
    if (existing && existing.ready) {
      existing.lastActivity = new Date();
      return existing.id;
    }

    // Spawn new process
    return this.spawnProcess(config);
  }

  /**
   * Spawn a new MCP server process
   */
  private async spawnProcess(config: MCPServerConfig): Promise<string> {
    const id = uuid();

    console.log(`[ProcessManager] Spawning ${config.name} (${config.slug})...`);

    const childProcess = spawn(config.command, config.args, {
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const managed: ManagedProcess = {
      id,
      config,
      process: childProcess,
      pendingRequests: new Map(),
      buffer: '',
      ready: false,
      lastActivity: new Date(),
    };

    // Handle stdout (JSON-RPC responses)
    childProcess.stdout?.on('data', (data: Buffer) => {
      managed.buffer += data.toString();
      this.processBuffer(managed);
    });

    // Handle stderr (logging)
    childProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`[${config.slug}] ${data.toString().trim()}`);
    });

    // Handle process exit
    childProcess.on('exit', (code, signal) => {
      console.log(`[ProcessManager] ${config.slug} exited (code=${code}, signal=${signal})`);
      this.processes.delete(config.slug);

      // Reject all pending requests
      for (const [, pending] of managed.pendingRequests) {
        clearTimeout(pending.timeout);
        pending.reject(new Error(`Process exited unexpectedly`));
      }

      this.emit('process:exit', { slug: config.slug, code, signal });
    });

    childProcess.on('error', (error) => {
      console.error(`[ProcessManager] ${config.slug} error:`, error);
      this.emit('process:error', { slug: config.slug, error });
    });

    this.processes.set(config.slug, managed);

    // Wait for initialization
    await this.initializeProcess(managed);

    return id;
  }

  /**
   * Initialize MCP process with handshake
   */
  private async initializeProcess(managed: ManagedProcess): Promise<void> {
    // Send initialize request
    const initResponse = await this.sendRequest(managed, {
      jsonrpc: '2.0',
      id: 'init-' + uuid(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true },
        },
        clientInfo: {
          name: 'thebridge-mcp-hub',
          version: '1.0.0',
        },
      },
    });

    if (initResponse.error) {
      throw new Error(`Initialization failed: ${initResponse.error.message}`);
    }

    // Send initialized notification
    this.sendNotification(managed, {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });

    managed.ready = true;
    console.log(`[ProcessManager] ${managed.config.name} ready`);
  }

  /**
   * Send a JSON-RPC request and wait for response
   */
  async sendRequest(managed: ManagedProcess, request: MCPRequest): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        managed.pendingRequests.delete(request.id);
        reject(new Error(`Request timed out: ${request.method}`));
      }, this.requestTimeout);

      managed.pendingRequests.set(request.id, { resolve, reject, timeout });

      const message = JSON.stringify(request) + '\n';
      managed.process.stdin?.write(message);
      managed.lastActivity = new Date();
    });
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   */
  sendNotification(managed: ManagedProcess, notification: { jsonrpc: '2.0'; method: string; params?: unknown }): void {
    const message = JSON.stringify(notification) + '\n';
    managed.process.stdin?.write(message);
    managed.lastActivity = new Date();
  }

  /**
   * Process buffered stdout data for JSON-RPC messages
   */
  private processBuffer(managed: ManagedProcess): void {
    const lines = managed.buffer.split('\n');
    managed.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line) as MCPResponse;

        // Check if this is a response to a pending request
        if ('id' in message && message.id !== undefined) {
          const pending = managed.pendingRequests.get(message.id);
          if (pending) {
            clearTimeout(pending.timeout);
            managed.pendingRequests.delete(message.id);
            pending.resolve(message);
          }
        } else {
          // This is a notification from the server
          this.emit('notification', {
            slug: managed.config.slug,
            message,
          });
        }
      } catch (e) {
        console.error(`[${managed.config.slug}] Failed to parse: ${line}`);
      }
    }
  }

  /**
   * Execute a tool call on a specific server
   */
  async callTool(
    slug: string,
    config: MCPServerConfig,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPResponse> {
    await this.getOrSpawn(config);
    const managed = this.processes.get(slug);

    if (!managed || !managed.ready) {
      throw new Error(`Server ${slug} is not ready`);
    }

    return this.sendRequest(managed, {
      jsonrpc: '2.0',
      id: uuid(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    });
  }

  /**
   * List available tools from a server
   */
  async listTools(slug: string, config: MCPServerConfig): Promise<MCPResponse> {
    await this.getOrSpawn(config);
    const managed = this.processes.get(slug);

    if (!managed || !managed.ready) {
      throw new Error(`Server ${slug} is not ready`);
    }

    return this.sendRequest(managed, {
      jsonrpc: '2.0',
      id: uuid(),
      method: 'tools/list',
    });
  }

  /**
   * Clean up idle processes
   */
  private cleanupIdleProcesses(): void {
    const now = Date.now();

    for (const [slug, managed] of this.processes) {
      const idleTime = now - managed.lastActivity.getTime();

      if (idleTime > this.maxIdleTime) {
        console.log(`[ProcessManager] Cleaning up idle process: ${slug}`);
        managed.process.kill('SIGTERM');
        this.processes.delete(slug);
      }
    }
  }

  /**
   * Get health status of all processes
   */
  getHealth(): Record<string, { ready: boolean; lastActivity: Date }> {
    const health: Record<string, { ready: boolean; lastActivity: Date }> = {};

    for (const [slug, managed] of this.processes) {
      health[slug] = {
        ready: managed.ready,
        lastActivity: managed.lastActivity,
      };
    }

    return health;
  }

  /**
   * Shutdown all processes
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    const promises: Promise<void>[] = [];

    for (const [slug, managed] of this.processes) {
      promises.push(
        new Promise((resolve) => {
          managed.process.once('exit', () => resolve());
          managed.process.kill('SIGTERM');

          // Force kill after 5 seconds
          setTimeout(() => {
            if (!managed.process.killed) {
              managed.process.kill('SIGKILL');
            }
            resolve();
          }, 5000);
        })
      );
    }

    await Promise.all(promises);
    this.processes.clear();
  }
}
