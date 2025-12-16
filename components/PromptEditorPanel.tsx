'use client';

import { useState, useEffect } from 'react';
import { AGENT_CONFIGS } from '@/lib/agents/configs';
import { useRole } from '@/contexts/RoleContext';

interface AgentFormData {
  slug: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
}

// Type for database agent
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

// Sparkle icon component with optional animation
function SparkleIcon({ className = '', animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} ${animate ? 'animate-pulse' : ''}`}
      fill="currentColor"
    >
      {/* Main sparkle */}
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
      {/* Small sparkle top-right */}
      <path d="M19 0L19.75 2.25L22 3L19.75 3.75L19 6L18.25 3.75L16 3L18.25 2.25L19 0Z" opacity="0.6" />
      {/* Small sparkle bottom-left */}
      <path d="M5 16L5.5 17.5L7 18L5.5 18.5L5 20L4.5 18.5L3 18L4.5 17.5L5 16Z" opacity="0.6" />
    </svg>
  );
}

interface PromptEditorPanelProps {
  agentId: string | null; // null for create mode, agent ID for edit mode
  isOpen: boolean;
  isCreateMode?: boolean; // true for new agent, false for editing existing
  onClose: () => void;
  onSave: (agentId: string, prompt: string) => void;
  onCreateAgent?: (data: AgentFormData) => Promise<void>;
  onDelete?: (agentId: string) => Promise<void>; // Delete agent callback (custom agents only)
  onToggleHidden?: (agentId: string, isHidden: boolean) => Promise<void>; // Hide/show agent callback
}

const DEFAULT_ACCENT_COLOR = '#6366f1';

const ICON_OPTIONS = [
  { id: 'assistant', label: 'Assistant', icon: '🤖' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'data_usage', label: 'Data', icon: '📊' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'code', label: 'Code', icon: '💻' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'build', label: 'Build', icon: '🔧' },
  { id: 'bug_report', label: 'Bug', icon: '🐛' },
];

export default function PromptEditorPanel({
  agentId,
  isOpen,
  isCreateMode = false,
  onClose,
  onSave,
  onCreateAgent,
  onDelete,
  onToggleHidden,
}: PromptEditorPanelProps) {
  const { currentRole } = useRole();
  const [editedPrompt, setEditedPrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTogglingHidden, setIsTogglingHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbAgent, setDbAgent] = useState<DbAgent | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);

  // Form fields for create mode
  const [formData, setFormData] = useState<AgentFormData>({
    slug: '',
    name: '',
    description: '',
    systemPrompt: '',
    icon: 'assistant',
  });

  // Check built-in configs first
  const agentConfig = agentId && !isCreateMode ? AGENT_CONFIGS[agentId] : null;
  // Use DB agent if no built-in config exists
  const effectiveAgent = agentConfig || dbAgent;
  const accentColor = agentConfig?.accentColor || DEFAULT_ACCENT_COLOR;
  // Built-in agents cannot be deleted; DB agents can be deleted if they're not marked as default
  const canDelete = !agentConfig && dbAgent && !dbAgent.isDefault;

  // Fetch DB agent when agentId exists but no built-in config
  useEffect(() => {
    if (isOpen && agentId && !isCreateMode && !agentConfig) {
      setIsLoadingAgent(true);
      fetch(`/api/agents/${agentId}?role=${currentRole}`)
        .then(res => res.ok ? res.json() : null)
        .then(agent => {
          setDbAgent(agent);
          if (agent) {
            setEditedPrompt(agent.systemPrompt);
          }
          setHasChanges(false);
        })
        .catch(() => setDbAgent(null))
        .finally(() => setIsLoadingAgent(false));
    } else if (!isOpen) {
      setDbAgent(null);
    }
  }, [isOpen, agentId, isCreateMode, agentConfig, currentRole]);

  // Reset form when panel opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setShowDeleteConfirm(false);
      if (isCreateMode) {
        setFormData({
          slug: '',
          name: '',
          description: '',
          systemPrompt: '',
          icon: 'assistant',
        });
        setHasChanges(false);
      } else if (agentConfig) {
        setEditedPrompt(agentConfig.systemPrompt);
        setHasChanges(false);
      }
      // Note: DB agent prompt is set in the fetch effect above
    }
  }, [isOpen, isCreateMode, agentId, agentConfig]);

  const handlePromptChange = (value: string) => {
    if (isCreateMode) {
      setFormData(prev => ({ ...prev, systemPrompt: value }));
      setHasChanges(true);
    } else {
      setEditedPrompt(value);
      setHasChanges(value !== agentConfig?.systemPrompt);
    }
  };

  const handleFormChange = (field: keyof AgentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setError(null);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData(prev => ({ ...prev, name, slug }));
    setHasChanges(true);
    setError(null);
  };

  const handleSave = () => {
    if (agentId && hasChanges && !isCreateMode) {
      onSave(agentId, editedPrompt);
      setHasChanges(false);
    }
  };

  const handleCreate = async () => {
    if (!onCreateAgent) return;

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!formData.systemPrompt.trim()) {
      setError('System prompt is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreateAgent(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isCreateMode) {
      setFormData({
        slug: '',
        name: '',
        description: '',
        systemPrompt: '',
        icon: 'assistant',
      });
      setHasChanges(false);
    } else if (agentConfig) {
      setEditedPrompt(agentConfig.systemPrompt);
      setHasChanges(false);
    }
  };

  // Improve prompt with AI
  const handleImprovePrompt = async () => {
    const currentPrompt = isCreateMode ? formData.systemPrompt : editedPrompt;

    if (!currentPrompt.trim()) {
      setError('Please enter a prompt to improve');
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      const response = await fetch('/api/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          agentName: isCreateMode ? formData.name : agentConfig?.name,
          agentDescription: isCreateMode ? formData.description : agentConfig?.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to improve prompt');
      }

      const { improvedPrompt } = await response.json();

      // Update the prompt
      if (isCreateMode) {
        setFormData(prev => ({ ...prev, systemPrompt: improvedPrompt }));
      } else {
        setEditedPrompt(improvedPrompt);
      }
      setHasChanges(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve prompt');
    } finally {
      setIsImproving(false);
    }
  };

  // Delete agent handler
  const handleDelete = async () => {
    if (!agentId || !onDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(agentId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle visibility handler
  const handleToggleHidden = async () => {
    if (!agentId || !onToggleHidden || !dbAgent) return;

    setIsTogglingHidden(true);
    setError(null);

    try {
      await onToggleHidden(agentId, !dbAgent.isHidden);
      // Update local state to reflect the change
      setDbAgent(prev => prev ? { ...prev, isHidden: !prev.isHidden } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent visibility');
    } finally {
      setIsTogglingHidden(false);
    }
  };

  const isFormValid = isCreateMode
    ? formData.name.trim() && formData.slug.trim() && formData.systemPrompt.trim()
    : hasChanges;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`
          fixed inset-0 bg-black/30 z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Panel - wider for comfortable prompt editing */}
      <div
        className={`
          fixed right-0 top-0 h-full w-[40rem] z-50
          flex flex-col bg-[var(--md-surface)] border-l border-[var(--md-outline-variant)]
          shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-[var(--md-outline-variant)]"
          style={{
            background: `linear-gradient(to right, color-mix(in srgb, ${accentColor} 15%, transparent), transparent)`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <h2 className="text-sm font-semibold text-[var(--md-on-surface)]">
              {isCreateMode ? 'Create New Agent' : `${agentConfig?.name || dbAgent?.name || 'Agent'} Prompt`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors"
            title="Close"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-[var(--md-on-surface-variant)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-[var(--md-error-container)] border-b border-[var(--md-error)]">
            <p className="text-xs text-[var(--md-on-error-container)]">{error}</p>
          </div>
        )}

        {isCreateMode ? (
          // Create Mode Form
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Role indicator */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--md-surface-container)]">
                <span className="text-xs text-[var(--md-on-surface-variant)]">Creating agent for role:</span>
                <span className="text-xs font-medium text-[var(--md-accent)] uppercase">{currentRole}</span>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)] mb-1 block">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Log Analyzer"
                  className="w-full px-3 py-2 rounded-lg text-sm
                    bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                    border border-[var(--md-outline-variant)]
                    focus:outline-none focus:ring-2 focus:border-transparent
                    placeholder:text-[var(--md-on-surface-variant)]"
                  style={{
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': accentColor,
                  }}
                />
              </div>

              {/* Slug (auto-generated, editable) */}
              <div>
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)] mb-1 block">
                  Slug * <span className="text-[10px] opacity-60">(auto-generated from name)</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleFormChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="e.g., log-analyzer"
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono
                    bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                    border border-[var(--md-outline-variant)]
                    focus:outline-none focus:ring-2 focus:border-transparent
                    placeholder:text-[var(--md-on-surface-variant)]"
                  style={{
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': accentColor,
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)] mb-1 block">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Brief description of what this agent does"
                  className="w-full px-3 py-2 rounded-lg text-sm
                    bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                    border border-[var(--md-outline-variant)]
                    focus:outline-none focus:ring-2 focus:border-transparent
                    placeholder:text-[var(--md-on-surface-variant)]"
                  style={{
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': accentColor,
                  }}
                />
              </div>

              {/* Icon */}
              <div>
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)] mb-1 block">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleFormChange('icon', option.id)}
                      className={`
                        flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm
                        transition-colors
                        ${formData.icon === option.id
                          ? 'bg-[var(--md-accent)] text-white'
                          : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)]'
                        }
                      `}
                    >
                      <span>{option.icon}</span>
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* System Prompt */}
              <div className="flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[var(--md-on-surface-variant)]">
                    System Prompt *
                  </label>
                  <button
                    type="button"
                    onClick={handleImprovePrompt}
                    disabled={isImproving || !formData.systemPrompt.trim()}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                      transition-all duration-200
                      ${isImproving
                        ? 'bg-[var(--md-accent)] text-white'
                        : formData.systemPrompt.trim()
                          ? 'bg-[var(--md-surface-container-high)] text-[var(--md-accent)] hover:bg-[var(--md-accent)] hover:text-white'
                          : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] opacity-50 cursor-not-allowed'
                      }
                    `}
                    title="Use AI to improve this prompt"
                  >
                    <SparkleIcon className="w-3.5 h-3.5" animate={isImproving} />
                    <span>{isImproving ? 'Improving...' : 'Improve with AI'}</span>
                  </button>
                </div>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  disabled={isImproving}
                  className={`flex-1 w-full p-3 rounded-lg text-sm font-mono
                    bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                    border border-[var(--md-outline-variant)]
                    focus:outline-none focus:ring-2 focus:border-transparent
                    resize-none min-h-[200px]
                    ${isImproving ? 'opacity-60' : ''}`}
                  style={{
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': accentColor,
                  }}
                  placeholder="Enter the system prompt that defines this agent's behavior..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--md-outline-variant)]">
              <div className="text-xs text-[var(--md-on-surface-variant)]">
                <span>* Required fields</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg
                    text-[var(--md-on-surface-variant)]
                    hover:bg-[var(--md-surface-container-high)]
                    transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!isFormValid || isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                  style={{
                    backgroundColor: isFormValid && !isSubmitting ? accentColor : 'var(--md-outline)',
                  }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </div>
          </>
        ) : isLoadingAgent ? (
          // Loading state for DB agent
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-sm text-[var(--md-on-surface-variant)]">Loading agent...</div>
          </div>
        ) : effectiveAgent ? (
          // Edit Mode (existing agent - built-in or DB)
          <>
            {/* Info */}
            <div className="px-4 py-3 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container)]">
              <p className="text-xs text-[var(--md-on-surface-variant)]">
                {agentConfig?.description || dbAgent?.description || 'No description'}
              </p>
              {agentConfig?.tools && agentConfig.tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {agentConfig.tools.slice(0, 5).map((tool) => (
                    <span
                      key={tool}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]"
                    >
                      {tool}
                    </span>
                  ))}
                  {agentConfig.tools.length > 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-[var(--md-on-surface-variant)]">
                      +{agentConfig.tools.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col min-h-0 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[var(--md-on-surface-variant)]">
                  System Prompt
                </label>
                <button
                  type="button"
                  onClick={handleImprovePrompt}
                  disabled={isImproving || !editedPrompt.trim()}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                    transition-all duration-200
                    ${isImproving
                      ? 'bg-[var(--md-accent)] text-white'
                      : editedPrompt.trim()
                        ? 'bg-[var(--md-surface-container-high)] text-[var(--md-accent)] hover:bg-[var(--md-accent)] hover:text-white'
                        : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] opacity-50 cursor-not-allowed'
                    }
                  `}
                  title="Use AI to improve this prompt"
                >
                  <SparkleIcon className="w-3.5 h-3.5" animate={isImproving} />
                  <span>{isImproving ? 'Improving...' : 'Improve with AI'}</span>
                </button>
              </div>
              <textarea
                value={editedPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                disabled={isImproving}
                className={`flex-1 w-full p-3 rounded-lg text-sm font-mono
                  bg-[var(--md-surface-container)] text-[var(--md-on-surface)]
                  border border-[var(--md-outline-variant)]
                  focus:outline-none focus:ring-2 focus:border-transparent
                  resize-none
                  ${isImproving ? 'opacity-60' : ''}`}
                style={{
                  // @ts-expect-error CSS custom property
                  '--tw-ring-color': accentColor,
                }}
                placeholder="Enter the system prompt for this agent..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--md-outline-variant)]">
              {/* Left - Status */}
              <div className="text-xs text-[var(--md-on-surface-variant)] w-28">
                {hasChanges ? (
                  <span className="text-[var(--md-warning)]">Unsaved changes</span>
                ) : (
                  <span>No changes</span>
                )}
              </div>

              {/* Center - Agent Actions */}
              {/* Hide/Show for all DB agents, Delete only for non-default custom agents */}
              <div className="flex-1 flex justify-center gap-2">
                {/* Hide/Show Button - for all DB agents */}
                {onToggleHidden && dbAgent && (
                  <button
                    onClick={handleToggleHidden}
                    disabled={isTogglingHidden}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      ${dbAgent.isHidden
                        ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] hover:opacity-90'
                        : 'text-[var(--md-on-surface-variant)] border border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)]'
                      }`}
                    title={dbAgent.isHidden ? 'Show this agent in sidebar' : 'Hide this agent from sidebar'}
                  >
                    {dbAgent.isHidden ? (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{isTogglingHidden ? 'Showing...' : 'Show Agent'}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                        <span>{isTogglingHidden ? 'Hiding...' : 'Hide Agent'}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Delete Button - only for non-default custom DB agents */}
                {onDelete && canDelete && (
                  showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--md-error)]">Delete?</span>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg
                          bg-[var(--md-error)] text-[var(--md-on-error)]
                          hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg
                          text-[var(--md-on-surface-variant)]
                          hover:bg-[var(--md-surface-container-high)]
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                        text-[var(--md-error)] border border-[var(--md-error)]
                        hover:bg-[var(--md-error)] hover:text-[var(--md-on-error)]
                        transition-all"
                      title="Delete this agent permanently"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  )
                )}
              </div>

              {/* Right - Reset and Save buttons */}
              <div className="flex items-center gap-2 w-28 justify-end">
                <button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg
                    text-[var(--md-on-surface-variant)]
                    hover:bg-[var(--md-surface-container-high)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                  style={{
                    backgroundColor: hasChanges ? accentColor : 'var(--md-outline)',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
