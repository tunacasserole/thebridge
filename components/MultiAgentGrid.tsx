'use client';

/**
 * MultiAgentGrid Component
 *
 * Main grid container for multi-agent view.
 * Renders AgentCard components in a responsive CSS Grid layout.
 * Supports drag-to-reorder functionality.
 */

import React from 'react';
import { useMultiAgent } from '@/contexts/MultiAgentContext';
import AgentCard from '@/components/agents/AgentCard';
import useDragReorder from '@/hooks/useDragReorder';

interface MultiAgentGridProps {
  className?: string;
  activeAgents?: Set<string>;
  onAgentActiveChange?: (agentId: string, isActive: boolean) => void;
  onEditPrompt?: (agentId: string) => void;
}

export default function MultiAgentGrid({
  className = '',
  activeAgents = new Set(),
  onAgentActiveChange,
  onEditPrompt,
}: MultiAgentGridProps) {
  const {
    gridAgents,
    expandedAgentId,
    focusedAgentId,
    closeAgent,
    expandAgent,
    focusAgent,
    reorderAgents,
  } = useMultiAgent();

  // Drag-to-reorder functionality
  const { dragState, getDragHandleProps, getDropTargetProps } = useDragReorder({
    onReorder: reorderAgents,
    itemCount: gridAgents.length,
  });

  // Empty state
  if (gridAgents.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-full ${className}`}
        data-multi-agent-grid="empty"
      >
        <div className="text-center max-w-md px-6">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-[var(--md-on-surface-variant)] opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--md-on-surface)] mb-2">
            No Active Agents
          </h3>
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            Deploy an agent from the sidebar to get started with multi-agent orchestration.
          </p>
        </div>
      </div>
    );
  }

  // Expanded mode - show single agent full width
  if (expandedAgentId) {
    const expandedAgent = gridAgents.find((a) => a.id === expandedAgentId);

    if (expandedAgent) {
      return (
        <div
          className={`h-full p-4 ${className}`}
          data-multi-agent-grid="expanded"
          data-expanded-agent={expandedAgentId}
        >
          <AgentCard
            agentId={expandedAgent.id}
            position={{ row: expandedAgent.row, col: expandedAgent.col }}
            isGeneralAgent={expandedAgent.isGeneralAgent}
            isActive={activeAgents.has(expandedAgent.id)}
            isFocused={true}
            isExpanded={true}
            initialMessages={expandedAgent.messages}
            modelOverride={expandedAgent.isGeneralAgent ? 'haiku' : undefined}
            onClose={() => closeAgent(expandedAgent.id)}
            onFocus={() => {}}
            onExpand={() => expandAgent(null)}
            onActiveChange={(isActive) => onAgentActiveChange?.(expandedAgent.id, isActive)}
            onEditPrompt={onEditPrompt ? () => onEditPrompt(expandedAgent.id) : undefined}
          />
        </div>
      );
    }
  }

  // Grid mode - show all agents in grid layout
  return (
    <div
      className={`
        multi-agent-grid
        grid
        grid-cols-3
        gap-4
        p-4
        min-h-full
        ${className}
      `}
      data-multi-agent-grid="grid"
      data-agent-count={gridAgents.length}
      data-is-dragging={dragState.isDragging}
      style={{
        backgroundColor: 'var(--md-surface)',
      }}
    >
      {gridAgents.map((agent, index) => {
        const dropTargetProps = getDropTargetProps(index);
        const isDropTarget = dropTargetProps['data-drop-active'];
        const isDraggedItem = dragState.draggedId === agent.id;

        return (
          <div
            key={agent.id}
            data-agent-drop-zone="true"
            data-agent-position={`${agent.row}-${agent.col}`}
            className={`
              min-h-[300px] max-h-[500px]
              transition-all duration-200
              ${isDropTarget ? 'scale-105 ring-2 ring-[var(--md-primary)] ring-offset-2' : ''}
              ${isDraggedItem ? 'opacity-50 scale-95' : ''}
            `}
            {...dropTargetProps}
          >
            <AgentCard
              agentId={agent.id}
              position={{ row: agent.row, col: agent.col }}
              isGeneralAgent={agent.isGeneralAgent}
              isActive={activeAgents.has(agent.id)}
              isFocused={focusedAgentId === agent.id}
              isExpanded={false}
              isDragging={isDraggedItem}
              dragHandleProps={getDragHandleProps(agent.id, index)}
              initialMessages={agent.messages}
              modelOverride={agent.isGeneralAgent ? 'haiku' : undefined}
              onClose={() => closeAgent(agent.id)}
              onFocus={() => focusAgent(agent.id)}
              onExpand={() => expandAgent(agent.id)}
              onActiveChange={(isActive) => onAgentActiveChange?.(agent.id, isActive)}
              onEditPrompt={onEditPrompt ? () => onEditPrompt(agent.id) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
