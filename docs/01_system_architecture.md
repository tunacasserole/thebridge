# TheBridge: System Architecture Deep Dive
**Version:** 1.0  
**Date:** December 12, 2025  
**Author:** Aaron Henderson, SRE - Platform Engineering

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Breakdown](#component-breakdown)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Scalability Design](#scalability-design)
6. [Fault Tolerance & Resilience](#fault-tolerance--resilience)
7. [Security Architecture](#security-architecture)
8. [Technology Stack Decisions](#technology-stack-decisions)

---

## Executive Summary

TheBridge is a distributed, event-driven SRE command center built on Next.js 14 (App Router) with the Claude Agent SDK powering intelligent automation. The architecture prioritizes:

- **Low Latency:** WebSocket-based real-time updates (<100ms)
- **High Availability:** 99.9% uptime with graceful degradation
- **Scalability:** Horizontal scaling for 100+ concurrent users
- **Modularity:** 24+ MCP integrations with clean separation
- **Observability:** Every layer instrumented and monitored

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Web UI   │  │ Mobile   │  │ Slack    │  │ CLI      │      │
│  │ (Next.js)│  │ (React)  │  │ Bot      │  │ Tool     │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │              │             │             │
└───────┼─────────────┼──────────────┼─────────────┼─────────────┘
        │             │              │             │
        ▼             ▼              ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Next.js API Routes (App Router)                       │   │
│  │  - Authentication (NextAuth.js + Entra ID)             │   │
│  │  - Rate Limiting (Redis)                               │   │
│  │  - Request Validation (Zod)                            │   │
│  └────────────────┬───────────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ REST API │ │WebSocket │ │ GraphQL  │
│ Routes   │ │ Server   │ │ (Future) │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     └────────────┼────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│  ┌────────────────────────────────────────────────────────┐   │
│  │          Agent Orchestration Engine                     │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Claude Agent SDK Runtime                        │  │   │
│  │  │  - Query Processing                              │  │   │
│  │  │  - Session Management                            │  │   │
│  │  │  - Tool Execution                                │  │   │
│  │  │  - Permission Management                         │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────┬────────────┬────────────┬─────────────┐      │
│  │ Incident    │ Quota      │ Knowledge  │ Remediation │      │
│  │ Agent       │ Agent      │ Agent      │ Agent       │      │
│  └─────────────┴────────────┴────────────┴─────────────┘      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │          MCP Integration Layer                         │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │   │
│  │  │Coralogix│NewRelic│Rootly │K8s    │Jira   │  +19  │   │
│  │  │  MCP  │  MCP  │  MCP  │  MCP  │  MCP  │  more │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│Background│ │ Event    │ │ RAG      │
│ Jobs     │ │ Bus      │ │ Pipeline │
└──────────┘ └──────────┘ └──────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │PostgreSQL│ │ Redis    │ │ Pinecone │ │TimescaleDB│        │
│  │ (Relational)│(Cache) │ │ (Vectors)│ │ (Metrics) │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                 External Systems (via MCP)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │Coralogix │ │New Relic │ │ Rootly   │ │Kubernetes│         │
│  │  API     │ │   API    │ │   API    │ │   API    │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Frontend Layer (Next.js 14)

**Technology Choices:**
- **Framework:** Next.js 14 with App Router
- **Rendering:** Hybrid - Server Components for initial load, Client Components for interactivity
- **State:** Zustand for global state, TanStack Query for server state
- **Real-time:** Native WebSocket with automatic reconnection
- **UI:** Tailwind CSS + shadcn/ui components

**Component Architecture:**
```typescript
// app/layout.tsx - Root Layout
export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          <main>{children}</main>
          <RealtimeProvider />
        </Providers>
      </body>
    </html>
  );
}

// app/(dashboard)/layout.tsx - Dashboard Layout
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Key Features:**
1. **Server Components by Default:** Reduces JavaScript bundle, improves initial load
2. **Streaming:** Uses Suspense boundaries for progressive loading
3. **Data Fetching:** Server-side via `fetch()` with automatic caching
4. **Route Groups:** Organize routes without affecting URL structure

### 2. API Gateway Layer

**Responsibilities:**
- Authentication & Authorization
- Rate limiting
- Request validation
- Response caching
- Error normalization

**Implementation:**
```typescript
// middleware.ts - Global Middleware
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Rate limiting
    const ip = req.ip ?? '127.0.0.1';
    const { success } = rateLimit.limit(ip);
    
    if (!success) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
```

**Rate Limiting Strategy:**
```typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

export const rateLimit = {
  // Per-user limits
  user: async (userId: string) => {
    const key = `ratelimit:user:${userId}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 60); // 1 minute window
    }
    
    return {
      success: count <= 100, // 100 requests per minute
      remaining: Math.max(0, 100 - count),
    };
  },
  
  // Per-IP limits (anonymous)
  ip: async (ip: string) => {
    const key = `ratelimit:ip:${ip}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 60);
    }
    
    return {
      success: count <= 20, // 20 requests per minute
      remaining: Math.max(0, 20 - count),
    };
  },
};
```

### 3. Agent Orchestration Engine

**Core Architecture:**
```typescript
// lib/agents/orchestrator.ts
import { query, type Query } from '@anthropic-ai/claude-agent-sdk';

export class AgentOrchestrator {
  private sessions: Map<string, string> = new Map();
  
  async executeAgent(request: AgentRequest): Promise<AgentResponse> {
    const {
      agentType,
      prompt,
      context,
      sessionId,
    } = request;
    
    // Get or create session
    const session = sessionId ?? this.createSession();
    
    // Select appropriate agent
    const agent = this.getAgent(agentType);
    
    // Prepare context with relevant tools
    const tools = agent.getRequiredTools();
    
    // Execute with Claude Agent SDK
    const stream: Query = query({
      prompt: this.buildPrompt(prompt, context, agent),
      options: {
        resume: sessionId,
        allowedTools: tools,
        permissionMode: 'auto', // Auto-approve safe tools
      },
    });
    
    // Process streaming response
    const result = await this.processStream(stream, session);
    
    return result;
  }
  
  private async processStream(
    stream: Query,
    sessionId: string
  ): Promise<AgentResponse> {
    const chunks: string[] = [];
    const toolCalls: ToolCall[] = [];
    
    for await (const message of stream) {
      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            this.sessions.set(sessionId, message.session_id);
          }
          break;
          
        case 'assistant':
          for (const content of message.message.content) {
            if (content.type === 'text') {
              chunks.push(content.text);
            } else if (content.type === 'tool_use') {
              toolCalls.push({
                name: content.name,
                input: content.input,
              });
            }
          }
          break;
          
        case 'tool_result':
          // Log tool execution for audit
          await this.logToolExecution(message);
          break;
      }
    }
    
    return {
      sessionId,
      response: chunks.join(''),
      toolCalls,
      timestamp: new Date(),
    };
  }
}
```

**Agent Registry:**
```typescript
// lib/agents/registry.ts
import { IncidentAgent } from './incident';
import { QuotaAgent } from './quota';
import { RemediationAgent } from './remediation';
import { KnowledgeAgent } from './knowledge';

