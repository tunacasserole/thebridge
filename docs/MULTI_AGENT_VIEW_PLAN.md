# Multi-Agent Orchestration View - Implementation Plan

## Overview

Transform TheBridge from a single-chat interface to a multi-agent orchestration workspace where users can interact with up to 6+ agents simultaneously in a 3-column grid layout.

### Current State
- **Main Chat View**: Full-width ChatInterface component for the "General" agent
- **Agent Panels**: Right sidebar with stacked agent panels (currently max 3)
- **Agents are stacked vertically**: Users must scroll to see all open agents
- **View Modes**: Chat view ↔ Dashboard view (toggled via FAB)

### Target State
- **Multi-Agent View**: New view mode showing 3xN grid of agent cards
- **Seamless Transition**: Main chat shrinks/animates into first grid position
- **Concurrent Streaming**: All agents can stream responses simultaneously
- **Active Status Indicators**: Clear visual distinction between working/idle agents
- **Interactive**: Chat into any agent panel without interrupting others

---

## Architecture Overview

### Frontend Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                           Header                                │
├────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌──────────────────────────────────────────────┐ │
│  │ Tools   │  │           Multi-Agent Grid                   │ │
│  │ Sidebar │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │         │  │  │ General │  │ Agent 2 │  │ Agent 3 │      │ │
│  │ Agents  │  │  │  Card   │  │  Card   │  │  Card   │      │ │
│  │ MCPs    │  │  └─────────┘  └─────────┘  └─────────┘      │ │
│  │ Tools   │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │         │  │  │ Agent 4 │  │ Agent 5 │  │ Agent 6 │      │ │
│  │         │  │  │  Card   │  │  Card   │  │  Card   │      │ │
│  └─────────┘  │  └─────────┘  └─────────┘  └─────────┘      │ │
│               └──────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│                           Footer                                │
└────────────────────────────────────────────────────────────────┘
```

### View State Machine

```
                    ┌─────────────┐
                    │  Chat View  │ (Default)
                    │  (General)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌───────────┐ ┌──────────┐
        │Dashboard │ │Multi-Agent│ │  Agent   │
        │  View    │ │   View    │ │ Spawned  │
        │(FAB)     │ │(1st agent)│ │          │
        └──────────┘ └───────────┘ └──────────┘
                           │
                           ▼
                    General shrinks to
                    position [0,0] in grid
```

---

## Phase 1: View State Management

### 1.1 Update View Mode Types

**File: `types/views.ts`** (new file)

```typescript
export type ViewMode = 'chat' | 'dashboard' | 'multiagent';

export interface AgentGridPosition {
  id: string;
  row: number;
  col: number;
  isGeneralAgent: boolean;
}

export interface MultiAgentState {
  mode: ViewMode;
  gridAgents: AgentGridPosition[];
  focusedAgentId: string | null;
  isTransitioning: boolean;
}
```

### 1.2 Create Multi-Agent Context

**File: `contexts/MultiAgentContext.tsx`** (new file)

```typescript
// Manages:
// - Current view mode
// - Grid agent positions
// - Transition animations
// - Agent spawn/close operations
// - Focus management
```

### 1.3 Update `app/page.tsx`

- Replace `showChat` boolean with `ViewMode` enum
- Add `useMultiAgentContext` hook
- Implement view transition logic
- Handle agent grid positioning

---

## Phase 2: Multi-Agent Grid Component

### 2.1 Create MultiAgentGrid Component

**File: `components/MultiAgentGrid.tsx`**

```typescript
interface MultiAgentGridProps {
  agents: AgentGridPosition[];
  onCloseAgent: (agentId: string) => void;
  onFocusAgent: (agentId: string) => void;
  activeAgents: Set<string>;
}

