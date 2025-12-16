'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ToolDefinition, AgentDefinition, OpenAgent, ToolsSidebarProps, SidebarMode } from '@/components/sidebar/types';
import {
  MCP_TOOLS,
  coreTools,
  observabilityMcps,
  salesMarketingMcps,
  productivityMcps,
  getAgentsForRole,
  CORE_TOOL_IDS,
  ALL_TOOL_IDS,
} from '@/components/sidebar/toolsData';
import { useRole } from '@/contexts/RoleContext';

// Database agent type (from API)
interface DbAgent {
  id: string;
  slug: string;
  role: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  icon: string | null;
  isDefault: boolean;
  isHidden: boolean;
  sortOrder: number;
}

// Default icon for database agents
function DefaultAgentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

// Convert database agent to AgentDefinition
function dbAgentToDefinition(dbAgent: DbAgent): AgentDefinition {
  return {
    id: dbAgent.slug, // Use slug as ID for consistency
    name: dbAgent.name,
    description: dbAgent.description || '',
    accentColor: '#6366f1', // Default indigo color for custom agents
    icon: <DefaultAgentIcon />,
    // Custom agents are role-specific by design
  };
}

// Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

function ToggleSwitch({ enabled, onToggle }: ToggleSwitchProps) {
  return (
    <div
      onClick={onToggle}
      className="relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--md-surface)]"
      style={{
        backgroundColor: enabled ? '#fbbf24' : 'var(--md-outline)',
        // Brand yellow focus ring when enabled
        // @ts-expect-error CSS custom property
        '--tw-ring-color': enabled ? 'rgba(251, 191, 36, 0.5)' : 'var(--md-accent)',
      }}
      role="switch"
      aria-checked={enabled}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(e as unknown as React.MouseEvent);
        }
      }}
    >
      <span
        className={`
          inline-block h-3 w-3 transform rounded-full bg-[var(--md-surface-container-highest)] shadow ring-0 transition duration-200 ease-in-out
          ${enabled ? 'translate-x-3' : 'translate-x-0'}
        `}
      />
    </div>
  );
}

// New Relic Entity type
interface NewRelicEntity {
  guid: string;
  name: string;
  entityType: string;
  domain: string;
  alertSeverity?: string;
}

// New Relic Entity Selector Component
interface NewRelicEntitySelectorProps {
  selectedEntity: NewRelicEntity | null;
  onSelectEntity: (entity: NewRelicEntity | null) => void;
}