export const AgentRegistry = {
  incident: new IncidentAgent(),
  quota: new QuotaAgent(),
  remediation: new RemediationAgent(),
  knowledge: new KnowledgeAgent(),
};

export type AgentType = keyof typeof AgentRegistry;
```

### 4. MCP Integration Layer

**Architecture:**
```typescript
// lib/mcp/manager.ts
import { MCPClient } from '@modelcontextprotocol/sdk';

export class MCPManager {
  private clients: Map<string, MCPClient> = new Map();
  
  async initialize() {
    // Initialize all MCP servers
    const servers = await this.loadServerConfig();
    
    for (const server of servers) {
      try {
        const client = new MCPClient({
          transport: {
            type: 'streamable-http',
            url: server.url,
          },
          auth: {
            type: 'bearer',
            token: server.apiKey,
          },
        });
        
        await client.connect();
        this.clients.set(server.name, client);
        
        console.log(`✅ Connected to ${server.name} MCP`);
      } catch (error) {
        console.error(`❌ Failed to connect to ${server.name}:`, error);
        // Continue with other servers - graceful degradation
      }
    }
  }
  
  async callTool(
    serverName: string,
    toolName: string,
    params: unknown
  ): Promise<unknown> {
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`MCP server ${serverName} not available`);
    }
    
    try {
      const result = await client.callTool(toolName, params);
      return result;
    } catch (error) {
      // Log error and potentially retry
      await this.logError(serverName, toolName, error);
      throw error;
    }
  }
  
  // Health check for all MCP servers
  async healthCheck(): Promise<MCPHealthStatus[]> {
    const statuses: MCPHealthStatus[] = [];
    
    for (const [name, client] of this.clients) {
      try {
        await client.ping();
        statuses.push({ name, status: 'healthy' });
      } catch (error) {
        statuses.push({ name, status: 'unhealthy', error });
      }
    }
    
    return statuses;
  }
}
```

**MCP Server Configuration:**
```typescript
// config/mcp-servers.ts
export const MCP_SERVERS = [
  {
    name: 'coralogix',
    url: process.env.CORALOGIX_MCP_URL!,
    apiKey: process.env.CORALOGIX_API_KEY!,
    tools: [
      'search_logs',
      'get_quota_usage',
      'get_top_consumers',
      'create_alert',
    ],
  },
  {
    name: 'newrelic',
    url: process.env.NEW_RELIC_MCP_URL!,
    apiKey: process.env.NEW_RELIC_API_KEY!,
    tools: [
      'query_nrql',
      'get_apm_metrics',
      'get_traces',
      'create_dashboard',
    ],
  },
  {
    name: 'rootly',
    url: process.env.ROOTLY_MCP_URL!,
    apiKey: process.env.ROOTLY_API_KEY!,
    tools: [
      'get_incident',
      'create_incident',
      'update_incident',
      'add_timeline_entry',
    ],
  },
  {
    name: 'kubernetes',
    url: process.env.K8S_MCP_URL!,
    apiKey: process.env.K8S_API_KEY!,
    tools: [
      'get_pods',
      'get_deployments',
      'describe_pod',
      'get_logs',
      'exec_command',
    ],
  },
  // ... 20 more servers
];
```

### 5. Real-Time Communication Layer

**WebSocket Server:**
```typescript
// lib/websocket/server.ts
import { WebSocketServer } from 'ws';
import { parse } from 'url';