// Features:
// - 3-column responsive grid
// - Expandable rows (3xN layout)
// - Smooth add/remove animations
// - Position-based rendering
```

### 2.2 Create AgentCard Component

**File: `components/agents/AgentCard.tsx`**

Redesigned version of `AgentChatPanel` optimized for grid layout:

```typescript
interface AgentCardProps {
  agentId: string;
  position: { row: number; col: number };
  isGeneralAgent: boolean;
  isActive: boolean;
  isFocused: boolean;
  onClose: () => void;
  onFocus: () => void;
  onActiveChange: (isActive: boolean) => void;
}

// Features:
// - Compact header with status indicator
// - Scrollable message area
// - Input field always visible
// - Minimize/maximize capability
// - Drag to reorder (future)
```

### 2.3 Grid Layout CSS

```css
.multi-agent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
}

.agent-card {
  min-height: 300px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}
```

---

## Phase 3: Animation System

### 3.1 Chat-to-Grid Transition Animation

When first agent is spawned:

1. **Chat View Shrinks**
   - Scale down from 100% to ~33% width
   - Move to position [0, 0]
   - Duration: 400ms with emphasized easing

2. **New Agent Slides In**
   - Fade + slide from right
   - Land in position [0, 1]
   - Duration: 300ms

**Implementation using lib/theme/motion.ts:**

```typescript
// New keyframes to add:
const gridTransition = {
  shrinkToCard: `
    @keyframes shrinkToCard {
      from {
        width: 100%;
        transform: scale(1);
      }
      to {
        width: calc(33.333% - 0.667rem);
        transform: scale(1);
      }
    }
  `,
  cardEnter: `
    @keyframes cardEnter {
      from {
        opacity: 0;
        transform: translateX(50px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
  `,
};
```

### 3.2 Agent Card Animations

- **Enter**: Scale + fade from center (staggered by position)
- **Exit**: Fade + collapse, remaining cards shift
- **Focus**: Subtle glow + elevation change
- **Active**: Pulsing border/indicator

---

## Phase 4: Backend - Concurrent Agent Management

### 4.1 Agent Session Manager

**File: `lib/agents/sessionManager.ts`** (new file)

```typescript
interface AgentSession {
  id: string;
  agentId: string;
  sessionId: string;
  status: 'idle' | 'streaming' | 'error';
  lastActivity: Date;
  abortController: AbortController | null;
}

class AgentSessionManager {
  private sessions: Map<string, AgentSession> = new Map();

  // Create/resume session
  createSession(agentId: string): AgentSession;

  // Get active sessions
  getActiveSessions(): AgentSession[];

  // Cancel specific session stream
  cancelSession(sessionId: string): void;

  // Cleanup stale sessions
  cleanupStaleSessions(): void;
}
```

### 4.2 SSE Connection Pool

The current architecture uses individual SSE connections per agent, which is correct. Key considerations:

1. **HTTP/2 Support**: Modern browsers support 100+ concurrent streams (no 6-connection limit)
2. **AbortController**: Each agent request has its own abort controller
3. **Independent Streams**: Each `/api/agents/[agentId]/chat` call is independent

**Optimization: Heartbeat for Long Connections**

```typescript
// In route.ts - add keepalive ping
const HEARTBEAT_INTERVAL = 15000; // 15 seconds

const heartbeatInterval = setInterval(() => {
  controller.enqueue(encoder.encode(': heartbeat\n\n'));
}, HEARTBEAT_INTERVAL);
```

### 4.3 Update Agent Chat Route

**File: `app/api/agents/[agentId]/chat/route.ts`**

Add:
- Session tracking header
- Heartbeat pings
- Better error recovery
- Status events (for UI indicators)

```typescript
// New event types:
type StreamEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'status'; status: 'thinking' | 'tool_calling' | 'responding' }
  | { type: 'tool'; name: string; status: 'start' | 'end' }
  | { type: 'text'; content: string }
  | { type: 'done'; response: string; toolCalls: string[] }
  | { type: 'error'; message: string }
  | { type: 'heartbeat' };
