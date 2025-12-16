'use client';

import { useState } from 'react';
import MCPConfigForm from './MCPConfigForm';
import MCPTestButton from './MCPTestButton';

interface MCPServer {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  transportType: string;
  configTemplate: {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    type?: string;
    url?: string;
    headers?: Record<string, string>;
  };
  docsUrl: string | null;
  isOfficial: boolean;
}

interface UserConfig {
  id: string;
  serverId: string;
  config: Record<string, unknown>;
  isEnabled: boolean;
  priority: number;
  server: MCPServer;
}

interface MCPServerCardProps {
  server: MCPServer;
  userConfig?: UserConfig;
  onConfigUpdate: (serverId: string, config: Record<string, unknown>, isEnabled: boolean) => Promise<boolean>;
  onConfigDelete: (serverId: string) => Promise<boolean>;
}

export default function MCPServerCard({
  server,
  userConfig,
  onConfigUpdate,
  onConfigDelete
}: MCPServerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEnabled, setIsEnabled] = useState(userConfig?.isEnabled ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');

  // Get Material Symbols icon name
  const getIconName = (iconString: string | null): string => {
    if (!iconString) return 'settings';
    return iconString;
  };

  // Check if server requires configuration
  const requiresConfig = server.configTemplate.env && Object.keys(server.configTemplate.env).length > 0;

  // Check if configuration is complete
  const hasValidConfig = userConfig && userConfig.config && Object.keys(userConfig.config).length > 0;

  // Handle toggle
  const handleToggle = async () => {
    if (!hasValidConfig && !isEnabled) {
      // If no config exists, expand to show config form
      setIsExpanded(true);
      return;
    }

    try {
      setIsSaving(true);
      const newEnabledState = !isEnabled;

      await onConfigUpdate(
        server.id,
        userConfig?.config || {},
        newEnabledState
      );

      setIsEnabled(newEnabledState);
    } catch (error) {
      console.error('Failed to toggle server:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle config save
  const handleConfigSave = async (config: Record<string, unknown>) => {
    try {
      setIsSaving(true);
      await onConfigUpdate(server.id, config, isEnabled);
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (!isEnabled) return 'text-[var(--md-on-surface-variant)]';
    if (connectionStatus === 'connected') return 'text-[var(--md-tertiary)]';
    if (connectionStatus === 'failed') return 'text-[var(--md-error)]';
    return 'text-[var(--md-on-surface-variant)]';
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!isEnabled) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]">
          Disabled
        </span>
      );
    }

    if (!hasValidConfig && requiresConfig) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-[var(--md-error-container)] text-[var(--md-error)]">
          Config Required
        </span>
      );
    }

    switch (connectionStatus) {
      case 'testing':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]">
            Testing...
          </span>
        );
      case 'connected':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)]">
            Connected
          </span>
        );
      case 'failed':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--md-error-container)] text-[var(--md-error)]">
            Failed
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]">
            Not Tested
          </span>
        );
    }
  };

  return (
    <div className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] overflow-hidden transition-all duration-200 hover:shadow-lg">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <span className={`material-symbols-outlined text-3xl ${getStatusColor()}`}>
              {getIconName(server.icon)}
            </span>

            {/* Name and description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-[var(--md-on-surface)] truncate">
                  {server.name}
                </h3>
                {server.isOfficial && (
                  <svg className="w-4 h-4 text-[var(--md-primary)] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-[var(--md-on-surface-variant)] line-clamp-2">
                {server.description || 'No description available'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            disabled={isSaving}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)] focus:ring-offset-2
              ${isEnabled ? 'bg-[var(--md-primary)]' : 'bg-[var(--md-surface-container-highest)]'}
              ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                transition duration-200 ease-in-out
                ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <span className="text-xs text-[var(--md-on-surface-variant)]">
              {server.transportType.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Test Connection Button */}
            {isEnabled && hasValidConfig && (
              <MCPTestButton
                serverId={server.id}
                onStatusChange={setConnectionStatus}
              />
            )}

            {/* Configure Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors"
              title={isExpanded ? 'Hide configuration' : 'Show configuration'}
            >
              <svg
                className={`w-4 h-4 text-[var(--md-on-surface-variant)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Documentation Link */}
            {server.docsUrl && (
              <a
                href={server.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors"
                title="View documentation"
              >
                <svg
                  className="w-4 h-4 text-[var(--md-on-surface-variant)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Configuration Form */}
      {isExpanded && (
        <div className="border-t border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-4">
          <MCPConfigForm
            server={server}
            initialConfig={userConfig?.config || {}}
            onSave={handleConfigSave}
            onCancel={() => setIsExpanded(false)}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
}
