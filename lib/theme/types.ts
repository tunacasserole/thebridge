/**
 * TheBridge Theme System
 * Based on Material Design 3 with custom SRE-focused variants
 */

export type ThemeMode = 'light' | 'dark' | 'auto';

export type ThemeVariant =
  | 'adobe-clay'
  | 'arcade'
  | 'art-deco'
  | 'autumn-leaves'
  | 'ayu-mirage'
  | 'bubblegum-pop'
  | 'candy-shop'
  | 'canyon'
  | 'caramel'
  | 'catppuccin'
  | 'cherry-cola'
  | 'coral-reef'
  | 'cosmic-purple'
  | 'crimson'
  | 'cupcake'
  | 'cyberpunk'
  | 'cyberpunk-pink'
  | 'daylight-operations'
  | 'desert-sand'
  | 'desert-sunset'
  | 'electric'
  | 'ember'
  | 'emerald-city'
  | 'everforest'
  | 'executive-dashboard'
  | 'fluorescent'
  | 'focused-commander'
  | 'forest-moss'
  | 'github-dark'
  | 'gruvbox'
  | 'halloween'
  | 'high-contrast'
  | 'hot-lava'
  | 'industrial'
  | 'lavender-dreams'
  | 'maple-wood'
  | 'miami-vice'
  | 'midnight-command'
  | 'mint-chocolate'
  | 'mocha'
  | 'neon-burst'
  | 'neon-forest'
  | 'neon-nights'
  | 'night-owl'
  | 'nord'
  | 'oceanic-next'
  | 'one-dark'
  | 'outrun'
  | 'palenight'
  | 'peacock'
  | 'pop-art'
  | 'retro-computer'
  | 'retro-diner'
  | 'rose-pine'
  | 'rust-copper'
  | 'solarized'
  | 'spring-bloom'
  | 'summer-sky'
  | 'sunset-blaze'
  | 'sunset-boulevard'
  | 'synthwave-84'
  | 'tangerine-dream'
  | 'terminal-green'
  | 'terracotta'
  | 'tokyo-neon'
  | 'tokyo-night'
  | 'tropical-punch'
  | 'vaporwave'
  | 'vintage-poster'
  | 'volcanic';

export type DensityLevel = 'compact' | 'comfortable' | 'spacious';

export type MotionPreference = 'reduced' | 'standard' | 'enhanced';

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  // Identity
  id: ThemeVariant;
  name: string;
  description: string;
  category: 'standard' | 'accessibility' | 'specialized';

  // Mode
  mode: 'light' | 'dark';

  // Colors (Material Design 3 color roles)
  colors: {
    // Primary palette
    primary: string;
    primaryLight: string;
    primaryDark: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;

    // Secondary palette
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;

    // Tertiary palette
    tertiary: string;
    tertiaryLight: string;
    tertiaryDark: string;
    onTertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;

    // Error palette
    error: string;
    errorLight: string;
    errorDark: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;

    // Warning palette (custom for SRE)
    warning: string;
    warningLight: string;
    warningDark: string;
    onWarning: string;
    warningContainer: string;
    onWarningContainer: string;

    // Success palette (custom for SRE)
    success: string;
    successLight: string;
    successDark: string;
    onSuccess: string;
    successContainer: string;
    onSuccessContainer: string;

    // Neutral palette
    neutral50: string;
    neutral100: string;
    neutral200: string;
    neutral300: string;
    neutral400: string;
    neutral500: string;
    neutral600: string;
    neutral700: string;
    neutral800: string;
    neutral900: string;

    // Surface colors (elevation-based)
    surface: string;
    surfaceDim: string;
    surfaceVariant: string;
    surfaceContainer: string;
    surfaceContainerLow: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    onSurface: string;
    onSurfaceVariant: string;

    // Outline colors
    outline: string;
    outlineVariant: string;

    // Brand accent (TheBridge yellow)
    accent: string;
    accentLight: string;
    accentDark: string;

    // State layers
    stateHover: string;
    stateFocus: string;
    statePressed: string;
    stateDragged: string;
  };

  // Typography
  typography: {
    displayFont: string;
    bodyFont: string;
    monoFont: string;

    // Type scale (MD3)
    displayLarge: { size: string; weight: number; lineHeight: string };
    displayMedium: { size: string; weight: number; lineHeight: string };
    displaySmall: { size: string; weight: number; lineHeight: string };
    headlineLarge: { size: string; weight: number; lineHeight: string };
    headlineMedium: { size: string; weight: number; lineHeight: string };
    headlineSmall: { size: string; weight: number; lineHeight: string };
    titleLarge: { size: string; weight: number; lineHeight: string };
    titleMedium: { size: string; weight: number; lineHeight: string };
    titleSmall: { size: string; weight: number; lineHeight: string };
    bodyLarge: { size: string; weight: number; lineHeight: string };
    bodyMedium: { size: string; weight: number; lineHeight: string };
    bodySmall: { size: string; weight: number; lineHeight: string };
    labelLarge: { size: string; weight: number; lineHeight: string };
    labelMedium: { size: string; weight: number; lineHeight: string };
    labelSmall: { size: string; weight: number; lineHeight: string };
  };

  // Spacing (MD3)
  spacing: {
    xs: string;   // 4px
    sm: string;   // 8px
    md: string;   // 12px
    lg: string;   // 16px
    xl: string;   // 24px
    '2xl': string; // 32px
    '3xl': string; // 48px
  };

  // Border radius
  radius: {
    xs: string;   // 4px
    sm: string;   // 8px
    md: string;   // 12px
    lg: string;   // 16px
    xl: string;   // 24px
    full: string; // 9999px
  };

  // Elevation (shadows)
  elevation: {
    level0: string; // No shadow
    level1: string; // 1dp
    level2: string; // 3dp
    level3: string; // 6dp
    level4: string; // 8dp
    level5: string; // 12dp
  };

  // Motion (MD3)
  motion: {
    durationShort1: string; // 50ms
    durationShort2: string; // 100ms
    durationMedium1: string; // 250ms
    durationMedium2: string; // 300ms
    durationLong1: string; // 400ms
    durationLong2: string; // 500ms

    easingStandard: string; // cubic-bezier(0.2, 0.0, 0, 1.0)
    easingEmphasized: string; // cubic-bezier(0.0, 0.0, 0, 1.0)
    easingDecelerate: string; // cubic-bezier(0.0, 0.0, 0.2, 1.0)
    easingAccelerate: string; // cubic-bezier(0.4, 0.0, 1, 1.0)
  };
}

/**
 * User preferences
 */
export interface ThemePreferences {
  variant: ThemeVariant;
  mode: ThemeMode; // auto respects system preference
  density: DensityLevel;
  motion: MotionPreference;

  // Feature flags
  soundAlerts: boolean;
  compactMetrics: boolean;
  showSparklines: boolean;

  // Customization
  customColors?: Partial<ThemeConfig['colors']>;
}

/**
 * Theme context value
 */
export interface ThemeContextValue {
  // Current state
  currentTheme: ThemeConfig;
  preferences: ThemePreferences;

  // System detection
  systemPreference: 'light' | 'dark';
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;

  // Actions
  setThemeVariant: (variant: ThemeVariant) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDensity: (density: DensityLevel) => void;
  setMotion: (motion: MotionPreference) => void;
  updatePreferences: (preferences: Partial<ThemePreferences>) => void;
  resetToDefaults: () => void;
}

/**
 * CSS variable mapping
 */
export type CSSVariables = Record<string, string>;