```

---

## Phase 5: Client-Side Streaming Manager

### 5.1 Multi-Stream Hook

**File: `hooks/useMultiAgentStreams.ts`** (new file)

```typescript
interface AgentStream {
  agentId: string;
  status: 'idle' | 'connecting' | 'streaming' | 'error';
  messages: Message[];
  currentTool: string | null;
  error: string | null;
  send: (message: string) => void;
  cancel: () => void;
}

function useMultiAgentStreams(agentIds: string[]): Map<string, AgentStream> {
  // Manages concurrent EventSource connections
  // Each agent has independent state
  // Cleanup on unmount
}
```

### 5.2 Stream State Machine

```
                    ┌──────┐
                    │ idle │
                    └──┬───┘
                       │ send()
                       ▼
                ┌────────────┐
                │ connecting │
                └─────┬──────┘
                      │ SSE open
                      ▼
                ┌───────────┐
           ┌───▶│ streaming │◀───┐
           │    └─────┬─────┘    │
           │          │          │
    text/tool    done/error   new message
           │          │          │
           └──────────┴──────────┘
                      │
                      ▼
              ┌───────────────┐
              │  idle/error   │
              └───────────────┘
```

---

## Phase 6: Visual Feedback & UX

### 6.1 Agent Status Indicators

Each AgentCard header shows:

```
┌────────────────────────────────────────────┐
│ ●  General Assistant    🔧 tool_name   ✕   │
│ ↑                       ↑              ↑   │
│ Status dot              Current tool   Close│
└────────────────────────────────────────────┘
```

**Status dot colors:**
- 🟢 Green: Idle, ready
- 🔵 Blue pulsing: Thinking/connecting
- 🟡 Amber pulsing: Tool execution
- 🔴 Red: Error state

### 6.2 Attention Indicators

When an agent needs attention (finished, error):
- Brief pulse animation on card border
- Optional subtle sound (user preference)
- Card briefly glows with agent accent color

### 6.3 Focus State

Clicking an agent card:
- Card gets subtle elevation increase
- Slightly larger scale (1.02x)
- Input field auto-focuses
- Other cards slightly dim

---

## Phase 7: Integration & Transition Logic

### 7.1 Transition Triggers

| Action | From State | To State | Animation |
|--------|-----------|----------|-----------|
| Click agent in sidebar (first time) | Chat View | Multi-Agent View | Chat shrinks to [0,0], new agent enters [0,1] |
| Click agent in sidebar (already in grid) | Multi-Agent View | Multi-Agent View | Focus that agent |
| Click agent in sidebar (not in grid) | Multi-Agent View | Multi-Agent View | Add to next position |
| Close last spawned agent | Multi-Agent View | Chat View | General expands to full |
| FAB click | Any | Dashboard View | Fade through transition |

### 7.2 Grid Position Algorithm

```typescript
function getNextGridPosition(existingAgents: AgentGridPosition[]): { row: number; col: number } {
  const positions = existingAgents.map(a => ({ row: a.row, col: a.col }));

  // Fill columns left-to-right, then new rows
  for (let row = 0; row < MAX_ROWS; row++) {
    for (let col = 0; col < 3; col++) {
      if (!positions.some(p => p.row === row && p.col === col)) {
        return { row, col };
      }
    }
  }

  // Fallback: add new row
  return { row: Math.ceil(existingAgents.length / 3), col: existingAgents.length % 3 };
}
```

---

## Implementation Order

### Week 1: Foundation
1. [ ] Create `types/views.ts` with view mode types
2. [ ] Create `contexts/MultiAgentContext.tsx`
3. [ ] Update `app/page.tsx` to use new context
4. [ ] Create basic `MultiAgentGrid.tsx` component
5. [ ] Create `AgentCard.tsx` component (refactor from AgentChatPanel)

### Week 2: Streaming & Backend
6. [ ] Create `lib/agents/sessionManager.ts`
7. [ ] Add heartbeat to agent chat route
8. [ ] Create `hooks/useMultiAgentStreams.ts`
9. [ ] Add status events to streaming

### Week 3: Animations & Polish
10. [ ] Implement chat-to-grid transition animation
11. [ ] Add card enter/exit animations
12. [ ] Implement focus states
13. [ ] Add status indicators

### Week 4: Testing & Refinement
14. [ ] Test concurrent streaming (6+ agents)
15. [ ] Performance optimization (virtualization if needed)
16. [ ] Accessibility audit
17. [ ] Mobile/responsive design

---

## Technical Considerations

### Performance
- **React 18 concurrent rendering**: Use `startTransition` for view changes
- **Memoization**: Heavily memoize AgentCard to prevent re-renders
- **Virtualization**: Consider react-window if >12 agents
- **Stream batching**: Batch SSE updates (render every 30-60ms)

### Browser Compatibility
- **HTTP/2**: Required for >6 concurrent SSE streams
- **EventSource**: Native support in all modern browsers
- **AbortController**: Needed for cancellation

### Memory Management
- **Message limits**: Cap messages per agent (e.g., 100)
- **Cleanup on close**: Properly close SSE connections
- **Session timeout**: Clear stale sessions after 30min idle

### Error Handling
- **Connection retry**: Exponential backoff for failed connections
- **Partial failure**: One agent failing doesn't affect others
- **Graceful degradation**: Fall back to single chat if issues

---

## File Structure Summary

```
thebridge/
├── types/
│   └── views.ts                    # New - view mode types
├── contexts/
│   ├── RoleContext.tsx             # Existing
│   └── MultiAgentContext.tsx       # New - multi-agent state
├── components/
│   ├── MultiAgentGrid.tsx          # New - grid container
│   ├── agents/
│   │   ├── AgentCard.tsx           # New - individual agent card
│   │   ├── AgentCardHeader.tsx     # New - status header
│   │   └── AgentCardInput.tsx      # New - input area
│   └── ChatInterface.tsx           # Modified - can shrink
├── hooks/
│   └── useMultiAgentStreams.ts     # New - concurrent streaming
├── lib/
│   ├── agents/
│   │   ├── configs.ts              # Existing
│   │   └── sessionManager.ts       # New - session tracking
│   └── theme/
│       └── motion.ts               # Modified - add grid animations
├── app/
│   ├── page.tsx                    # Modified - multi-view support
│   └── api/
│       └── agents/
│           └── [agentId]/
│               └── chat/
│                   └── route.ts    # Modified - add heartbeat/status
└── docs/
    └── MULTI_AGENT_VIEW_PLAN.md    # This file
