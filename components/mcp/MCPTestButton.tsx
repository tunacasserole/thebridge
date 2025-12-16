'use client';

import { useState } from 'react';

interface MCPTestButtonProps {
  serverId: string;
  onStatusChange: (status: 'idle' | 'testing' | 'connected' | 'failed') => void;
}

export default function MCPTestButton({ serverId, onStatusChange }: MCPTestButtonProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    try {
      setIsTesting(true);
      setError(null);
      onStatusChange('testing');

      const response = await fetch('/api/mcp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed');
      }

      if (data.success) {
        onStatusChange('connected');
      } else {
        onStatusChange('failed');
        setError(data.error || 'Connection failed');
      }
    } catch (err) {
      onStatusChange('failed');
      setError(err instanceof Error ? err.message : 'Failed to test connection');
      console.error('Connection test error:', err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleTest}
        disabled={isTesting}
        className="p-1.5 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Test connection"
      >
        {isTesting ? (
          <svg className="w-4 h-4 animate-spin text-[var(--md-primary)]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-[var(--md-on-surface-variant)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        )}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute z-10 top-full right-0 mt-1 w-64 p-2 rounded-lg bg-[var(--md-error-container)] text-[var(--md-on-error-container)] text-xs shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
