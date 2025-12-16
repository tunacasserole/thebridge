/**
 * Shared theme configuration tokens
 * Typography, spacing, elevation, motion, and radius shared across all themes
 */

import type { ThemeConfig } from './types';

/**
 * Shared typography configuration (consistent across all themes)
 */
export const sharedTypography: ThemeConfig['typography'] = {
  displayFont: "'Red Hat Display', system-ui, -apple-system, sans-serif",
  bodyFont: "'DM Sans', system-ui, -apple-system, sans-serif",
  monoFont: "'JetBrains Mono', 'IBM Plex Mono', 'Consolas', monospace",

  // MD3 Type Scale
  displayLarge: { size: '57px', weight: 700, lineHeight: '64px' },
  displayMedium: { size: '45px', weight: 700, lineHeight: '52px' },
  displaySmall: { size: '36px', weight: 700, lineHeight: '44px' },
  headlineLarge: { size: '32px', weight: 700, lineHeight: '40px' },
  headlineMedium: { size: '28px', weight: 600, lineHeight: '36px' },
  headlineSmall: { size: '24px', weight: 600, lineHeight: '32px' },
  titleLarge: { size: '22px', weight: 600, lineHeight: '28px' },
  titleMedium: { size: '16px', weight: 600, lineHeight: '24px' },
  titleSmall: { size: '14px', weight: 600, lineHeight: '20px' },
  bodyLarge: { size: '16px', weight: 400, lineHeight: '24px' },
  bodyMedium: { size: '14px', weight: 400, lineHeight: '20px' },
  bodySmall: { size: '12px', weight: 400, lineHeight: '16px' },
  labelLarge: { size: '14px', weight: 500, lineHeight: '20px' },
  labelMedium: { size: '12px', weight: 500, lineHeight: '16px' },
  labelSmall: { size: '11px', weight: 500, lineHeight: '16px' },
};

/**
 * Shared spacing configuration (MD3 compliant)
 */
export const sharedSpacing: ThemeConfig['spacing'] = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
};

/**
 * Shared border radius
 */
export const sharedRadius: ThemeConfig['radius'] = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

/**
 * Shared elevation shadows
 */
export const sharedElevation: ThemeConfig['elevation'] = {
  level0: 'none',
  level1: '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15)',
  level2: '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15)',
  level3: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 4px 8px 3px rgb(0 0 0 / 0.15)',
  level4: '0 2px 3px 0 rgb(0 0 0 / 0.3), 0 6px 10px 4px rgb(0 0 0 / 0.15)',
  level5: '0 4px 4px 0 rgb(0 0 0 / 0.3), 0 8px 12px 6px rgb(0 0 0 / 0.15)',
};

/**
 * Shared motion tokens (MD3)
 */
export const sharedMotion: ThemeConfig['motion'] = {
  durationShort1: '50ms',
  durationShort2: '100ms',
  durationMedium1: '250ms',
  durationMedium2: '300ms',
  durationLong1: '400ms',
  durationLong2: '500ms',
  easingStandard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  easingEmphasized: 'cubic-bezier(0.0, 0.0, 0, 1.0)',
  easingDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
  easingAccelerate: 'cubic-bezier(0.4, 0.0, 1, 1.0)',
};