export class TheBridgeWebSocketServer {
  private wss: WebSocketServer;
  private subscriptions: Map<string, Set<WebSocket>> = new Map();
  
  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws, req) => {
      const { pathname } = parse(req.url!);
      const topic = pathname?.slice(1); // Remove leading /
      
      if (!topic) {
        ws.close(1008, 'Topic required');
        return;
      }
      
      // Add to subscription
      this.subscribe(topic, ws);
      
      ws.on('message', (message) => {
        this.handleMessage(ws, message.toString(), topic);
      });
      
      ws.on('close', () => {
        this.unsubscribe(topic, ws);
      });
      
      // Send initial state
      this.sendInitialState(ws, topic);
    });
  }
  
  private subscribe(topic: string, ws: WebSocket) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(ws);
  }
  
  private unsubscribe(topic: string, ws: WebSocket) {
    this.subscriptions.get(topic)?.delete(ws);
  }
  
  // Broadcast to all subscribers of a topic
  broadcast(topic: string, data: unknown) {
    const subs = this.subscriptions.get(topic);
    if (!subs) return;
    
    const message = JSON.stringify({
      type: 'update',
      topic,
      data,
      timestamp: new Date().toISOString(),
    });
    
    subs.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  
  // Send targeted message
  send(ws: WebSocket, type: string, data: unknown) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data, timestamp: new Date() }));
    }
  }
}
```

**Client Hook:**
```typescript
// hooks/useWebSocket.ts
import { useEffect, useState, useRef } from 'react';

