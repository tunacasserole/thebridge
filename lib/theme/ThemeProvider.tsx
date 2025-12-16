/**
 * TheBridge Theme Provider
 * React Context provider for theme management
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { ThemeConfig, ThemeVariant, ThemeMode, ThemePreferences, ThemeContextValue, DensityLevel, MotionPreference } from './types';
import { themes, defaultTheme } from './themes';
import {
  applyTheme,
  applyDensity,
  getSystemColorScheme,
  prefersReducedMotion,
  prefersHighContrast,
  watchSystemPreferences,
} from './utils';

/**
 * Theme Context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Local storage keys
 */
const STORAGE_KEYS = {
  PREFERENCES: 'thebridge_theme_preferences',
} as const;

/**
 * Default preferences
 * Note: mode is 'auto' to respect system theme unless user explicitly sets a preference
 */
const defaultPreferences: ThemePreferences = {
  variant: 'midnight-command',
  mode: 'auto',
  density: 'comfortable',
  motion: 'standard',
  soundAlerts: false,
  compactMetrics: false,
  showSparklines: true,
};

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
  defaultVariant?: ThemeVariant;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

/**
 * Theme Provider Component
 */
export function ThemeProvider({
  children,
  defaultVariant = 'midnight-command',
  defaultMode = 'auto',
  storageKey = STORAGE_KEYS.PREFERENCES,
}: ThemeProviderProps) {
  // System preferences
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() => getSystemColorScheme());
  const [prefersReducedMotionState, setPrefersReducedMotionState] = useState(() => prefersReducedMotion());
  const [prefersHighContrastState, setPrefersHighContrastState] = useState(() => prefersHighContrast());

  // User preferences
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    // Server-side: Use default preferences
    if (typeof window === 'undefined') {
      return { ...defaultPreferences, variant: defaultVariant, mode: defaultMode };
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        // User has previously saved preferences - use them
        const parsed = JSON.parse(stored);
        return { ...defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }

    // First-time user: Use defaults (which includes mode: 'auto' to follow system)
    return { ...defaultPreferences, variant: defaultVariant, mode: defaultMode };
  });

  // Current theme calculation
  const currentTheme = React.useMemo<ThemeConfig>(() => {
    let variant = preferences.variant;

    // Auto-detect high contrast
    if (prefersHighContrastState && variant !== 'high-contrast') {
      variant = 'high-contrast';
    }

    // Get base theme
    let theme = themes[variant] || defaultTheme;

    // Handle auto mode (follow system preference)
    if (preferences.mode === 'auto') {
      // If current theme doesn't match system, find matching variant
      if (theme.mode !== systemPreference) {
        // Try to find a matching mode variant
        const matchingTheme = Object.values(themes).find(
          t => t.id !== variant && t.mode === systemPreference
        );
        if (matchingTheme) {
          theme = matchingTheme;
        }
      }
    } else {
      // Manual mode override
      if (theme.mode !== preferences.mode) {
        // Try to find a theme with the specified mode
        const matchingTheme = Object.values(themes).find(
          t => t.mode === preferences.mode
        );
        if (matchingTheme) {
          theme = matchingTheme;
        }
      }
    }

    // Apply custom colors if provided
    if (preferences.customColors) {
      theme = {
        ...theme,
        colors: {
          ...theme.colors,
          ...preferences.customColors,
        },
      };
    }

    return theme;
  }, [preferences, systemPreference, prefersHighContrastState]);

  // Persist preferences to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }, [preferences, storageKey]);

  // Apply theme to DOM
  useEffect(() => {
    applyTheme(currentTheme, true);
  }, [currentTheme]);

  // Apply density to DOM
  useEffect(() => {
    applyDensity(preferences.density);
  }, [preferences.density]);

  // Apply motion preference
  useEffect(() => {
    const root = document.documentElement;

    if (preferences.motion === 'reduced' || prefersReducedMotionState) {
      root.setAttribute('data-motion', 'reduced');
    } else {
      root.setAttribute('data-motion', preferences.motion);
    }
  }, [preferences.motion, prefersReducedMotionState]);

  // Watch for system preference changes
  useEffect(() => {
    const cleanup = watchSystemPreferences(
      setSystemPreference,
      setPrefersReducedMotionState,
      setPrefersHighContrastState
    );

    return cleanup;
  }, []);

  // Actions
  const setThemeVariant = useCallback((variant: ThemeVariant) => {
    // When user explicitly selects a theme, set mode to match that theme's mode
    // This locks in their choice and stops following system preferences
    const selectedTheme = themes[variant];
    const themeMode: ThemeMode = selectedTheme ? selectedTheme.mode : 'auto';

    setPreferences(prev => ({ ...prev, variant, mode: themeMode }));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setPreferences(prev => ({ ...prev, mode }));
  }, []);

  const setDensity = useCallback((density: DensityLevel) => {
    setPreferences(prev => ({ ...prev, density }));
  }, []);

  const setMotion = useCallback((motion: MotionPreference) => {
    setPreferences(prev => ({ ...prev, motion }));
  }, []);

  const updatePreferences = useCallback((updates: Partial<ThemePreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setPreferences({ ...defaultPreferences, variant: defaultVariant, mode: defaultMode });
  }, [defaultVariant, defaultMode]);

  // Context value
  const contextValue: ThemeContextValue = {
    currentTheme,
    preferences,
    systemPreference,
    prefersReducedMotion: prefersReducedMotionState,
    prefersHighContrast: prefersHighContrastState,
    setThemeVariant,
    setThemeMode,
    setDensity,
    setMotion,
    updatePreferences,
    resetToDefaults,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 * Access theme context from any component
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
