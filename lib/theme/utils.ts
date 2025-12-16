/**
 * Theme System Utilities
 * Convert theme config to CSS variables and apply to DOM
 */

import type { ThemeConfig, CSSVariables, DensityLevel } from './types';

/**
 * Convert theme config to CSS variable object
 */
export function themeToCSSVariables(theme: ThemeConfig): CSSVariables {
  const cssVars: CSSVariables = {};

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    cssVars[`--md-${cssKey}`] = value;
  });

  // Typography fonts
  cssVars['--font-display'] = theme.typography.displayFont;
  cssVars['--font-body'] = theme.typography.bodyFont;
  cssVars['--font-mono'] = theme.typography.monoFont;

  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });

  // Border radius
  Object.entries(theme.radius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value;
  });

  // Elevation
  Object.entries(theme.elevation).forEach(([key, value]) => {
    const level = key.replace('level', '');
    cssVars[`--elevation-${level}`] = value;
  });

  // Motion durations
  cssVars['--duration-short1'] = theme.motion.durationShort1;
  cssVars['--duration-short2'] = theme.motion.durationShort2;
  cssVars['--duration-medium1'] = theme.motion.durationMedium1;
  cssVars['--duration-medium2'] = theme.motion.durationMedium2;
  cssVars['--duration-long1'] = theme.motion.durationLong1;
  cssVars['--duration-long2'] = theme.motion.durationLong2;

  // Motion easing
  cssVars['--easing-standard'] = theme.motion.easingStandard;
  cssVars['--easing-emphasized'] = theme.motion.easingEmphasized;
  cssVars['--easing-decelerate'] = theme.motion.easingDecelerate;
  cssVars['--easing-accelerate'] = theme.motion.easingAccelerate;

  return cssVars;
}

/**
 * Apply CSS variables to DOM
 */
export function applyCSSVariables(variables: CSSVariables, element: HTMLElement = document.documentElement): void {
  Object.entries(variables).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
}

/**
 * Remove CSS variables from DOM
 */
export function removeCSSVariables(variables: CSSVariables, element: HTMLElement = document.documentElement): void {
  Object.keys(variables).forEach((key) => {
    element.style.removeProperty(key);
  });
}

/**
 * Apply theme to DOM with optional transition
 */
export function applyTheme(theme: ThemeConfig, transition: boolean = true): void {
  const root = document.documentElement;

  // Add transition class if requested
  if (transition) {
    root.classList.add('theme-transitioning');
  }

  // Apply CSS variables
  const cssVars = themeToCSSVariables(theme);
  applyCSSVariables(cssVars, root);

  // Add theme attributes for CSS selectors
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-mode', theme.mode);

  // Remove transition class after animation completes
  if (transition) {
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 300);
  }
}

/**
 * Get density multiplier for spacing calculations
 */
export function getDensityMultiplier(density: DensityLevel): number {
  switch (density) {
    case 'compact':
      return 0.75;
    case 'spacious':
      return 1.25;
    case 'comfortable':
    default:
      return 1.0;
  }
}

/**
 * Apply density scaling to CSS variables
 */
export function applyDensity(density: DensityLevel): void {
  const root = document.documentElement;
  const multiplier = getDensityMultiplier(density);

  root.style.setProperty('--density-multiplier', multiplier.toString());
  root.setAttribute('data-density', density);
}

/**
 * Detect system color scheme preference
 */
export function getSystemColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

/**
 * Detect reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Detect high contrast preference
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-contrast: high)');
  return mediaQuery.matches;
}

/**
 * Watch for system preference changes
 */
export function watchSystemPreferences(
  onColorSchemeChange: (scheme: 'light' | 'dark') => void,
  onReducedMotionChange: (reduced: boolean) => void,
  onHighContrastChange: (highContrast: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

  const colorSchemeHandler = (e: MediaQueryListEvent) => {
    onColorSchemeChange(e.matches ? 'dark' : 'light');
  };

  const reducedMotionHandler = (e: MediaQueryListEvent) => {
    onReducedMotionChange(e.matches);
  };

  const highContrastHandler = (e: MediaQueryListEvent) => {
    onHighContrastChange(e.matches);
  };

  colorSchemeQuery.addEventListener('change', colorSchemeHandler);
  reducedMotionQuery.addEventListener('change', reducedMotionHandler);
  highContrastQuery.addEventListener('change', highContrastHandler);

  // Return cleanup function
  return () => {
    colorSchemeQuery.removeEventListener('change', colorSchemeHandler);
    reducedMotionQuery.removeEventListener('change', reducedMotionHandler);
    highContrastQuery.removeEventListener('change', highContrastHandler);
  };
}