function NewRelicEntitySelector({ selectedEntity, onSelectEntity }: NewRelicEntitySelectorProps) {
  const [entities, setEntities] = useState<NewRelicEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch entities from API
  useEffect(() => {
    async function fetchEntities() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/newrelic/entities');
        if (!response.ok) {
          if (response.status === 503) {
            setError('New Relic not configured');
            return;
          }
          throw new Error('Failed to fetch entities');
        }
        const data = await response.json();
        if (data.success && data.data) {
          setEntities(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entities');
      } finally {
        setLoading(false);
      }
    }
    fetchEntities();
  }, []);

  // Filter entities by search query
  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group entities by type
  const groupedEntities = filteredEntities.reduce((acc, entity) => {
    const type = entity.entityType || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(entity);
    return acc;
  }, {} as Record<string, NewRelicEntity[]>);

  const getAlertColor = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ef4444';
      case 'WARNING': return '#f59e0b';
      case 'NOT_ALERTING': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="mb-4">
      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-2 block">
        Select Service / Entity
      </label>

      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={loading || !!error}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] hover:border-[var(--md-outline)] transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-2 min-w-0">
            {loading ? (
              <span className="text-sm text-[var(--md-on-surface-variant)]">Loading entities...</span>
            ) : error ? (
              <span className="text-sm text-[var(--md-error)]">{error}</span>
            ) : selectedEntity ? (
              <>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getAlertColor(selectedEntity.alertSeverity) }}
                />
                <span className="text-sm text-[var(--md-on-surface)] truncate">{selectedEntity.name}</span>
                <span className="text-xs text-[var(--md-on-surface-variant)] flex-shrink-0">({selectedEntity.entityType})</span>
              </>
            ) : (
              <span className="text-sm text-[var(--md-on-surface-variant)]">
                {entities.length > 0 ? 'Select an entity...' : 'No entities found'}
              </span>
            )}
          </div>
          <svg
            viewBox="0 0 24 24"
            className={`w-4 h-4 text-[var(--md-on-surface-variant)] flex-shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown */}
        {isDropdownOpen && entities.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] rounded-lg shadow-xl overflow-hidden"
            style={{ maxHeight: '300px' }}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-[var(--md-outline-variant)]">
              <input
                type="text"
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-md bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] placeholder-[var(--md-on-surface-variant)] border-none focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)]"
              />
            </div>

            {/* Entity List */}
            <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
              {/* Clear selection option */}
              {selectedEntity && (
                <button
                  onClick={() => {
                    onSelectEntity(null);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)] transition-colors border-b border-[var(--md-outline-variant)]"
                >
                  Clear selection
                </button>
              )}

              {Object.entries(groupedEntities).map(([type, typeEntities]) => (
                <div key={type}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-[var(--md-on-surface-variant)] bg-[var(--md-surface-container-high)] sticky top-0">
                    {type} ({typeEntities.length})
                  </div>
                  {typeEntities.map((entity) => (
                    <button
                      key={entity.guid}
                      onClick={() => {
                        onSelectEntity(entity);
                        setIsDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--md-surface-container-high)] transition-colors ${
                        selectedEntity?.guid === entity.guid ? 'bg-[var(--md-surface-container-highest)]' : ''
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getAlertColor(entity.alertSeverity) }}
                      />
                      <span className="text-sm text-[var(--md-on-surface)] truncate flex-1">{entity.name}</span>
                      {selectedEntity?.guid === entity.guid && (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--md-accent)]" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ))}

              {filteredEntities.length === 0 && searchQuery && (
                <div className="px-3 py-4 text-sm text-center text-[var(--md-on-surface-variant)]">
                  No entities match &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected entity details */}
      {selectedEntity && (
        <div className="mt-2 p-2 rounded-lg bg-[var(--md-surface-container-high)] text-xs">
          <div className="flex items-center gap-2 text-[var(--md-on-surface-variant)]">
            <span className="font-medium">Domain:</span>
            <span>{selectedEntity.domain}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--md-on-surface-variant)] mt-1">
            <span className="font-medium">GUID:</span>
            <span className="font-mono truncate">{selectedEntity.guid}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// MCP Detail Panel Component
interface McpDetailPanelProps {
  mcpId: string;
  mcpName: string;
  mcpDescription: string;
  isEnabled: boolean;
  isOpen: boolean;
  onClose: () => void;
}

function McpDetailPanel({ mcpId, mcpName, mcpDescription, isEnabled, isOpen, onClose }: McpDetailPanelProps) {
  const tools = MCP_TOOLS[mcpId] || [];
  const [selectedEntity, setSelectedEntity] = useState<NewRelicEntity | null>(null);
  const isNewRelic = mcpId === 'newrelic';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          background: 'color-mix(in srgb, var(--md-shadow) 40%, transparent)',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[400px] z-[9999]
          bg-[var(--md-surface-container)]
          shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--md-outline-variant)]"
          style={{
            background: 'linear-gradient(to right, color-mix(in srgb, var(--md-accent) 10%, transparent), color-mix(in srgb, var(--md-accent) 15%, transparent))',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-[var(--md-on-surface)]">
                  {mcpName}
                </h2>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={isEnabled
                    ? { backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }
                    : { backgroundColor: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }
                  }
                >
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-sm text-[var(--md-on-surface-variant)]">
                {mcpDescription}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {/* New Relic Entity Selector */}
            {isNewRelic && (
              <NewRelicEntitySelector
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
              />
            )}

            {/* Tools List */}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-3">
              Available Tools ({tools.length})
            </h3>
            <div className="space-y-2">
              {tools.map((tool, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-[var(--md-surface-container-high)] hover:bg-[var(--md-surface-container-highest)] transition-colors duration-150"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--md-accent)] mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-medium text-[var(--md-on-surface)] break-all">
                        {tool.name}
                      </p>
                      <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 h-1"
          style={{
            background: 'linear-gradient(to right, var(--md-accent), color-mix(in srgb, var(--md-accent) 80%, var(--md-primary)), var(--md-accent))',
          }}
        />
      </div>
    </>
  );
}

interface ToolButtonProps {
  tool: ToolDefinition;
  isEnabled: boolean;
  onToggle: () => void;
  isMcp?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function ToolButton({ tool, isEnabled, onToggle, isMcp = false, onClick }: ToolButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    } else {
      onToggle();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left relative
        hover:bg-[var(--md-surface-container-high)]
        ${isEnabled
          ? 'bg-[var(--md-surface-container)]'
          : 'opacity-60 hover:opacity-100'
        }
      `}
      {...(!isMcp && { title: `${isEnabled ? 'Disable' : 'Enable'} ${tool.name}` })}
    >
      {/* Icon */}
      <div
        className={`
          flex items-center justify-center w-9 h-9 rounded-lg transition-colors
          ${isEnabled
            ? 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]'
            : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] group-hover:bg-[var(--md-surface-container-high)]'
          }
        `}
      >
        {tool.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`
            text-sm font-medium truncate
            ${isEnabled
              ? 'text-[var(--md-on-surface)]'
              : 'text-[var(--md-on-surface-variant)]'
            }
          `}
        >
          {tool.name}
        </p>
        <p
          className={`
            text-[11px] truncate
            ${isEnabled
              ? 'text-[var(--md-on-surface-variant)]'
              : 'text-[var(--md-on-surface-variant)] opacity-70'
            }
          `}
        >
          {tool.description}
        </p>
      </div>

      {/* Toggle Switch for MCP, Status Indicator for others */}
      {isMcp ? (
        <div onClick={(e) => e.stopPropagation()}>
          <ToggleSwitch enabled={isEnabled} onToggle={onToggle} />
        </div>
      ) : (
        <div
          className={`
            w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors
            ${isEnabled
              ? 'bg-[var(--md-success)] animate-pulse'
              : 'bg-[var(--md-outline)] group-hover:bg-[var(--md-outline-variant)]'
            }
          `}
        />
      )}
    </button>
  );
}

