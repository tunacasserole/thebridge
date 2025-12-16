'use client';

import { useState, useEffect, useRef } from 'react';

export type ResponseMode = 'concise' | 'standard' | 'detailed';

interface ResponseModeConfig {
  id: ResponseMode;
  label: string;
  description: string;
  estimatedTokens: string;
  icon: string;
}

interface ResponseModeSelectorProps {
  value: ResponseMode;
  onChange: (mode: ResponseMode) => void;
  className?: string;
}

const RESPONSE_MODES: ResponseModeConfig[] = [
  {
    id: 'concise',
    label: 'Concise',
    description: 'Brief, direct answers',
    estimatedTokens: '~500',
    icon: '⚡',
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Balanced detail',
    estimatedTokens: '~1.5K',
    icon: '📊',
  },
  {
    id: 'detailed',
    label: 'Detailed',
    description: 'Comprehensive explanations',
    estimatedTokens: '~3K',
    icon: '📚',
  },
];

export default function ResponseModeSelector({
  value,
  onChange,
  className = '',
}: ResponseModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentMode = RESPONSE_MODES.find((m) => m.id === value) || RESPONSE_MODES[1];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save preference to localStorage
  const handleModeChange = (mode: ResponseMode) => {
    onChange(mode);
    setIsOpen(false);
    try {
      localStorage.setItem('thebridge-response-mode', mode);
    } catch (error) {
      console.error('Failed to save response mode preference:', error);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors duration-200 ${
          value !== 'standard'
            ? 'bg-[var(--md-accent)]/10 text-[var(--md-accent)] hover:bg-[var(--md-accent)]/20'
            : 'text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)]'
        }`}
      >
        <span>{currentMode.icon}</span>
        <span className="font-medium">{currentMode.label}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)]">
            <div className="text-xs font-medium text-[var(--md-on-surface)]">Response Mode</div>
            <div className="text-[10px] text-[var(--md-on-surface-variant)] mt-0.5">
              Choose response detail level
            </div>
          </div>

          {/* Mode options */}
          <div className="py-1">
            {RESPONSE_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`w-full px-3 py-2 text-left hover:bg-[var(--md-surface-container-high)] transition-colors duration-200 ${
                  value === mode.id ? 'bg-[var(--md-accent)]/10' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">{mode.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          value === mode.id ? 'text-[var(--md-accent)]' : 'text-[var(--md-on-surface)]'
                        }`}
                      >
                        {mode.label}
                      </span>
                      {value === mode.id && (
                        <svg className="w-3 h-3 text-[var(--md-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--md-on-surface-variant)] mt-0.5">
                      {mode.description}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--md-on-surface-variant)] mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {mode.estimatedTokens} tokens
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer tip */}
          <div className="px-3 py-2 border-t border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)]">
            <div className="text-[10px] text-[var(--md-on-surface-variant)] flex items-start gap-1">
              <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Your preference is saved automatically</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to load saved preference
export function useResponseMode(): [ResponseMode, (mode: ResponseMode) => void] {
  const [mode, setMode] = useState<ResponseMode>('standard');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('thebridge-response-mode');
      if (saved && ['concise', 'standard', 'detailed'].includes(saved)) {
        setMode(saved as ResponseMode);
      }
    } catch (error) {
      console.error('Failed to load response mode preference:', error);
    }
  }, []);

  return [mode, setMode];
}