export function useWebSocket<T>(topic: string) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/${topic}`);
    
    ws.onopen = () => {
      setStatus('connected');
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'update') {
        setData(message.data);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('disconnected');
    };
    
    ws.onclose = () => {
      setStatus('disconnected');
      
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        setStatus('connecting');
      }, 3000);
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [topic]);
  
  const send = (data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };
  
  return { data, status, send };
}
```

---

## Data Flow Architecture

### Query Processing Flow

```
User Query
    │
    ▼
┌─────────────────────┐
│  API Route Handler  │
│  - Validate input   │
│  - Check auth       │
│  - Rate limit       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Agent Orchestrator  │
│  - Select agent     │
│  - Prepare context  │
│  - Load session     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Claude Agent SDK   │
│  - Process prompt   │
│  - Execute tools    │
│  - Stream response  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  MCP Integration    │
│  - Call MCPs        │
│  - Aggregate data   │
│  - Handle errors    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Response Builder   │
│  - Format response  │
│  - Add suggestions  │
│  - Include links    │
└──────────┬──────────┘
           │
           ▼
      User Interface
```

### Real-Time Alert Flow

```
External System Alert
    │
    ▼
┌─────────────────────┐
│  Webhook Handler    │
│  (Next.js Route)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Alert Processor    │
│  - Validate         │
│  - Enrich           │
│  - Classify         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Event Bus (Redis)  │
│  - Pub/Sub          │
└──────────┬──────────┘
           │
           ├──────────────┬──────────────┐
           ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │Database │    │WebSocket│    │ Slack   │
    │  Save   │    │Broadcast│    │ Notify  │
    └─────────┘    └─────────┘    └─────────┘
```

---

## Scalability Design

### Horizontal Scaling Strategy

**Application Tier:**
```yaml
# Kubernetes HPA Configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: thebridge-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: thebridge-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

**Database Tier:**
- **PostgreSQL:** Read replicas for query distribution
- **Redis:** Redis Cluster for horizontal scaling
- **Pinecone:** Serverless auto-scaling built-in

**Load Distribution:**
```typescript
// Sticky sessions for WebSocket connections
const sessionAffinity = {
  enabled: true,
  strategy: 'ip-hash', // Same IP → same pod
  timeout: 3600, // 1 hour
};
```

### Caching Strategy

**Multi-Layer Cache:**
```typescript
// lib/cache/strategy.ts

// Layer 1: In-memory (per pod)
const memoryCache = new Map<string, CacheEntry>();

// Layer 2: Redis (shared)
const redisCache = new Redis(process.env.REDIS_URL!);

// Layer 3: CDN (static assets)
const cdnCache = {
  maxAge: 86400, // 24 hours
  staleWhileRevalidate: 3600, // 1 hour
};

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Check memory cache
  const memEntry = memoryCache.get(key);
  if (memEntry && memEntry.expires > Date.now()) {
    return memEntry.value;
  }
  
  // Check Redis
  const redisValue = await redisCache.get(key);
  if (redisValue) {
    const value = JSON.parse(redisValue);
    // Populate memory cache
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
    return value;
  }
  
  // Fetch fresh data
  const value = await fetcher();
  
  // Store in both caches
  await redisCache.setex(key, ttl, JSON.stringify(value));
  memoryCache.set(key, {
    value,
    expires: Date.now() + ttl * 1000,
  });
  
  return value;
}
```

---

## Fault Tolerance & Resilience

### Circuit Breaker Pattern

```typescript
// lib/resilience/circuit-breaker.ts

class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 10000 // 10 seconds
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
      console.error(`Circuit breaker OPENED after ${this.failures} failures`);
    }
  }
}

// Usage
const coralogixCircuit = new CircuitBreaker(5, 60000);

async function queryCoralogix(query: string) {
  return coralogixCircuit.execute(async () => {
    return await coralogixMCP.searchLogs(query);
  });
}
```

### Graceful Degradation

```typescript
// lib/resilience/fallback.ts

