/**
 * MCP Hub Types
 */

export interface MCPServerConfig {
  slug: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface MCPConnection {
  id: string;
  serverSlug: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface SSEMessage {
  event?: string;
  data: string;
  id?: string;
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  servers: Record<string, {
    available: boolean;
    lastCheck: Date;
    error?: string;
  }>;
}
