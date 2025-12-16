/**
 * Standard Professional Themes
 * 6 carefully designed themes for professional use
 */

import type { ThemeConfig } from './types';
import { sharedTypography, sharedSpacing, sharedRadius, sharedElevation, sharedMotion } from './shared';

export const midnightCommandTheme: ThemeConfig = {
  id: 'midnight-command',
  name: 'Midnight Command',
  description: 'Default dark theme with purple tint for low-light environments',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#42a5f5',
    primaryLight: '#64b5f6',
    primaryDark: '#1e88e5',
    onPrimary: '#000000',
    primaryContainer: '#1565c0',
    onPrimaryContainer: '#bbdefb',

    // Secondary (Deep Purple)
    secondary: '#7e57c2',
    secondaryLight: '#9575cd',
    secondaryDark: '#5e35b1',
    onSecondary: '#ffffff',
    secondaryContainer: '#512da8',
    onSecondaryContainer: '#d1c4e9',

    // Tertiary (Cyan)
    tertiary: '#26c6da',
    tertiaryLight: '#4dd0e1',
    tertiaryDark: '#00acc1',
    onTertiary: '#000000',
    tertiaryContainer: '#0097a7',
    onTertiaryContainer: '#b2ebf2',

    // Error (Red)
    error: '#ef5350',
    errorLight: '#e57373',
    errorDark: '#e53935',
    onError: '#000000',
    errorContainer: '#c62828',
    onErrorContainer: '#ffcdd2',

    // Warning (Orange)
    warning: '#ffa726',
    warningLight: '#ffb74d',
    warningDark: '#fb8c00',
    onWarning: '#000000',
    warningContainer: '#ef6c00',
    onWarningContainer: '#ffe0b2',

    // Success (Green)
    success: '#66bb6a',
    successLight: '#81c784',
    successDark: '#43a047',
    onSuccess: '#000000',
    successContainer: '#388e3c',
    onSuccessContainer: '#c8e6c9',

    // Neutral
    neutral50: '#fafafa',
    neutral100: '#f5f5f5',
    neutral200: '#eeeeee',
    neutral300: '#e0e0e0',
    neutral400: '#bdbdbd',
    neutral500: '#9e9e9e',
    neutral600: '#757575',
    neutral700: '#616161',
    neutral800: '#424242',
    neutral900: '#212121',

    // Surfaces (Purple-tinted dark)
    surface: '#121212',
    surfaceDim: '#1a1625',
    surfaceVariant: '#22202e',
    surfaceContainer: '#262436',
    surfaceContainerLow: '#2a2840',
    surfaceContainerHigh: '#2f2d45',
    surfaceContainerHighest: '#35334a',
    onSurface: '#ffffff',
    onSurfaceVariant: 'rgba(255, 255, 255, 0.7)',

    // Outlines (TheBridge yellow)
    outline: '#fbbf24',
    outlineVariant: '#fcd34d',

    // Brand accent
    accent: '#fbbf24',
    accentLight: '#fcd34d',
    accentDark: '#f59e0b',

    // State layers (yellow-based)
    stateHover: 'rgba(251, 191, 36, 0.08)',
    stateFocus: 'rgba(251, 191, 36, 0.12)',
    statePressed: 'rgba(251, 191, 36, 0.16)',
    stateDragged: 'rgba(251, 191, 36, 0.24)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 2: Daylight Operations (Light)
 * Clean light theme for daytime use and presentations
 */
export const daylightOperationsTheme: ThemeConfig = {
  id: 'daylight-operations',
  name: 'Daylight Operations',
  description: 'Light theme for bright environments and daytime use',
  category: 'standard',
  mode: 'light',

  colors: {
    // Primary (Blue) - darker for light backgrounds
    primary: '#1976d2',
    primaryLight: '#42a5f5',
    primaryDark: '#0d47a1',
    onPrimary: '#ffffff',
    primaryContainer: '#bbdefb',
    onPrimaryContainer: '#0d47a1',

    // Secondary (Deep Purple)
    secondary: '#512da8',
    secondaryLight: '#7e57c2',
    secondaryDark: '#311b92',
    onSecondary: '#ffffff',
    secondaryContainer: '#d1c4e9',
    onSecondaryContainer: '#311b92',

    // Tertiary (Cyan)
    tertiary: '#0097a7',
    tertiaryLight: '#26c6da',
    tertiaryDark: '#006064',
    onTertiary: '#ffffff',
    tertiaryContainer: '#b2ebf2',
    onTertiaryContainer: '#006064',

    // Error (Red)
    error: '#d32f2f',
    errorLight: '#ef5350',
    errorDark: '#b71c1c',
    onError: '#ffffff',
    errorContainer: '#ffcdd2',
    onErrorContainer: '#b71c1c',

    // Warning (Orange)
    warning: '#f57c00',
    warningLight: '#ffa726',
    warningDark: '#e65100',
    onWarning: '#ffffff',
    warningContainer: '#ffe0b2',
    onWarningContainer: '#e65100',

    // Success (Green)
    success: '#388e3c',
    successLight: '#66bb6a',
    successDark: '#1b5e20',
    onSuccess: '#ffffff',
    successContainer: '#c8e6c9',
    onSuccessContainer: '#1b5e20',

    // Neutral (same as dark)
    neutral50: '#fafafa',
    neutral100: '#f5f5f5',
    neutral200: '#eeeeee',
    neutral300: '#e0e0e0',
    neutral400: '#bdbdbd',
    neutral500: '#9e9e9e',
    neutral600: '#757575',
    neutral700: '#616161',
    neutral800: '#424242',
    neutral900: '#212121',

    // Surfaces (light)
    surface: '#ffffff',
    surfaceDim: '#f5f5f5',
    surfaceVariant: '#eeeeee',
    surfaceContainer: '#f5f5f5',
    surfaceContainerLow: '#f8f8f8',
    surfaceContainerHigh: '#eeeeee',
    surfaceContainerHighest: '#e0e0e0',
    onSurface: '#212121',
    onSurfaceVariant: 'rgba(33, 33, 33, 0.7)',

    // Outlines (TheBridge yellow - adjusted for light)
    outline: '#f59e0b',
    outlineVariant: '#fbbf24',

    // Brand accent
    accent: '#f59e0b',
    accentLight: '#fbbf24',
    accentDark: '#d97706',

    // State layers (yellow-based, adjusted for light)
    stateHover: 'rgba(245, 158, 11, 0.08)',
    stateFocus: 'rgba(245, 158, 11, 0.12)',
    statePressed: 'rgba(245, 158, 11, 0.16)',
    stateDragged: 'rgba(245, 158, 11, 0.24)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 3: High Contrast (Accessibility)
 * Maximum contrast theme for visual accessibility (WCAG AAA)
 */
export const highContrastTheme: ThemeConfig = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'Maximum contrast for users with visual impairments (WCAG AAA)',
  category: 'accessibility',
  mode: 'dark',

  colors: {
    // Primary (Bright Blue) - very bright for maximum contrast
    primary: '#82b1ff',
    primaryLight: '#b6e3ff',
    primaryDark: '#4d82cb',
    onPrimary: '#000000',
    primaryContainer: '#2962ff',
    onPrimaryContainer: '#ffffff',

    // Secondary (Bright Purple)
    secondary: '#b388ff',
    secondaryLight: '#e7b9ff',
    secondaryDark: '#805acb',
    onSecondary: '#000000',
    secondaryContainer: '#6200ea',
    onSecondaryContainer: '#ffffff',

    // Tertiary (Bright Cyan)
    tertiary: '#84ffff',
    tertiaryLight: '#b8ffff',
    tertiaryDark: '#4ecccb',
    onTertiary: '#000000',
    tertiaryContainer: '#00e5ff',
    onTertiaryContainer: '#ffffff',

    // Error (Bright Red)
    error: '#ff6e6e',
    errorLight: '#ffa4a4',
    errorDark: '#cb3d3d',
    onError: '#000000',
    errorContainer: '#ff1744',
    onErrorContainer: '#ffffff',

    // Warning (Bright Orange)
    warning: '#ffb74d',
    warningLight: '#ffe97d',
    warningDark: '#c88719',
    onWarning: '#000000',
    warningContainer: '#ff9100',
    onWarningContainer: '#ffffff',

    // Success (Bright Green)
    success: '#69f0ae',
    successLight: '#9fffe0',
    successDark: '#2bbd7e',
    onSuccess: '#000000',
    successContainer: '#00e676',
    onSuccessContainer: '#ffffff',

    // Neutral
    neutral50: '#ffffff',
    neutral100: '#f5f5f5',
    neutral200: '#eeeeee',
    neutral300: '#e0e0e0',
    neutral400: '#bdbdbd',
    neutral500: '#9e9e9e',
    neutral600: '#757575',
    neutral700: '#616161',
    neutral800: '#424242',
    neutral900: '#000000',

    // Surfaces (Pure black for maximum contrast)
    surface: '#000000',
    surfaceDim: '#0a0a0a',
    surfaceVariant: '#141414',
    surfaceContainer: '#1a1a1a',
    surfaceContainerLow: '#202020',
    surfaceContainerHigh: '#2a2a2a',
    surfaceContainerHighest: '#333333',
    onSurface: '#ffffff',
    onSurfaceVariant: '#ffffff',

    // Outlines (Bright yellow for maximum visibility)
    outline: '#ffeb3b',
    outlineVariant: '#fff176',

    // Brand accent (extra bright)
    accent: '#ffeb3b',
    accentLight: '#fff176',
    accentDark: '#fbc02d',

    // State layers (bright yellow)
    stateHover: 'rgba(255, 235, 59, 0.12)',
    stateFocus: 'rgba(255, 235, 59, 0.18)',
    statePressed: 'rgba(255, 235, 59, 0.24)',
    stateDragged: 'rgba(255, 235, 59, 0.32)',
  },

  typography: {
    ...sharedTypography,
    // Slightly larger fonts for better readability
    bodyLarge: { size: '18px', weight: 500, lineHeight: '28px' },
    bodyMedium: { size: '16px', weight: 500, lineHeight: '24px' },
    bodySmall: { size: '14px', weight: 500, lineHeight: '20px' },
  },

  spacing: {
    // Slightly more generous spacing
    xs: '6px',
    sm: '10px',
    md: '14px',
    lg: '20px',
    xl: '28px',
    '2xl': '40px',
    '3xl': '56px',
  },

  radius: {
    // Slightly sharper corners for clarity
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  elevation: {
    // Stronger shadows for better definition
    ...sharedElevation,
    level1: '0 2px 4px 0 rgb(0 0 0 / 0.5), 0 2px 6px 2px rgb(0 0 0 / 0.3)',
    level2: '0 2px 4px 0 rgb(0 0 0 / 0.5), 0 4px 8px 4px rgb(0 0 0 / 0.3)',
    level3: '0 2px 6px 0 rgb(0 0 0 / 0.5), 0 6px 12px 6px rgb(0 0 0 / 0.3)',
  },

  motion: {
    // Slightly slower for better perception
    ...sharedMotion,
    durationMedium1: '300ms',
    durationMedium2: '350ms',
    durationLong1: '450ms',
    durationLong2: '550ms',
  },
};

/**
 * Theme 4: Focused Commander (Minimal Distraction)
 * Monochromatic theme for high-stress incident response
 */
export const focusedCommanderTheme: ThemeConfig = {
  id: 'focused-commander',
  name: 'Focused Commander',
  description: 'Minimal distraction theme for incident response and high-stress situations',
  category: 'specialized',
  mode: 'dark',

  colors: {
    // Monochromatic base with semantic colors only for status
    primary: '#9e9e9e',
    primaryLight: '#bdbdbd',
    primaryDark: '#757575',
    onPrimary: '#000000',
    primaryContainer: '#616161',
    onPrimaryContainer: '#eeeeee',

    secondary: '#9e9e9e',
    secondaryLight: '#bdbdbd',
    secondaryDark: '#757575',
    onSecondary: '#000000',
    secondaryContainer: '#616161',
    onSecondaryContainer: '#eeeeee',

    tertiary: '#9e9e9e',
    tertiaryLight: '#bdbdbd',
    tertiaryDark: '#757575',
    onTertiary: '#000000',
    tertiaryContainer: '#616161',
    onTertiaryContainer: '#eeeeee',

    // Semantic colors remain vibrant for status
    error: '#ff5252',
    errorLight: '#ff6b6b',
    errorDark: '#ff1744',
    onError: '#000000',
    errorContainer: '#d32f2f',
    onErrorContainer: '#ffcdd2',

    warning: '#ffb300',
    warningLight: '#ffc947',
    warningDark: '#ff8f00',
    onWarning: '#000000',
    warningContainer: '#f57c00',
    onWarningContainer: '#ffe0b2',

    success: '#69f0ae',
    successLight: '#9fffe0',
    successDark: '#00e676',
    onSuccess: '#000000',
    successContainer: '#388e3c',
    onSuccessContainer: '#c8e6c9',

    // Neutral (grayscale)
    neutral50: '#fafafa',
    neutral100: '#f5f5f5',
    neutral200: '#eeeeee',
    neutral300: '#e0e0e0',
    neutral400: '#bdbdbd',
    neutral500: '#9e9e9e',
    neutral600: '#757575',
    neutral700: '#616161',
    neutral800: '#424242',
    neutral900: '#212121',

    // Surfaces (pure grayscale)
    surface: '#1a1a1a',
    surfaceDim: '#141414',
    surfaceVariant: '#2a2a2a',
    surfaceContainer: '#242424',
    surfaceContainerLow: '#2e2e2e',
    surfaceContainerHigh: '#333333',
    surfaceContainerHighest: '#3d3d3d',
    onSurface: '#ffffff',
    onSurfaceVariant: 'rgba(255, 255, 255, 0.7)',

    // Outlines (subtle gray)
    outline: '#616161',
    outlineVariant: '#757575',

    // Brand accent (muted for focus)
    accent: '#9e9e9e',
    accentLight: '#bdbdbd',
    accentDark: '#757575',

    // State layers (gray)
    stateHover: 'rgba(158, 158, 158, 0.08)',
    stateFocus: 'rgba(158, 158, 158, 0.12)',
    statePressed: 'rgba(158, 158, 158, 0.16)',
    stateDragged: 'rgba(158, 158, 158, 0.24)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: {
    // Minimal rounded corners
    xs: '2px',
    sm: '2px',
    md: '4px',
    lg: '4px',
    xl: '8px',
    full: '9999px',
  },
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 5: Executive Dashboard (Presentation)
 * Large, spacious theme for presentations and executive views
 */
export const executiveDashboardTheme: ThemeConfig = {
  id: 'executive-dashboard',
  name: 'Executive Dashboard',
  description: 'Large elements and spacious layout for presentations and leadership',
  category: 'specialized',
  mode: 'dark',

  colors: {
    // Same color palette as Midnight Command
    ...midnightCommandTheme.colors,
  },

  typography: {
    ...sharedTypography,
    // Larger fonts for better visibility at distance
    displayLarge: { size: '72px', weight: 800, lineHeight: '80px' },
    displayMedium: { size: '57px', weight: 800, lineHeight: '64px' },
    displaySmall: { size: '45px', weight: 700, lineHeight: '52px' },
    headlineLarge: { size: '40px', weight: 700, lineHeight: '48px' },
    headlineMedium: { size: '36px', weight: 700, lineHeight: '44px' },
    headlineSmall: { size: '32px', weight: 700, lineHeight: '40px' },
    titleLarge: { size: '28px', weight: 600, lineHeight: '36px' },
    titleMedium: { size: '22px', weight: 600, lineHeight: '28px' },
    titleSmall: { size: '18px', weight: 600, lineHeight: '24px' },
    bodyLarge: { size: '20px', weight: 400, lineHeight: '28px' },
    bodyMedium: { size: '18px', weight: 400, lineHeight: '26px' },
    bodySmall: { size: '16px', weight: 400, lineHeight: '24px' },
    labelLarge: { size: '18px', weight: 500, lineHeight: '24px' },
    labelMedium: { size: '16px', weight: 500, lineHeight: '20px' },
    labelSmall: { size: '14px', weight: 500, lineHeight: '18px' },
  },

  spacing: {
    // Extra generous spacing
    xs: '8px',
    sm: '12px',
    md: '18px',
    lg: '24px',
    xl: '36px',
    '2xl': '48px',
    '3xl': '72px',
  },

  radius: {
    // Larger radius for visual impact
    xs: '6px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    full: '9999px',
  },

  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 6: Cupcake (Whimsical Light)
 * Soft pastel theme with playful colors for a delightful experience
 */
export const cupcakeTheme: ThemeConfig = {
  id: 'cupcake',
  name: 'Cupcake',
  description: 'Soft pastel theme with playful colors for a delightful experience',
  category: 'standard',
  mode: 'light',

  colors: {
    // Primary (Soft Pink)
    primary: '#f48fb1',
    primaryLight: '#f8bbd9',
    primaryDark: '#ec407a',
    onPrimary: '#000000',
    primaryContainer: '#fce4ec',
    onPrimaryContainer: '#880e4f',

    // Secondary (Soft Purple)
    secondary: '#ce93d8',
    secondaryLight: '#e1bee7',
    secondaryDark: '#ab47bc',
    onSecondary: '#000000',
    secondaryContainer: '#f3e5f5',
    onSecondaryContainer: '#4a148c',

    // Tertiary (Soft Teal)
    tertiary: '#80cbc4',
    tertiaryLight: '#b2dfdb',
    tertiaryDark: '#26a69a',
    onTertiary: '#000000',
    tertiaryContainer: '#e0f2f1',
    onTertiaryContainer: '#004d40',

    // Error (Soft Red)
    error: '#ef9a9a',
    errorLight: '#ffcdd2',
    errorDark: '#e57373',
    onError: '#000000',
    errorContainer: '#ffebee',
    onErrorContainer: '#b71c1c',

    // Warning (Soft Orange)
    warning: '#ffcc80',
    warningLight: '#ffe0b2',
    warningDark: '#ffb74d',
    onWarning: '#000000',
    warningContainer: '#fff3e0',
    onWarningContainer: '#e65100',

    // Success (Soft Green)
    success: '#a5d6a7',
    successLight: '#c8e6c9',
    successDark: '#81c784',
    onSuccess: '#000000',
    successContainer: '#e8f5e9',
    onSuccessContainer: '#1b5e20',

    // Neutral
    neutral50: '#fafafa',
    neutral100: '#f5f5f5',
    neutral200: '#eeeeee',
    neutral300: '#e0e0e0',
    neutral400: '#bdbdbd',
    neutral500: '#9e9e9e',
    neutral600: '#757575',
    neutral700: '#616161',
    neutral800: '#424242',
    neutral900: '#212121',

    // Surfaces (Soft cream/pink tint)
    surface: '#fffbfe',
    surfaceDim: '#fff8fa',
    surfaceVariant: '#fff0f5',
    surfaceContainer: '#fff5f8',
    surfaceContainerLow: '#fffafc',
    surfaceContainerHigh: '#ffecf2',
    surfaceContainerHighest: '#ffe4ed',
    onSurface: '#1c1b1f',
    onSurfaceVariant: 'rgba(28, 27, 31, 0.7)',

    // Outlines (Soft pink)
    outline: '#f48fb1',
    outlineVariant: '#f8bbd9',

    // Brand accent
    accent: '#f48fb1',
    accentLight: '#f8bbd9',
    accentDark: '#ec407a',

    // State layers (pink-based)
    stateHover: 'rgba(244, 143, 177, 0.08)',
    stateFocus: 'rgba(244, 143, 177, 0.12)',
    statePressed: 'rgba(244, 143, 177, 0.16)',
    stateDragged: 'rgba(244, 143, 177, 0.24)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: {
    // Rounded, friendly corners
    xs: '6px',
    sm: '10px',
    md: '14px',
    lg: '20px',
    xl: '28px',
    full: '9999px',
  },
  elevation: sharedElevation,
  motion: sharedMotion,
};
