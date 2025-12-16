/**
 * Material Design 2/3 Color System - Tuned with Tonal Palettes
 * Centralized color definitions for TheBridge
 * Based on https://m2.material.io/design/color/the-color-system.html
 *
 * 6 Base Colors with Full Tonal Palettes (50-900):
 * - Primary (Material Blue): Main actions, brand
 * - Secondary (Material Deep Purple): Supporting elements
 * - Tertiary (Material Cyan): Contrasting accents
 * - Error (Material Red): Errors, critical states
 * - Warning (Material Orange): Warnings, in-progress
 * - Success (Material Green): Success states
 */

// M3 Color Roles - Reference CSS variables
export const colors = {
  // Base accent colors (6 core hues) - Dark theme optimized (400 level)
  primary: 'var(--md-primary)',          // Material Blue 400
  secondary: 'var(--md-secondary)',      // Material Deep Purple 400
  tertiary: 'var(--md-tertiary)',        // Material Cyan 400
  error: 'var(--md-error)',              // Material Red 400
  warning: 'var(--md-warning)',          // Material Orange 400
  success: 'var(--md-success)',          // Material Green 400

  // Extended palette colors
  emerald: 'var(--md-emerald)',          // Emerald 500 (#10b981) - Merged states
  amber: 'var(--md-amber-500)',          // Amber 500 - Standard amber
  amberBright: 'var(--md-amber-bright)', // Bright yellow (#FFB800) - CTAs
  amberDark: 'var(--md-amber-dark)',     // Darker amber (#FFA000) - Gradients
  violet: 'var(--md-violet)',            // Violet 500 (#8b5cf6) - Beta/experimental
  violetLight: 'var(--md-violet-400)',   // Light violet (#a78bfa) - Beta text
  violetDark: 'var(--md-violet-600)',    // Dark violet (#7c3aed) - Beta dark

  // Color variants for additional flexibility
  primaryLight: 'var(--md-primary-light)',
  primaryDark: 'var(--md-primary-dark)',
  secondaryLight: 'var(--md-secondary-light)',
  secondaryDark: 'var(--md-secondary-dark)',
  tertiaryLight: 'var(--md-tertiary-light)',
  tertiaryDark: 'var(--md-tertiary-dark)',
  errorLight: 'var(--md-error-light)',
  errorDark: 'var(--md-error-dark)',
  warningLight: 'var(--md-warning-light)',
  warningDark: 'var(--md-warning-dark)',
  successLight: 'var(--md-success-light)',
  successDark: 'var(--md-success-dark)',

  // Surface colors (elevation-based dark theme)
  surface: 'var(--md-surface)',                          // 0dp - Material baseline
  surfaceDim: 'var(--md-surface-dim)',                   // Dimmed with purple tint
  surfaceVariant: 'var(--md-surface-variant)',           // 1-2dp elevation
  surfaceContainer: 'var(--md-surface-container)',       // 3-4dp elevation
  surfaceContainerLow: 'var(--md-surface-container-low)', // 6-8dp elevation
  surfaceContainerHigh: 'var(--md-surface-container-high)', // 12-16dp elevation
  surfaceContainerHighest: 'var(--md-surface-container-highest)', // 24dp elevation

  // On-colors (text on colored backgrounds with proper contrast)
  onSurface: 'var(--md-on-surface)',              // White on dark surfaces
  onSurfaceVariant: 'var(--md-on-surface-variant)', // 70% opacity white
  onPrimary: 'var(--md-on-primary)',               // Black on light blue
  onSecondary: 'var(--md-on-secondary)',           // White on purple
  onTertiary: 'var(--md-on-tertiary)',             // Black on light cyan
  onError: 'var(--md-on-error)',                   // Black on light red
  onWarning: 'var(--md-on-warning)',               // Black on light orange
  onSuccess: 'var(--md-on-success)',               // Black on light green

  // Outline colors (borders, dividers from neutral palette)
  outline: 'var(--md-outline)',              // Grey 700
  outlineVariant: 'var(--md-outline-variant)', // Grey 600

  // State layers (Material interaction states)
  stateHover: 'var(--md-state-hover)',       // 8% overlay
  stateFocus: 'var(--md-state-focus)',       // 12% overlay
  statePressed: 'var(--md-state-pressed)',   // 16% overlay
  stateDragged: 'var(--md-state-dragged)',   // 24% overlay
} as const;

/**
 * Status color mapping helper
 * Maps status strings to M3 semantic color roles
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'migrated':
    case 'success':
    case 'complete':
    case 'completed':
      return colors.success;

    case 'partial':
    case 'warning':
      return colors.warning;

    case 'inprogress':
    case 'in-progress':
    case 'in_progress':
      return colors.warning;

    case 'notstarted':
    case 'not-started':
    case 'not_started':
    case 'failed':
    case 'error':
      return colors.error;

    default:
      return colors.onSurfaceVariant;
  }
};

/**
 * Layer color mapping helper
 * Maps layer types to M3 color roles for visualization
 */
export const getLayerColor = (layer: string): string => {
  switch (layer.toLowerCase()) {
    case 'infrastructure':
    case 'platform':
      return colors.primary;

    case 'security':
    case 'auth':
      return colors.error;

    case 'application':
    case 'app':
    case 'service':
      return colors.success;

    case 'data':
    case 'database':
    case 'storage':
      return colors.secondary;

    case 'monitoring':
    case 'observability':
      return colors.tertiary;

    default:
      return colors.primary;
  }
};

/**
 * Severity color mapping helper
 * Maps severity levels to M3 semantic colors
 */
export const getSeverityColor = (severity: string | number): string => {
  if (typeof severity === 'number') {
    if (severity >= 4) return colors.error;      // Critical/High
    if (severity >= 3) return colors.warning;    // Medium
    if (severity >= 2) return colors.success;    // Low
    return colors.onSurfaceVariant;              // Info
  }

  switch (severity.toLowerCase()) {
    case 'critical':
    case 'high':
    case 'p0':
    case 'p1':
      return colors.error;

    case 'medium':
    case 'moderate':
    case 'p2':
      return colors.warning;

    case 'low':
    case 'minor':
    case 'p3':
      return colors.success;

    case 'info':
    case 'informational':
    case 'p4':
    default:
      return colors.tertiary;
  }
};

/**
 * Get text color for colored background
 * Returns appropriate on-color for readability
 */
export const getOnColor = (backgroundColor: string): string => {
  switch (backgroundColor) {
    case colors.primary:
      return colors.onPrimary;
    case colors.secondary:
      return colors.onSecondary;
    case colors.error:
      return colors.onError;
    case colors.surface:
    case colors.surfaceContainer:
    default:
      return colors.onSurface;
  }
};
