'use client';

import { useState } from 'react';
import { useLocalBridge } from '@/contexts/LocalBridgeContext';

/**
 * Local bridge connection status indicator for the header
 * Shows connection state and provides quick access to code panel
 */
export default function LocalBridgeStatus() {
  const { connectionState, error, connect, disconnect, availableTools } = useLocalBridge();
  const [showTooltip, setShowTooltip] = useState(false);

  const statusConfig = {
    disconnected: {
      color: 'bg-gray-400',
      label: 'Local Bridge',
      description: 'Not connected',
    },
    connecting: {
      color: 'bg-yellow-400 animate-pulse',
      label: 'Connecting',
      description: 'Connecting to local bridge...',
    },
    connected: {
      color: 'bg-green-400',
      label: 'Connected',
      description: `${availableTools.length} tools available`,
    },
    error: {
      color: 'bg-red-400',
      label: 'Error',
      description: error || 'Connection failed',
    },
  };

  const config = statusConfig[connectionState];

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => {
          if (connectionState === 'connected') {
            disconnect();
          } else if (connectionState !== 'connecting') {
            connect();
          }
        }}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md
          hover:bg-[--bg-tertiary] transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-primary]"
        aria-label={`Local bridge: ${config.label}`}
      >
        {/* Terminal icon */}
        <svg
          className="w-4 h-4 text-[--text-secondary]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <div className="bg-[--bg-secondary] border border-[--border-primary] rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${config.color}`} />
              <span className="font-medium text-sm text-[--text-primary]">{config.label}</span>
            </div>
            <p className="text-xs text-[--text-secondary] mb-2">{config.description}</p>

            {connectionState === 'disconnected' && (
              <div className="text-xs text-[--text-tertiary] border-t border-[--border-primary] pt-2 mt-2">
                <p className="mb-1">To connect, run:</p>
                <code className="block bg-[--bg-primary] px-2 py-1 rounded text-[--accent-primary]">
                  npx @thebridge/local start
                </code>
              </div>
            )}

            {connectionState === 'connected' && (
              <div className="text-xs text-[--text-tertiary] border-t border-[--border-primary] pt-2 mt-2">
                <p>Tools: {availableTools.join(', ')}</p>
              </div>
            )}

            {connectionState === 'error' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  connect();
                }}
                className="mt-2 w-full px-3 py-1.5 bg-[--accent-primary] text-white text-xs rounded hover:opacity-90"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
