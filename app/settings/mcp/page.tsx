'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MCPServerCard from '@/components/mcp/MCPServerCard';
import RadialFAB from '@/components/RadialFAB';
import type { ViewMode } from '@/types/views';

interface MCPServer {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
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

// Category metadata for display
const CATEGORY_INFO: Record<string, { label: string; icon: string; description: string }> = {
  observability: {
    label: 'Observability',
    icon: 'monitoring',
    description: 'Logs, metrics, APM, and incident management',
  },
  infrastructure: {
    label: 'Infrastructure',
    icon: 'cloud',
    description: 'Container orchestration, CDN, and cloud infrastructure',
  },
  productivity: {
    label: 'Productivity',
    icon: 'task_alt',
    description: 'Project tracking, communication, and collaboration',
  },
  data: {
    label: 'Data & Analytics',
    icon: 'bar_chart',
    description: 'Data warehouses, BI tools, and integrations',
  },
  devops: {
    label: 'DevOps',
    icon: 'rocket_launch',
    description: 'CI/CD, deployment, and developer tools',
  },
};

interface UserConfig {
  id: string;
  serverId: string;
  config: Record<string, unknown>;
  isEnabled: boolean;
  priority: number;
  server: MCPServer;
}

export default function MCPSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [userConfigs, setUserConfigs] = useState<UserConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle mode change from FAB - navigate to home with mode parameter
  const handleModeChange = useCallback((mode: ViewMode) => {
    router.push(`/?mode=${mode}`);
  }, [router]);

  // Load available servers and user configurations
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Load all available servers
        const serversRes = await fetch('/api/mcp/servers');
        if (!serversRes.ok) throw new Error('Failed to load MCP servers');
        const serversData = await serversRes.json();
        setServers(serversData);

        // Load user's configurations
        const configsRes = await fetch('/api/mcp/user-configs');
        if (!configsRes.ok) throw new Error('Failed to load user configurations');
        const configsData = await configsRes.json();
        setUserConfigs(configsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading MCP data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      loadData();
    }
  }, [session]);

  // Find user config for a specific server
  const getUserConfig = (serverId: string) => {
    return userConfigs.find(c => c.serverId === serverId);
  };

  // Handle config updates
  const handleConfigUpdate = async (serverId: string, config: Record<string, unknown>, isEnabled: boolean) => {
    try {
      const res = await fetch('/api/mcp/user-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, config, isEnabled }),
      });

      if (!res.ok) throw new Error('Failed to save configuration');

      const updatedConfig = await res.json();

      // Update local state
      setUserConfigs(prev => {
        const existing = prev.find(c => c.serverId === serverId);
        if (existing) {
          return prev.map(c => c.serverId === serverId ? updatedConfig : c);
        } else {
          return [...prev, updatedConfig];
        }
      });

      return true;
    } catch (err) {
      console.error('Error saving config:', err);
      throw err;
    }
  };

  // Handle server deletion
  const handleConfigDelete = async (serverId: string) => {
    try {
      const res = await fetch(`/api/mcp/user-configs?serverId=${serverId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete configuration');

      // Update local state
      setUserConfigs(prev => prev.filter(c => c.serverId !== serverId));

      return true;
    } catch (err) {
      console.error('Error deleting config:', err);
      throw err;
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[var(--md-surface)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--md-on-surface)] mb-2">
            Authentication Required
          </h2>
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            Please sign in to manage your MCP servers
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--md-surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--md-primary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--md-on-surface-variant)]">Loading MCP servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--md-surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--md-error)] mb-2">
            <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--md-on-surface)] mb-2">Error Loading Data</h2>
          <p className="text-sm text-[var(--md-on-surface-variant)]">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[var(--md-primary)] text-[var(--md-on-primary)] rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Group servers by category
  const serversByCategory = servers.reduce((acc, server) => {
    const category = server.category || 'observability';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(server);
    return acc;
  }, {} as Record<string, MCPServer[]>);

  // Define category order
  const categoryOrder = ['infrastructure', 'observability', 'productivity', 'data', 'devops'];

  return (
    <div className="min-h-screen bg-[var(--md-surface)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--md-on-surface)] mb-2">
            MCP Server Management
          </h1>
          <p className="text-[var(--md-on-surface-variant)]">
            Configure and manage your Model Context Protocol (MCP) server connections
          </p>
        </div>

        {/* Render servers by category */}
        {categoryOrder.map(category => {
          const categoryServers = serversByCategory[category];
          if (!categoryServers || categoryServers.length === 0) return null;

          const info = CATEGORY_INFO[category] || {
            label: category.charAt(0).toUpperCase() + category.slice(1),
            icon: 'extension',
            description: '',
          };

          return (
            <div key={category} className="mb-10">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-[var(--md-on-surface)] flex items-center gap-2">
                  <span className="material-symbols-rounded text-[var(--md-primary)]">
                    {info.icon}
                  </span>
                  {info.label}
                </h2>
                <p className="text-sm text-[var(--md-on-surface-variant)] mt-1">
                  {info.description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServers.map(server => (
                  <MCPServerCard
                    key={server.id}
                    server={server}
                    userConfig={getUserConfig(server.id)}
                    onConfigUpdate={handleConfigUpdate}
                    onConfigDelete={handleConfigDelete}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {servers.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-rounded text-6xl text-[var(--md-on-surface-variant)] opacity-50 mb-4">
              dns
            </span>
            <h3 className="text-lg font-semibold text-[var(--md-on-surface)] mb-2">
              No MCP Servers Available
            </h3>
            <p className="text-sm text-[var(--md-on-surface-variant)]">
              No MCP servers have been configured yet
            </p>
          </div>
        )}
      </div>

      {/* Radial FAB - Mode switcher */}
      <RadialFAB
        currentMode="dashboard"
        onModeChange={handleModeChange}
      />
    </div>
  );
}
