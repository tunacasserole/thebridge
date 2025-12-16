'use client';

import { useState, useCallback, useRef } from 'react';
import { useSession } from "next-auth/react";
import ChatInterface, { ChatInterfaceHandle } from "@/components/ChatInterface";
import ToolsSidebar, { ALL_TOOL_IDS } from "@/components/ToolsSidebar";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import MultiAgentGrid from "@/components/MultiAgentGrid";
import PromptEditorPanel from "@/components/PromptEditorPanel";
import { LandingPage } from "@/components/LandingPage";
import { useMultiAgent } from "@/contexts/MultiAgentContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { useRole } from "@/contexts/RoleContext";
import type { OpenAgent } from "@/components/AgentPanelContainer";

export type SidebarMode = 'hidden' | 'mini' | 'full';

export default function Home() {
  // Auth state
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const isLoading = status === "loading";

  // Default all tools to enabled
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set(ALL_TOOL_IDS));
  // Sidebar mode - hidden, mini (icons + abbreviated names), or full
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('full');
  // Track if the main agent is actively processing
  const [isAgentActive, setIsAgentActive] = useState(false);
  // Track which agents are actively processing (for status indicators)
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  // Ref to the chat interface for programmatic input
  const chatRef = useRef<ChatInterfaceHandle>(null);
  // Track which agent's prompt is being edited (null = panel closed)
  const [editingPromptAgentId, setEditingPromptAgentId] = useState<string | null>(null);
  // Track if we're in create mode for the panel
  const [isCreateMode, setIsCreateMode] = useState(false);
  // Key to trigger agent list refresh in sidebar
  const [agentRefreshKey, setAgentRefreshKey] = useState(0);

  // Get multi-agent context
  const {
    viewMode,
    setViewMode,
    gridAgents,
    spawnAgent,
  } = useMultiAgent();

  // Get dashboard context for resetting panels
  const { resetLauncher } = useDashboard();

  // Get current role for agent creation
  const { currentRole } = useRole();

  // Derive showChat from viewMode for backwards compatibility
  const showChat = viewMode === 'chat';
  const showDashboard = viewMode === 'dashboard';
  const showMultiAgent = viewMode === 'multiagent';

  const toggleTool = (toolId: string) => {
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  };

  // Handle clicking an agent in the sidebar
  const handleAgentClick = useCallback((agentId: string) => {
    // Before spawning a new agent, capture the main chat messages
    // so they can be preserved when transitioning to multi-agent view
    let messagesToPass: { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }[] | undefined;

    if (viewMode === 'chat' && agentId !== 'general' && chatRef.current) {
      const messages = chatRef.current.getMessages();
      if (messages.length > 0) {
        // Convert ChatInterface messages to AgentMessage format
        messagesToPass = messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          timestamp: msg.timestamp.getTime(),
        }));
      }
    }
    // Pass messages directly to spawnAgent to avoid async state timing issues
    spawnAgent(agentId, agentId === 'general', messagesToPass);
    // Collapse sidebar to mini mode when spawning an agent
    setSidebarMode('mini');
  }, [spawnAgent, viewMode]);

  // Track when an agent becomes active/inactive
  const handleAgentActiveChange = useCallback((agentId: string, isActive: boolean) => {
    setActiveAgents((prev) => {
      const next = new Set(prev);
      if (isActive) {
        next.add(agentId);
      } else {
        next.delete(agentId);
      }
      return next;
    });
  }, []);

  // Create openAgents array for sidebar compatibility
  const openAgents: OpenAgent[] = gridAgents.map(agent => ({
    id: agent.id,
    isMinimized: false,
  }));

  // Toggle between chat/dashboard
  const handleFabClick = useCallback(() => {
    if (showDashboard) {
      // Go back to previous view (chat or multiagent)
      setViewMode(gridAgents.length > 0 ? 'multiagent' : 'chat');
    } else {
      // Reset dashboard to show radial launcher (no panels open)
      resetLauncher();
      setViewMode('dashboard');
    }
  }, [showDashboard, gridAgents.length, setViewMode, resetLauncher]);

  // Handle opening prompt editor for existing agent
  const handleEditPrompt = useCallback((agentId: string) => {
    setEditingPromptAgentId(agentId);
    setIsCreateMode(false);
  }, []);

  // Handle opening panel in create mode (from sidebar plus button)
  const handleAddAgent = useCallback(() => {
    setEditingPromptAgentId(null);
    setIsCreateMode(true);
  }, []);

  // Handle closing the panel
  const handleClosePanel = useCallback(() => {
    setEditingPromptAgentId(null);
    setIsCreateMode(false);
  }, []);

  // Handle saving prompt (for now just logs - would need backend to persist)
  const handleSavePrompt = useCallback((agentId: string, prompt: string) => {
    console.log(`Saving prompt for agent ${agentId}:`, prompt);
    // TODO: Implement actual prompt persistence
    // This would require either:
    // 1. API call to update agent config
    // 2. Local storage for session-based overrides
    // 3. Database update for permanent changes
  }, []);

  // Handle creating a new agent via API
  const handleCreateAgent = useCallback(async (data: {
    slug: string;
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
  }) => {
    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        role: currentRole,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create agent');
    }

    // Successfully created - trigger sidebar agent list refresh
    setAgentRefreshKey(prev => prev + 1);
    console.log('Agent created successfully');
  }, [currentRole]);

  // Handle deleting an agent via API
  const handleDeleteAgent = useCallback(async (agentId: string) => {
    const response = await fetch(`/api/agents/${agentId}?role=${currentRole}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete agent');
    }

    // Successfully deleted - trigger sidebar agent list refresh
    setAgentRefreshKey(prev => prev + 1);
    console.log('Agent deleted successfully');
  }, [currentRole]);

  // Handle toggling agent visibility (hide/show)
  const handleToggleHidden = useCallback(async (agentId: string, isHidden: boolean) => {
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: currentRole,
        isHidden,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update agent visibility');
    }

    // Successfully updated - trigger sidebar agent list refresh
    setAgentRefreshKey(prev => prev + 1);
    console.log(`Agent ${isHidden ? 'hidden' : 'shown'} successfully`);
  }, [currentRole]);

  // Derive showDevTools for backward compatibility
  // Hide sidebar in dashboard mode since agents/MCPs aren't relevant there
  const showDevTools = sidebarMode !== 'hidden' && !showDashboard;

  // Cycle through sidebar modes: hidden -> mini -> full -> hidden
  const cycleSidebarMode = useCallback(() => {
    setSidebarMode((prev) => {
      if (prev === 'hidden') return 'mini';
      if (prev === 'mini') return 'full';
      return 'hidden';
    });
  }, []);

  // Show loading spinner during auth check
  if (isLoading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: 'var(--md-surface)' }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: 'var(--md-outline)',
            borderTopColor: 'var(--md-primary)',
          }}
        />
      </div>
    );
  }

  // Show landing page for logged-out users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Tools Sidebar - Fixed position within viewport, hidden in dashboard mode */}
      <aside
        className={`
          flex-shrink-0 transition-all duration-300 ease-out
          ${sidebarMode === 'hidden' || showDashboard ? 'w-0' : sidebarMode === 'mini' ? 'w-14' : 'w-64'}
        `}
      >
        {showDevTools && (
          <div className="h-full overflow-hidden">
            <ToolsSidebar
              enabledTools={enabledTools}
              onToggleTool={toggleTool}
              isAgentActive={isAgentActive}
              activeAgents={activeAgents}
              openAgents={openAgents}
              onAgentClick={handleAgentClick}
              onAddAgent={handleAddAgent}
              mode={sidebarMode}
              onToggleMode={cycleSidebarMode}
              agentRefreshKey={agentRefreshKey}
            />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Chat/Dashboard/MultiAgent Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Chat View - Single agent chat */}
          {showChat && (
            <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full px-4 sm:px-6">
              <ChatInterface
                ref={chatRef}
                enabledTools={Array.from(enabledTools)}
                onToggleTools={cycleSidebarMode}
                toolsOpen={showDevTools}
                onLoadingChange={setIsAgentActive}
              />
            </div>
          )}

          {/* Multi-Agent View - Grid of agent cards */}
          {showMultiAgent && (
            <div className="flex-1 overflow-y-auto">
              <MultiAgentGrid
                activeAgents={activeAgents}
                onAgentActiveChange={handleAgentActiveChange}
                onEditPrompt={handleEditPrompt}
              />
            </div>
          )}

          {/* Dashboard View - 2x3 Grid of Integration Panels */}
          {showDashboard && (
            <div className="flex-1 overflow-hidden">
              <DashboardGrid />
            </div>
          )}
        </div>
      </div>

      {/* Prompt Editor Panel - Slides in from right */}
      <PromptEditorPanel
        agentId={editingPromptAgentId}
        isOpen={editingPromptAgentId !== null || isCreateMode}
        isCreateMode={isCreateMode}
        onClose={handleClosePanel}
        onSave={handleSavePrompt}
        onCreateAgent={handleCreateAgent}
        onDelete={handleDeleteAgent}
        onToggleHidden={handleToggleHidden}
      />

      {/* FAB - Toggle between Dashboard and Chat/MultiAgent */}
      {/* Hidden when PromptEditorPanel is open */}
      {/* Orange when dashboard is showing, Yellow when chat is showing */}
      {!(editingPromptAgentId !== null || isCreateMode) && (
        <button
          onClick={handleFabClick}
          className={`
            fixed bottom-9 right-6 z-50
            w-14 h-14 rounded-full
            flex items-center justify-center
            transition-all duration-300 ease-out
            hover:scale-110 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-offset-2
            shadow-lg hover:shadow-xl
          `}
          style={{
            background: showDashboard
              ? 'linear-gradient(135deg, #f97316, #ea580c)' // Orange when in dashboard mode
              : 'linear-gradient(135deg, #fbbf24, #f59e0b)', // Yellow when in chat mode
            boxShadow: showDashboard
              ? '0 4px 20px rgba(249, 115, 22, 0.5), var(--elevation-3)'
              : '0 4px 20px rgba(251, 191, 36, 0.5), var(--elevation-3)',
            // @ts-expect-error CSS custom property for focus ring
            '--tw-ring-color': showDashboard
              ? 'rgba(249, 115, 22, 0.5)'
              : 'rgba(251, 191, 36, 0.5)',
            '--tw-ring-offset-color': 'var(--md-surface)',
          }}
          aria-label={showDashboard ? 'Switch to Chat' : 'Switch to Dashboard'}
          title={showDashboard ? 'Switch to Chat' : 'Switch to Dashboard'}
        >
          {!showDashboard ? (
            // Dashboard icon (grid)
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ) : (
            // Chat icon (message bubble)
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