// MCP Tool Item with panel
interface McpToolItemProps {
  tool: ToolDefinition;
  isEnabled: boolean;
  onToggle: () => void;
  isPanelOpen: boolean;
  onPanelOpen: () => void;
  onPanelClose: () => void;
}

function McpToolItem({ tool, isEnabled, onToggle, isPanelOpen, onPanelOpen, onPanelClose }: McpToolItemProps) {
  const handleButtonClick = (e: React.MouseEvent) => {
    // Don't open panel if clicking on the toggle switch (it has stopPropagation)
    onPanelOpen();
  };

  return (
    <>
      <ToolButton
        tool={tool}
        isEnabled={isEnabled}
        onToggle={onToggle}
        isMcp={true}
        onClick={handleButtonClick}
      />
      <McpDetailPanel
        mcpId={tool.id}
        mcpName={tool.name}
        mcpDescription={tool.description}
        isEnabled={isEnabled}
        isOpen={isPanelOpen}
        onClose={onPanelClose}
      />
    </>
  );
}

// Agent Button Component
interface AgentButtonProps {
  agent: AgentDefinition;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}

function AgentButton({ agent, isOpen, isActive, onClick }: AgentButtonProps) {
  const isHighlighted = isOpen || isActive;

  return (
    <button
      onClick={onClick}
      className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left relative border hover:bg-[var(--md-surface-container-high)]"
      style={{
        backgroundColor: isHighlighted ? 'rgba(251, 191, 36, 0.08)' : 'var(--md-surface-container)',
        borderColor: isHighlighted ? 'rgba(251, 191, 36, 0.4)' : 'transparent',
        boxShadow: isHighlighted ? '0 0 12px rgba(251, 191, 36, 0.15)' : 'none',
      }}
      title={`Open ${agent.name} chat panel`}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] group-hover:bg-[var(--md-surface-container-highest)]"
      >
        {agent.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-[var(--md-on-surface-variant)]">
          {agent.name}
        </p>
        <p
          className="text-[10px] truncate"
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          {agent.description}
        </p>
      </div>

      {/* Status indicator dot - only shown when active (yellow/orange brand color) */}
      {/* mr-0.5 aligns with section chevrons and footer toggle */}
      {isHighlighted && (
        <div
          style={{
            backgroundColor: '#fbbf24', // Brand yellow
            ...(isActive ? {
              boxShadow: '0 0 8px 2px rgba(251, 191, 36, 0.6)',
            } : {}),
          }}
          className={`
            w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-200 mr-0.5
            ${isActive ? 'animate-flash' : ''}
          `}
        />
      )}
    </button>
  );
}

