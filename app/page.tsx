'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useSearchParams } from 'next/navigation';
import ChatInterface, { ChatInterfaceHandle } from "@/components/ChatInterface";
import ToolsSidebar, { ALL_TOOL_IDS } from "@/components/ToolsSidebar";
import LearnSidebar from "@/components/LearnSidebar";
import LessonContent from "@/components/LessonContent";
import RadialFAB from "@/components/RadialFAB";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import MultiAgentGrid from "@/components/MultiAgentGrid";
import PromptEditorPanel from "@/components/PromptEditorPanel";
import ConversationList from "@/components/ConversationList";
import { LandingPage } from "@/components/LandingPage";
import { useMultiAgent } from "@/contexts/MultiAgentContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { useRole } from "@/contexts/RoleContext";
import type { OpenAgent } from "@/components/AgentPanelContainer";
import type { ViewMode } from "@/types/views";

export type SidebarMode = 'hidden' | 'mini' | 'full';

export default function Home() {
  // Auth state
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const isLoading = status === "loading";

  // URL params for mode switching from other pages
  const searchParams = useSearchParams();

  // Default all tools to enabled, will be updated from API
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set(ALL_TOOL_IDS));
  const [isLoadingMcpConfigs, setIsLoadingMcpConfigs] = useState(true);
  // Map tool slug to server ID for API calls
  const [toolSlugToServerId, setToolSlugToServerId] = useState<Map<string, string>>(new Map());
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
  // Conversation management
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(false);

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
  const showLearn = viewMode === 'learn';

  // Handle mode from URL params (e.g., from MCP settings page FAB)
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam && ['chat', 'dashboard', 'learn', 'multiagent'].includes(modeParam)) {
      setViewMode(modeParam as ViewMode);
      // Clean up URL after setting mode
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams, setViewMode]);

  // Load saved MCP configurations on mount
  useEffect(() => {
    const loadMcpConfigs = async () => {
      // Skip if not authenticated
      if (!isAuthenticated) {
        setIsLoadingMcpConfigs(false);
        return;
      }

      try {
        // Fetch both server definitions and user configs in parallel
        const [serversResponse, configsResponse] = await Promise.all([
          fetch('/api/mcp/servers'),
          fetch('/api/mcp/user-configs'),
        ]);

        // Build slug-to-ID mapping from server definitions
        const slugToIdMap = new Map<string, string>();
        if (serversResponse.ok) {
          const servers = await serversResponse.json();
          servers.forEach((server: { id: string; slug: string }) => {
            slugToIdMap.set(server.slug, server.id);
          });
          setToolSlugToServerId(slugToIdMap);
        }

        // Load user configs if available
        if (configsResponse.ok) {
          const configs = await configsResponse.json();

          // Create a set of enabled tools based on saved configs
          const savedEnabledTools = new Set<string>();

          // Add all tools that have isEnabled=true from configs
          configs.forEach((config: {
            serverId: string;
            isEnabled: boolean;
            server: { id: string; slug: string }
          }) => {
            if (config.isEnabled) {
              // Use server.slug as the tool ID (matches sidebar tool IDs)
              savedEnabledTools.add(config.server.slug);
            }
          });

          // If user has saved configs, use them; otherwise keep default (all enabled)
          if (configs.length > 0) {
            // For tools not in saved configs, default to enabled
            ALL_TOOL_IDS.forEach(toolId => {
              const hasConfig = configs.some((c: { server: { slug: string } }) => c.server.slug === toolId);
              if (!hasConfig) {
                savedEnabledTools.add(toolId);
              }
            });

            setEnabledTools(savedEnabledTools);
          }
        }
      } catch (error) {
        console.error('Failed to load MCP configs:', error);
        // Keep default state on error
      } finally {
        setIsLoadingMcpConfigs(false);
      }
    };

    loadMcpConfigs();
  }, [isAuthenticated]);

  const toggleTool = async (toolId: string) => {
    // Optimistically update UI
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });

    // Persist to backend if authenticated
    if (isAuthenticated) {
      try {
        // Get the server ID for this tool slug
        const serverId = toolSlugToServerId.get(toolId);

        if (!serverId) {
          console.warn(`No server ID found for tool: ${toolId}`);
          return;
        }

        const isEnabled = !enabledTools.has(toolId);
        const response = await fetch('/api/mcp/user-configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverId,
            isEnabled,
            config: {}, // Empty config object as required
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save config');
        }
      } catch (error) {
        console.error('Failed to save MCP config:', error);
        // Revert on error
        setEnabledTools((prev) => {
          const next = new Set(prev);
          if (next.has(toolId)) {
            next.delete(toolId);
          } else {
            next.add(toolId);
          }
          return next;
        });
      }
    }
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

  // Handle mode change from RadialFAB
  const handleModeChange = useCallback((mode: ViewMode) => {
    if (mode === 'dashboard') {
      // Reset dashboard to show radial launcher (no panels open)
      resetLauncher();
    }
    setViewMode(mode);
  }, [setViewMode, resetLauncher]);

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

  // Handle selecting a conversation from the list
  const handleSelectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    setViewMode('chat');
  }, [setViewMode]);

  // Handle starting a new conversation
  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    chatRef.current?.startNewConversation();
    setViewMode('chat');
  }, [setViewMode]);

  // Handle when a new conversation is created
  const handleConversationCreated = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  // Derive showDevTools for backward compatibility
  // Hide sidebar in dashboard mode since agents/MCPs aren't relevant there
  // In learn mode, we show LearnSidebar instead of ToolsSidebar
  const showDevTools = sidebarMode !== 'hidden' && !showDashboard && !showLearn;
  const showLearnSidebar = sidebarMode !== 'hidden' && showLearn;

  // Cycle through sidebar modes: hidden -> mini -> full -> hidden
  const cycleSidebarMode = useCallback(() => {
    setSidebarMode((prev) => {
      if (prev === 'hidden') return 'mini';
      if (prev === 'mini') return 'full';
      return 'hidden';
    });
  }, []);

  // Show loading spinner during auth check or MCP config loading
  if (isLoading || (isAuthenticated && isLoadingMcpConfigs)) {
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
      {/* Sidebar - ToolsSidebar or LearnSidebar based on mode, hidden in dashboard mode */}
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
        {showLearnSidebar && (
          <div className="h-full overflow-hidden">
            <LearnSidebar
              mode={sidebarMode}
              onToggleMode={cycleSidebarMode}
            />
          </div>
        )}
        {/* Expand button when sidebar is hidden in learn mode */}
        {showLearn && sidebarMode === 'hidden' && (
          <button
            onClick={cycleSidebarMode}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-r-lg bg-[var(--md-surface-container)] border border-l-0 border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)] transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-[var(--md-on-surface-variant)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
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
                conversationId={currentConversationId}
                onConversationCreated={handleConversationCreated}
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

          {/* Learn View - Lesson content display */}
          {showLearn && (
            <LessonContent />
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

      {/* Radial FAB - Mode switcher with radial expansion */}
      {/* Hidden when PromptEditorPanel is open */}
      {!(editingPromptAgentId !== null || isCreateMode) && (
        <RadialFAB
          currentMode={viewMode}
          onModeChange={handleModeChange}
        />
      )}

      {/* Conversation History Button - Only show in chat mode */}
      {showChat && !(editingPromptAgentId !== null || isCreateMode) && (
        <button
          onClick={() => setShowConversationList(true)}
          className={`
            fixed bottom-9 left-6 z-50
            w-14 h-14 rounded-full
            flex items-center justify-center
            transition-all duration-300 ease-out
            hover:scale-110 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-offset-2
            shadow-lg hover:shadow-xl
            bg-[var(--md-surface-container-high)] hover:bg-[var(--md-surface-container-highest)]
            border border-[var(--md-outline-variant)]
          `}
          style={{
            // @ts-expect-error CSS custom property for focus ring
            '--tw-ring-color': 'var(--md-accent)',
            '--tw-ring-offset-color': 'var(--md-surface)',
          }}
          aria-label="View conversation history"
          title="View conversation history"
        >
          <svg className="w-6 h-6 text-[var(--md-on-surface)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* Conversation List Panel */}
      <ConversationList
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isOpen={showConversationList}
        onClose={() => setShowConversationList(false)}
      />
    </div>
  );
}