export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  fallbackCondition: (error: any) => boolean = () => true
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (fallbackCondition(error)) {
      console.warn('Primary failed, using fallback:', error);
      return await fallback();
    }
    throw error;
  }
}

// Example: Query with fallback to cache
const quotaData = await withFallback(
  () => coralogixMCP.getQuotaUsage(),
  () => getCachedQuotaData(),
  (error) => error.code !== 'INVALID_REQUEST'
);
```

---

## Security Architecture

### Defense in Depth

**Layer 1: Network**
- VPC isolation
- Private subnets for databases
- Security groups with least privilege
- WAF rules for common attacks

**Layer 2: Application**
- JWT-based authentication
- Role-based access control (RBAC)
- Input validation with Zod
- Output sanitization
- CSRF protection
- Content Security Policy

**Layer 3: Data**
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Secrets in AWS Secrets Manager
- Database connection pooling with SSL

### Authentication Flow

```typescript
// lib/auth/config.ts
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.role = profile.role; // From Azure AD
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
```

---

## Technology Stack Decisions

### Decision Matrix

| Component | Options Considered | Selected | Rationale |
|-----------|-------------------|----------|-----------|
| Frontend Framework | Next.js, Remix, SvelteKit | **Next.js 14** | Best TypeScript support, largest ecosystem, App Router maturity |
| Agent SDK | LangChain, Haystack, Claude SDK | **Claude Agent SDK** | First-party support, built-in tools, session management |
| Vector DB | Pinecone, Weaviate, Qdrant | **Pinecone** | Serverless, zero ops, proven at scale |
| Real-time | Socket.io, Ably, Native WS | **Native WebSocket** | No vendor lock-in, full control, low latency |
| State Management | Redux, Zustand, Jotai | **Zustand** | Minimal boilerplate, TypeScript-first, small bundle |
| Database | PostgreSQL, MySQL, MongoDB | **PostgreSQL + TimescaleDB** | Best for time-series data, vector extension available |

### Key Architecture Decisions

**ADR-001: Use Claude Agent SDK over LangChain**
- **Context:** Need agent framework with tool execution
- **Decision:** Claude Agent SDK
- **Rationale:**
  - First-party support from Anthropic
  - Built-in session management
  - Superior streaming capabilities
  - MCP integration out of box
- **Consequences:** 
  - ✅ Faster development
  - ✅ Better reliability
  - ❌ Vendor lock-in to Anthropic

**ADR-002: Hybrid Rendering Strategy**
- **Context:** Balance performance with interactivity
- **Decision:** Server Components for static content, Client for interactive
- **Rationale:**
  - Smaller JavaScript bundles
  - Better SEO
  - Faster time to interactive
- **Consequences:**
  - ✅ 40% smaller initial bundle
  - ✅ Improved Core Web Vitals
  - ❌ Learning curve for team

**ADR-003: Native WebSocket over Socket.io**
- **Context:** Real-time dashboard updates
- **Decision:** Native WebSocket with custom server
- **Rationale:**
  - No external dependencies
  - Full control over protocol
  - Lower latency (<50ms vs ~100ms)
  - Works with Next.js instrumentation
- **Consequences:**
  - ✅ Lower operational cost
  - ✅ Simpler architecture
  - ❌ Manual reconnection logic

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load (p95) | <2s | Lighthouse |
| API Response (p95) | <500ms | Prometheus |
| WebSocket Latency | <100ms | Custom metrics |
| Time to Interactive | <3s | Lighthouse |
| Agent Query (simple) | <5s | Application logs |
| Agent Query (complex) | <15s | Application logs |
| Uptime | 99.9% | Uptime monitors |

---

## Next Steps

1. **Prototype Core Flow** - Build one complete flow (quota alert → agent → remediation)
2. **Load Testing** - Validate architecture under expected load
3. **Security Audit** - Third-party penetration testing
4. **Cost Optimization** - Profile actual usage vs estimates
5. **Documentation** - API docs, deployment guides, runbooks

---

**Document Status:** Draft  
**Review Date:** December 19, 2025  
**Reviewers:** TBD (Tomas Caraccia, Platform Engineering Team)
