/**
 * Theme Switcher Component
 * Simple dropdown for theme selection
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme, themes } from '@/lib/theme';
import type { ThemeVariant } from '@/lib/theme';

export function ThemeSwitch() {
  const { currentTheme, preferences, setThemeVariant } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleThemeChange = (variant: ThemeVariant) => {
    setThemeVariant(variant);
    setIsOpen(false);
  };

  // Show fallback during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="relative">
        <button
          className="px-3 py-1.5 rounded-lg transition-colors bg-md-surface-container text-md-on-surface"
          aria-label="Change theme"
          disabled
        >
          🎨 Theme
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Theme Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-lg transition-colors"
        style={{
          background: isOpen ? 'var(--md-state-focus)' : 'var(--md-surface-container)',
          color: 'var(--md-on-surface)',
        }}
        aria-label="Change theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        🎨
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-72 rounded-lg shadow-2xl z-[10000]"
          style={{
            background: 'var(--md-surface-container-high)',
            border: '1px solid var(--md-outline)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: 'var(--md-outline-variant)' }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--md-on-surface)' }}
            >
              Choose Theme
            </h3>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Select your preferred visual style
            </p>
          </div>

          {/* Theme List */}
          <div className="py-2 max-h-[400px] overflow-y-auto">
            {Object.values(themes)
              .filter((theme, index, self) =>
                // Filter out duplicate placeholders
                index === self.findIndex(t => t.id === theme.id)
              )
              .map((theme) => {
                const isActive = theme.id === preferences.variant;

                return (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className="w-full px-4 py-2.5 text-left transition-colors flex items-start gap-3"
                    style={{
                      background: isActive ? 'var(--md-state-focus)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--md-state-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium"
                          style={{ color: isActive ? 'var(--md-primary)' : 'var(--md-on-surface)' }}
                        >
                          {theme.name}
                        </span>
                        {isActive && (
                          <span style={{ color: 'var(--md-primary)' }}>✓</span>
                        )}
                      </div>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--md-on-surface-variant)' }}
                      >
                        {theme.description}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-3 border-t"
            style={{ borderColor: 'var(--md-outline-variant)' }}
          >
            <p
              className="text-xs"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              ℹ️ Themes adapt based on system preferences
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSwitch;
