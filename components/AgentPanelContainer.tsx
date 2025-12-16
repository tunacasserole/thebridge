'use client';

import AgentChatPanel from './AgentChatPanel';

export interface OpenAgent {
  id: string;
  isMinimized: boolean;
}

interface AgentPanelContainerProps {
  openAgents: OpenAgent[];
  onCloseAgent: (agentId: string) => void;
  onToggleMinimize: (agentId: string) => void;
  onAgentActiveChange?: (agentId: string, isActive: boolean) => void;
}

export default function AgentPanelContainer({
  openAgents,
  onCloseAgent,
  onToggleMinimize,
  onAgentActiveChange,
}: AgentPanelContainerProps) {
  if (openAgents.length === 0) {
    return null;
  }

  return (
    <div className="w-80 flex-shrink-0 flex flex-col gap-2 p-2 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
          Agent Panels ({openAgents.length})
        </h3>
      </div>

      {/* Panels */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {openAgents.map((agent) => (
          <AgentChatPanel
            key={agent.id}
            agentId={agent.id}
            isMinimized={agent.isMinimized}
            onClose={() => onCloseAgent(agent.id)}
            onToggleMinimize={() => onToggleMinimize(agent.id)}
            onActiveChange={(isActive) => onAgentActiveChange?.(agent.id, isActive)}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div className="flex-shrink-0 px-2 py-1">
        <p className="text-[10px] text-[var(--md-on-surface-variant)] text-center opacity-60">
          Click agents in sidebar to open panels
        </p>
      </div>
    </div>
  );
}