// Helper to abbreviate name: "Incident Commander" -> "IC"
function abbreviateName(name: string): string {
  return name
    .split(/\s+/)
    .map(word => word[0]?.toUpperCase() || '')
    .join('');
}

export default function ToolsSidebar({
  enabledTools,
  onToggleTool,
  isAgentActive = false,
  activeAgents = new Set(),
  openAgents = [],
  onAgentClick,
  onAddAgent,
  mode = 'full',
  onToggleMode,
  agentRefreshKey = 0,
}: ToolsSidebarProps) {
  const { currentRole } = useRole();
  const enabledCount = enabledTools.size;
  const [agentsExpanded, setAgentsExpanded] = useState(true);
  const [observabilityMcpsExpanded, setObservabilityMcpsExpanded] = useState(false);
  const [salesMarketingMcpsExpanded, setSalesMarketingMcpsExpanded] = useState(false);
  const [productivityMcpsExpanded, setProductivityMcpsExpanded] = useState(false);
  const [openPanelMcpId, setOpenPanelMcpId] = useState<string | null>(null);
  const [agentToolsExpanded, setAgentToolsExpanded] = useState(false);
  const isMiniMode = mode === 'mini';

  // State for custom agents from database
  const [customAgents, setCustomAgents] = useState<AgentDefinition[]>([]);

  // Fetch custom agents from database
  const fetchCustomAgents = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents?role=${currentRole}`);
      if (response.ok) {
        const dbAgents: DbAgent[] = await response.json();
        setCustomAgents(dbAgents.map(dbAgentToDefinition));
      }
    } catch (error) {
      console.error('Failed to fetch custom agents:', error);
    }
  }, [currentRole]);

  // Fetch agents when role changes or refresh key changes
  useEffect(() => {
    fetchCustomAgents();
  }, [fetchCustomAgents, agentRefreshKey]);

  // Filter static agents by current role and merge with custom agents
  const filteredAgents = useMemo(() => {
    const staticAgents = getAgentsForRole(currentRole);
    const staticAgentIds = new Set(staticAgents.map(a => a.id));
    // Filter out any custom agents that have the same ID as static agents to avoid duplicates
    const uniqueCustomAgents = customAgents.filter(a => !staticAgentIds.has(a.id));
    // Custom agents come after static agents
    return [...staticAgents, ...uniqueCustomAgents];
  }, [currentRole, customAgents]);

  return (
    <aside className={`${isMiniMode ? 'w-14' : 'w-64'} h-full flex-shrink-0 border-r border-[var(--md-outline-variant)] bg-[var(--md-surface)] flex flex-col overflow-hidden relative transition-all duration-300`}>
      <div className={`${isMiniMode ? 'p-1' : 'p-3'} flex-1 space-y-4 overflow-y-auto`}>
        {/* Agents Section - at top */}
        <div>
          {!isMiniMode && (
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setAgentsExpanded(!agentsExpanded)}
                className="flex items-center gap-1 group hover:bg-[var(--md-surface-container)] rounded px-1 py-0.5 transition-colors"
              >
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                  Agents
                </h2>
                <svg
                  viewBox="0 0 24 24"
                  className={`w-3 h-3 text-[var(--md-on-surface-variant)] transition-transform duration-200 ${
                    agentsExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {/* Add Agent Button - opens create panel */}
              <button
                onClick={onAddAgent}
                className="p-1 rounded transition-colors hover:bg-[var(--md-surface-container-high)]"
                title="Create new agent"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 text-[var(--md-on-surface-variant)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          )}
          <div
            className={`space-y-0.5 transition-all duration-200 overflow-hidden ${
              !isMiniMode && agentsExpanded ? 'opacity-100 max-h-[2000px]' : isMiniMode ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'
            }`}
          >
            {filteredAgents.map((agent) => {
              const isOpen = openAgents.some(a => a.id === agent.id);
              const isActive = activeAgents.has(agent.id);

              const isHighlighted = isOpen || isActive;

              return isMiniMode ? (
                // Mini mode: icon only (larger, in a circle)
                <button
                  key={agent.id}
                  onClick={() => onAgentClick?.(agent.id)}
                  className="w-full flex items-center justify-center p-1.5 rounded-lg transition-all duration-200 hover:bg-[var(--md-surface-container)]"
                  style={{
                    backgroundColor: isHighlighted ? 'rgba(251, 191, 36, 0.08)' : 'transparent',
                    boxShadow: isHighlighted ? '0 0 8px rgba(251, 191, 36, 0.2)' : 'none',
                  }}
                  title={agent.name}
                >
                  <div className="relative">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full transition-colors [&>svg]:w-5 [&>svg]:h-5"
                      style={{
                        background: 'var(--md-surface-container-high)',
                        color: 'var(--md-on-surface-variant)',
                        border: isHighlighted ? '1.5px solid rgba(251, 191, 36, 0.5)' : '1.5px solid transparent',
                      }}
                    >
                      {agent.icon}
                    </div>
                    {/* Status indicator dot - only shown when active (yellow/orange brand color) */}
                    {isHighlighted && (
                      <div
                        className={`
                          absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--md-surface)] transition-all duration-200
                          ${isActive ? 'animate-flash' : ''}
                        `}
                        style={{
                          backgroundColor: '#fbbf24', // Brand yellow
                          ...(isActive ? {
                            boxShadow: '0 0 6px 1px rgba(251, 191, 36, 0.6)',
                          } : {}),
                        }}
                      />
                    )}
                  </div>
                </button>
              ) : (
                <AgentButton
                  key={agent.id}
                  agent={agent}
                  isOpen={isOpen}
                  isActive={isActive}
                  onClick={() => onAgentClick?.(agent.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Only show these sections in full mode */}
        {!isMiniMode && (
          <>
            {/* Divider */}
            <div className="border-t border-[var(--md-outline-variant)]" />

            {/* Observability MCPs Section */}
            <div>
              <button
                onClick={() => setObservabilityMcpsExpanded(!observabilityMcpsExpanded)}
                className="flex items-center justify-between mb-2 w-full group hover:bg-[var(--md-surface-container)] rounded px-1 pr-3.5 py-0.5 transition-colors"
              >
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                  Observability MCPs
                </h2>
                <svg
                  viewBox="0 0 24 24"
                  className={`w-3 h-3 text-[var(--md-on-surface-variant)] transition-transform duration-200 ${
                    observabilityMcpsExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                className={`space-y-1 transition-all duration-200 overflow-hidden ${
                  observabilityMcpsExpanded ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'
                }`}
              >
                {observabilityMcps.map((tool) => (
                  <McpToolItem
                    key={tool.id}
                    tool={tool}
                    isEnabled={enabledTools.has(tool.id)}
                    onToggle={() => onToggleTool(tool.id)}
                    isPanelOpen={openPanelMcpId === tool.id}
                    onPanelOpen={() => setOpenPanelMcpId(tool.id)}
                    onPanelClose={() => setOpenPanelMcpId(null)}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--md-outline-variant)]" />

            {/* Productivity MCPs Section */}
            <div>
              <button
                onClick={() => setProductivityMcpsExpanded(!productivityMcpsExpanded)}
                className="flex items-center justify-between mb-2 w-full group hover:bg-[var(--md-surface-container)] rounded px-1 pr-3.5 py-0.5 transition-colors"
              >
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                  Productivity MCPs
                </h2>
                <svg
                  viewBox="0 0 24 24"
                  className={`w-3 h-3 text-[var(--md-on-surface-variant)] transition-transform duration-200 ${
                    productivityMcpsExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                className={`space-y-1 transition-all duration-200 overflow-hidden ${
                  productivityMcpsExpanded ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'
                }`}
              >
                {productivityMcps.map((tool) => (
                  <McpToolItem
                    key={tool.id}
                    tool={tool}
                    isEnabled={enabledTools.has(tool.id)}
                    onToggle={() => onToggleTool(tool.id)}
                    isPanelOpen={openPanelMcpId === tool.id}
                    onPanelOpen={() => setOpenPanelMcpId(tool.id)}
                    onPanelClose={() => setOpenPanelMcpId(null)}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--md-outline-variant)]" />

            {/* Sales & Marketing MCPs Section */}
            <div>
              <button
                onClick={() => setSalesMarketingMcpsExpanded(!salesMarketingMcpsExpanded)}
                className="flex items-center justify-between mb-2 w-full group hover:bg-[var(--md-surface-container)] rounded px-1 pr-3.5 py-0.5 transition-colors"
              >
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                  Sales & Marketing MCPs
                </h2>
                <svg
                  viewBox="0 0 24 24"
                  className={`w-3 h-3 text-[var(--md-on-surface-variant)] transition-transform duration-200 ${
                    salesMarketingMcpsExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                className={`space-y-1 transition-all duration-200 overflow-hidden ${
                  salesMarketingMcpsExpanded ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'
                }`}
              >
                {salesMarketingMcps.map((tool) => (
                  <McpToolItem
                    key={tool.id}
                    tool={tool}
                    isEnabled={enabledTools.has(tool.id)}
                    onToggle={() => onToggleTool(tool.id)}
                    isPanelOpen={openPanelMcpId === tool.id}
                    onPanelOpen={() => setOpenPanelMcpId(tool.id)}
                    onPanelClose={() => setOpenPanelMcpId(null)}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--md-outline-variant)]" />

            {/* Tools Section - at bottom */}
            <div>
              <button
                onClick={() => setAgentToolsExpanded(!agentToolsExpanded)}
                className="flex items-center justify-between mb-2 w-full group hover:bg-[var(--md-surface-container)] rounded px-1 pr-3.5 py-0.5 transition-colors"
              >
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                  Tools
                </h2>
                <svg
                  viewBox="0 0 24 24"
                  className={`w-3 h-3 text-[var(--md-on-surface-variant)] transition-transform duration-200 ${
                    agentToolsExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                className={`space-y-1 transition-all duration-200 overflow-hidden ${
                  agentToolsExpanded ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'
                }`}
              >
                {coreTools.map((tool) => (
                  <ToolButton
                    key={tool.id}
                    tool={tool}
                    isEnabled={enabledTools.has(tool.id)}
                    onToggle={() => onToggleTool(tool.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer with toggle button */}
      <div className={`flex-shrink-0 border-t border-[var(--md-outline-variant)] ${isMiniMode ? 'p-2' : 'px-3 py-2'}`}>
        <div className={`flex items-center ${isMiniMode ? 'justify-center' : 'justify-between'}`}>
          {!isMiniMode && enabledCount > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--md-accent) 15%, transparent)',
                color: 'var(--md-accent)',
              }}
            >
              {enabledCount} tools active
            </span>
          )}
          {/* Toggle Button */}
          <button
            onClick={onToggleMode}
            className={`
              flex items-center justify-center rounded-lg transition-colors
              hover:bg-[var(--md-surface-container-high)]
              ${isMiniMode ? 'w-full h-8' : 'w-8 h-8'}
            `}
            title={isMiniMode ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-4 h-4 text-[var(--md-on-surface-variant)] transition-transform duration-300 ${
                isMiniMode ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

    </aside>
  );
}

// Re-export for backward compatibility
export { CORE_TOOL_IDS, ALL_TOOL_IDS } from '@/components/sidebar/toolsData';
