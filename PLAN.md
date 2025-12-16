# Multi-Agent Architecture Plan for TheBridge

## Overview

This plan outlines the architecture for running multiple AI agents concurrently with separate chat interfaces. The goal is to enable users to:
1. Click an agent in the sidebar → opens a dedicated chat panel for that agent
2. Have the main TheBridge agent continue running in the main window
3. Run multiple agent processes simultaneously with real-time streaming

---

## Research Findings

### Claude Agent SDK Capabilities

Based on [official Anthropic documentation](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) and [session management docs](https://docs.claude.com/en/api/agent-sdk/sessions):

- **Multiple `query()` calls can run concurrently** - Each call is independent
- **Session management** - Each session has its own ID, can be resumed or forked
- **Subagents via Task tool** - Built-in support for spawning specialized sub-agents
- **Isolated context windows** - Each agent instance has separate context

### SSE vs WebSockets for Multiple Streams

Based on research from [HackerNoon](https://hackernoon.com/streaming-in-nextjs-15-websockets-vs-server-sent-events) and [DEV Community](https://dev.to/brinobruno/real-time-web-communication-longshort-polling-websockets-and-sse-explained-nextjs-code-1l43):

| Aspect | SSE (Current) | WebSockets |
|--------|---------------|------------|
| Complexity | Low - simple extension | High - new infrastructure |
| Next.js Support | Native, works well | Limited, needs custom server |
| Browser Limit | ~6 concurrent per domain | No practical limit |
| Direction | Server → Client only | Bidirectional |
| Reconnection | Automatic | Manual implementation |
| HTTP/2 | Multiplexing supported | N/A |

**Recommendation: Extend SSE pattern** - The browser limit of 6 concurrent connections is sufficient for 2-4 agent panels. Adding WebSockets adds significant complexity without proportional benefit.

---

## Architecture Design

### Option A: Multiple SSE Streams (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌────────────────────────────────────┐   │
│  │   ToolsSidebar   │  │           Main Content             │   │
│  │                  │  │  ┌────────────────────────────┐    │   │
│  │  [Agent Tools]   │  │  │     Main Chat Interface    │    │   │
│  │  [Custom Tools]  │  │  │    (TheBridge Agent)       │    │   │
│  │  [MCPs]          │  │  │         SSE Stream #1      │    │   │
│  │                  │  │  └────────────────────────────┘    │   │
│  │  ── Agents ──    │  │                                    │   │
│  │  > General  ●    │──┼──►  Opens AgentChatPanel           │   │
│  │  > UI/UX    ●    │  │  ┌────────────────────────────┐    │   │
│  │  > Security ●    │  │  │   Agent Panel (UI/UX)      │    │   │
│  │                  │  │  │      SSE Stream #2         │    │   │
│  └──────────────────┘  │  └────────────────────────────┘    │   │
│                        │  ┌────────────────────────────┐    │   │
│                        │  │   Agent Panel (Security)   │    │   │
│                        │  │      SSE Stream #3         │    │   │
│                        │  └────────────────────────────┘    │   │
│                        └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  /api/chat                    → Main TheBridge agent             │
│  /api/agents/[agentId]/chat   → Specialized agent endpoint       │
│                                                                  │
│  Each endpoint:                                                  │
│  - Has unique system prompt                                      │
│  - Has agent-specific MCP servers                                │
│  - Returns independent SSE stream                                │
│  - Maintains separate session                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Definitions

| Agent ID | Name | Focus | MCP Servers | System Prompt Focus |
|----------|------|-------|-------------|---------------------|
| `general` | General | Multi-purpose SRE assistant | All enabled | Full TheBridge capabilities |
| `ui-ux` | UI/UX Designer | Design & frontend | None (filesystem tools) | UI/UX, accessibility, React |
| `security` | Security | Security analysis | GitHub, Kubernetes | Threat modeling, vulnerabilities |
| `incident` | Incident Investigator | Root cause analysis | Coralogix, New Relic, Rootly | Investigation workflow |
| `quota` | Quota Manager | Cost optimization | Coralogix, New Relic, Prometheus | Usage analysis |

---

## Implementation Plan

### Phase 1: Backend - Agent API Route (Day 1)

**Create parameterized agent endpoint:**

```typescript
// app/api/agents/[agentId]/chat/route.ts

import { query } from '@anthropic-ai/claude-agent-sdk';
import { AGENT_CONFIGS } from '@/lib/agents/configs';

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const agentConfig = AGENT_CONFIGS[agentId];

  if (!agentConfig) {
    return Response.json({ error: 'Unknown agent' }, { status: 404 });
  }

  const { message, conversationHistory, sessionId } = await request.json();

  // Build agent-specific prompt
  const prompt = buildAgentPrompt(agentConfig, message, conversationHistory);

  // Stream response via SSE
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of query({
        prompt,
        options: {
          model: agentConfig.model || 'sonnet',
          allowedTools: agentConfig.tools,
          mcpServers: agentConfig.mcpServers,
          resume: sessionId,
          permissionMode: 'bypassPermissions',
        },
      })) {
        // Stream events to client
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

**Create agent configurations:**

```typescript
// lib/agents/configs.ts

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: 'sonnet' | 'opus' | 'haiku';
  tools: string[];
  mcpServers: Record<string, any>;
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'ui-ux': {
    id: 'ui-ux',
    name: 'UI/UX Designer',
    description: 'Expert in interface design, accessibility, and frontend development',
    systemPrompt: `You are an expert UI/UX designer and frontend developer...`,
    model: 'sonnet',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    mcpServers: {},
  },
  // ... more agents
};
```

### Phase 2: Frontend - Agent Panel Component (Day 1-2)

**Create AgentChatPanel component:**

```typescript
// components/AgentChatPanel.tsx

interface AgentChatPanelProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export function AgentChatPanel({
  agentId,
  agentName,
  onClose,
  isMinimized,
  onToggleMinimize,
}: AgentChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sendMessage = async (content: string) => {
    setIsLoading(true);

    const response = await fetch(`/api/agents/${agentId}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: content,
        conversationHistory: messages,
        sessionId,
      }),
    });

    const reader = response.body?.getReader();
    // Handle SSE stream...
  };

  return (
    <div className="agent-panel">
      <PanelHeader
        name={agentName}
        onClose={onClose}
        onMinimize={onToggleMinimize}
        isMinimized={isMinimized}
      />
      {!isMinimized && (
        <>
          <MessageList messages={messages} />
          <InputArea onSend={sendMessage} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}
```

### Phase 3: State Management - Open Panels (Day 2)

**Update page.tsx to manage multiple panels:**

```typescript
// app/page.tsx

interface OpenAgent {
  id: string;
  name: string;
  isMinimized: boolean;
}

export default function Home() {
  const [openAgents, setOpenAgents] = useState<OpenAgent[]>([]);

  const handleAgentClick = (agentId: string, agentName: string) => {
    // Check if already open
    if (openAgents.some(a => a.id === agentId)) {
      // Focus/unminimize existing panel
      setOpenAgents(prev => prev.map(a =>
        a.id === agentId ? { ...a, isMinimized: false } : a
      ));
    } else {
      // Open new panel (max 3)
      if (openAgents.length >= 3) {
        // Close oldest panel
        setOpenAgents(prev => [...prev.slice(1), { id: agentId, name: agentName, isMinimized: false }]);
      } else {
        setOpenAgents(prev => [...prev, { id: agentId, name: agentName, isMinimized: false }]);
      }
    }
  };

  return (
    <div className="flex h-full">
      <ToolsSidebar onAgentClick={handleAgentClick} />
      <MainContent>
        <ChatInterface /> {/* Main TheBridge agent */}
      </MainContent>
      <AgentPanelContainer>
        {openAgents.map(agent => (
          <AgentChatPanel
            key={agent.id}
            agentId={agent.id}
            agentName={agent.name}
            isMinimized={agent.isMinimized}
            onClose={() => setOpenAgents(prev => prev.filter(a => a.id !== agent.id))}
            onToggleMinimize={() => setOpenAgents(prev =>
              prev.map(a => a.id === agent.id ? { ...a, isMinimized: !a.isMinimized } : a)
            )}
          />
        ))}
      </AgentPanelContainer>
    </div>
  );
}
```

### Phase 4: UI/UX Polish (Day 2-3)

**Panel layout options:**

1. **Stacked Panels (Recommended for MVP)**
   - Panels stack vertically on right side
   - Each panel ~400px wide, resizable height
   - Minimized panels collapse to header only

2. **Tabbed Interface**
   - Single panel area with tabs for each agent
   - Simpler but no simultaneous viewing

3. **Floating Windows (Future)**
   - Draggable, resizable panels
   - Most flexible but complex implementation

**Visual design:**
- Each agent has unique accent color
- Status indicator shows active/idle/error
- Typing indicator during response
- Connection status for SSE stream

---

## File Structure

```
/app
  /api
    /chat
      route.ts          # Main TheBridge agent (existing)
    /agents
      /[agentId]
        /chat
          route.ts      # Specialized agent endpoint (new)

/components
  AgentChatPanel.tsx    # Individual agent chat panel (new)
  AgentPanelContainer.tsx # Container managing multiple panels (new)
  ChatInterface.tsx     # Main chat (existing, minor updates)
  ToolsSidebar.tsx      # Sidebar (update to handle agent clicks)

/lib
  /agents
    configs.ts          # Agent definitions and prompts (new)
    types.ts            # TypeScript interfaces (new)
```

---

## Technical Considerations

### Browser SSE Connection Limits
- HTTP/1.1: ~6 concurrent connections per domain
- HTTP/2: Much higher (100+)
- **Mitigation**: Limit to 3 open agent panels + 1 main chat = 4 connections max

### Session Management
- Each agent panel maintains its own `sessionId`
- Sessions stored in browser (localStorage or state)
- Can resume conversations across page reloads

### Error Handling
- SSE auto-reconnect on disconnect
- Display connection status in panel header
- Queue messages during reconnection

### Performance
- Lazy load agent panels (only render when opened)
- Virtualize message lists for long conversations
- Debounce input to prevent excessive API calls

---

## Alternatives Considered

### Option B: WebSocket Multiplexing
- Single WebSocket connection, messages tagged with `agentId`
- Pros: Single connection, true bidirectional
- Cons: Requires custom WebSocket server, complex routing
- **Decision**: Too complex for initial implementation

### Option C: Main Agent Orchestrates Sub-agents
- User only talks to main agent, which spawns sub-agents internally
- Pros: Simpler UI, leverages SDK's Task tool
- Cons: User loses direct control, harder to track parallel work
- **Decision**: Doesn't meet user's requirement for separate panels

---

## Success Criteria

1. ✅ User can click agent in sidebar to open dedicated chat panel
2. ✅ Multiple panels can be open simultaneously (up to 3)
3. ✅ Each panel maintains independent conversation context
4. ✅ Main TheBridge chat continues unaffected
5. ✅ All streams remain responsive under concurrent load
6. ✅ Panels can be minimized/closed/reopened
7. ✅ Visual indication of which agents are active

---

## Implementation Order

| Step | Task | Estimated Time |
|------|------|----------------|
| 1 | Create `/api/agents/[agentId]/chat` route | 2 hours |
| 2 | Create `lib/agents/configs.ts` with agent definitions | 1 hour |
| 3 | Create `AgentChatPanel` component | 3 hours |
| 4 | Create `AgentPanelContainer` layout component | 2 hours |
| 5 | Update `page.tsx` state management | 2 hours |
| 6 | Update `ToolsSidebar` click handlers | 1 hour |
| 7 | Add panel minimize/close functionality | 1 hour |
| 8 | Style and polish UI | 2 hours |
| 9 | Test concurrent streams | 1 hour |
| 10 | Error handling and reconnection | 1 hour |

**Total estimated time: 16 hours (~2 days)**

---

## Next Steps

Upon approval, I will:
1. Create the agent API route structure
2. Define agent configurations with specialized prompts
3. Build the AgentChatPanel component
4. Integrate everything into the existing layout

---

## Sources

- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Session Management - Claude Docs](https://docs.claude.com/en/api/agent-sdk/sessions)
- [Multi-Agent Orchestration: Running 10+ Claude Instances in Parallel](https://dev.to/bredmond1019/multi-agent-orchestration-running-10-claude-instances-in-parallel-part-3-29da)
- [Streaming in Next.js 15: WebSockets vs Server-Sent Events](https://hackernoon.com/streaming-in-nextjs-15-websockets-vs-server-sent-events)
- [Real-Time Web Communication in Next.js](https://dev.to/brinobruno/real-time-web-communication-longshort-polling-websockets-and-sse-explained-nextjs-code-1l43)