```

---

## Success Metrics

1. **Concurrent Streaming**: 6 agents streaming simultaneously without lag
2. **Transition Smoothness**: 60fps during view transitions
3. **Response Time**: <100ms to show user input, <300ms first token
4. **Memory Usage**: <500MB with 6 active agents
5. **Accessibility**: Full keyboard navigation, screen reader support

---

## Questions for Clarification

1. **Maximum agents**: Should we cap at 6, or allow infinite rows with scrolling?
2. **Persistence**: Should agent positions persist across page refreshes?
3. **Drag reorder**: Priority for drag-to-reorder agents in grid?
4. **Mobile**: Collapse to 1 or 2 columns on mobile?
5. **Expand mode**: Allow expanding a single agent to full-width temporarily?

---

## Sources & References

- [SSE Streaming for LLM Responses](https://upstash.com/blog/sse-streaming-llm-responses)
- [SSE vs WebSockets 2024](https://ably.com/blog/websockets-vs-sse)
- [Next.js 15 Streaming](https://hackernoon.com/streaming-in-nextjs-15-websockets-vs-server-sent-events)
- [AG-UI Protocol](https://www.copilotkit.ai/blog/ag-ui-protocol-bridging-agents-to-any-front-end)
- [Real-Time React Chat](https://www.rapidinnovation.io/post/how-to-build-a-real-time-chat-app-with-react)
