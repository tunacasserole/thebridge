/**
 * Developer-Focused Themes
 * Popular developer color schemes and editor themes
 */

import type { ThemeConfig } from './types';
import { sharedTypography, sharedSpacing, sharedRadius, sharedElevation, sharedMotion } from './shared';

/**
 * Theme 7: Terminal Green (Retro)
 * Classic green-on-black terminal aesthetic for power users
 */
export const terminalGreenTheme: ThemeConfig = {
  id: 'terminal-green',
  name: 'Terminal Green',
  description: 'Classic green-on-black terminal aesthetic',
  category: 'specialized',
  mode: 'dark',

  colors: {
    // Green monochrome
    primary: '#00ff00',
    primaryLight: '#33ff33',
    primaryDark: '#00cc00',
    onPrimary: '#000000',
    primaryContainer: '#009900',
    onPrimaryContainer: '#ccffcc',

    secondary: '#00ff00',
    secondaryLight: '#33ff33',
    secondaryDark: '#00cc00',
    onSecondary: '#000000',
    secondaryContainer: '#009900',
    onSecondaryContainer: '#ccffcc',

    tertiary: '#00ff00',
    tertiaryLight: '#33ff33',
    tertiaryDark: '#00cc00',
    onTertiary: '#000000',
    tertiaryContainer: '#009900',
    onTertiaryContainer: '#ccffcc',

    // Semantic colors (green variants)
    error: '#ff3333',
    errorLight: '#ff6666',
    errorDark: '#cc0000',
    onError: '#000000',
    errorContainer: '#990000',
    onErrorContainer: '#ffcccc',

    warning: '#ffff00',
    warningLight: '#ffff66',
    warningDark: '#cccc00',
    onWarning: '#000000',
    warningContainer: '#999900',
    onWarningContainer: '#ffffcc',

    success: '#00ff00',
    successLight: '#66ff66',
    successDark: '#00cc00',
    onSuccess: '#000000',
    successContainer: '#009900',
    onSuccessContainer: '#ccffcc',

    // Neutral (green-tinted)
    neutral50: '#e6ffe6',
    neutral100: '#ccffcc',
    neutral200: '#99ff99',
    neutral300: '#66ff66',
    neutral400: '#33ff33',
    neutral500: '#00ff00',
    neutral600: '#00cc00',
    neutral700: '#009900',
    neutral800: '#006600',
    neutral900: '#003300',

    // Surfaces (pure black)
    surface: '#000000',
    surfaceDim: '#001100',
    surfaceVariant: '#002200',
    surfaceContainer: '#001100',
    surfaceContainerLow: '#002200',
    surfaceContainerHigh: '#003300',
    surfaceContainerHighest: '#004400',
    onSurface: '#00ff00',
    onSurfaceVariant: 'rgba(0, 255, 0, 0.7)',

    // Outlines (bright green)
    outline: '#00ff00',
    outlineVariant: '#33ff33',

    // Brand accent (green)
    accent: '#00ff00',
    accentLight: '#33ff33',
    accentDark: '#00cc00',

    // State layers (green)
    stateHover: 'rgba(0, 255, 0, 0.08)',
    stateFocus: 'rgba(0, 255, 0, 0.12)',
    statePressed: 'rgba(0, 255, 0, 0.16)',
    stateDragged: 'rgba(0, 255, 0, 0.24)',
  },

  typography: {
    // All monospace
    displayFont: "'JetBrains Mono', 'IBM Plex Mono', 'Consolas', monospace",
    bodyFont: "'JetBrains Mono', 'IBM Plex Mono', 'Consolas', monospace",
    monoFont: "'JetBrains Mono', 'IBM Plex Mono', 'Consolas', monospace",
    // Spread after custom fonts so we get the type scale
    ...sharedTypography.displayLarge && {
      displayLarge: sharedTypography.displayLarge,
      displayMedium: sharedTypography.displayMedium,
      displaySmall: sharedTypography.displaySmall,
      headlineLarge: sharedTypography.headlineLarge,
      headlineMedium: sharedTypography.headlineMedium,
      headlineSmall: sharedTypography.headlineSmall,
      titleLarge: sharedTypography.titleLarge,
      titleMedium: sharedTypography.titleMedium,
      titleSmall: sharedTypography.titleSmall,
      bodyLarge: sharedTypography.bodyLarge,
      bodyMedium: sharedTypography.bodyMedium,
      bodySmall: sharedTypography.bodySmall,
      labelLarge: sharedTypography.labelLarge,
      labelMedium: sharedTypography.labelMedium,
      labelSmall: sharedTypography.labelSmall,
    },
  },

  spacing: sharedSpacing,
  radius: {
    // Sharp corners for terminal aesthetic
    xs: '0px',
    sm: '0px',
    md: '0px',
    lg: '0px',
    xl: '0px',
    full: '0px',
  },
  elevation: {
    // No shadows in terminal
    level0: 'none',
    level1: 'none',
    level2: 'none',
    level3: 'none',
    level4: 'none',
    level5: 'none',
  },
  motion: sharedMotion,
};

/**
 * Theme 8: Cyberpunk Neon
 * High saturation neon colors with vibrant energy
 */
export const cyberpunkTheme: ThemeConfig = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  description: 'Neon-soaked theme with vibrant saturated colors',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Electric Blue)
    primary: '#00d9ff',
    primaryLight: '#5dffff',
    primaryDark: '#00a6cc',
    onPrimary: '#000000',
    primaryContainer: '#0080a3',
    onPrimaryContainer: '#b3f0ff',

    // Secondary (Hot Pink)
    secondary: '#ff2a6d',
    secondaryLight: '#ff5c8d',
    secondaryDark: '#d01257',
    onSecondary: '#ffffff',
    secondaryContainer: '#a80042',
    onSecondaryContainer: '#ffb3d1',

    // Tertiary (Acid Green)
    tertiary: '#01ff70',
    tertiaryLight: '#39ff8f',
    tertiaryDark: '#00d65c',
    onTertiary: '#000000',
    tertiaryContainer: '#00a347',
    onTertiaryContainer: '#b3ffdb',

    // Error
    error: '#ff3864',
    errorLight: '#ff6b8a',
    errorDark: '#d6154f',
    onError: '#ffffff',
    errorContainer: '#a8003d',
    onErrorContainer: '#ffb3c7',

    // Warning
    warning: '#ffbd00',
    warningLight: '#ffd147',
    warningDark: '#d69e00',
    onWarning: '#000000',
    warningContainer: '#a37800',
    onWarningContainer: '#ffebb3',

    // Success
    success: '#05ffa1',
    successLight: '#3dffb8',
    successDark: '#00d684',
    onSuccess: '#000000',
    successContainer: '#00a368',
    onSuccessContainer: '#b3ffe5',

    // Neutral
    neutral50: '#f0f0f0',
    neutral100: '#e0e0e0',
    neutral200: '#c2c2c2',
    neutral300: '#a3a3a3',
    neutral400: '#858585',
    neutral500: '#666666',
    neutral600: '#4d4d4d',
    neutral700: '#333333',
    neutral800: '#1f1f1f',
    neutral900: '#0a0a0a',

    // Surfaces (Dark purple-blue)
    surface: '#0a0e27',
    surfaceDim: '#080b1f',
    surfaceVariant: '#0f1432',
    surfaceContainer: '#12162e',
    surfaceContainerLow: '#151a38',
    surfaceContainerHigh: '#1a1f42',
    surfaceContainerHighest: '#1f244d',
    onSurface: '#e0e0ff',
    onSurfaceVariant: 'rgba(224, 224, 255, 0.75)',

    // Outlines (Neon Cyan)
    outline: '#00d9ff',
    outlineVariant: '#5dffff',

    // Brand accent
    accent: '#ff2a6d',
    accentLight: '#ff5c8d',
    accentDark: '#d01257',

    // State layers
    stateHover: 'rgba(0, 217, 255, 0.12)',
    stateFocus: 'rgba(0, 217, 255, 0.18)',
    statePressed: 'rgba(0, 217, 255, 0.24)',
    stateDragged: 'rgba(0, 217, 255, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 9: Nord Aurora
 * Muted pastel theme inspired by Nordic design
 */
export const nordTheme: ThemeConfig = {
  id: 'nord',
  name: 'Nord Aurora',
  description: 'Soft Nordic-inspired theme with calm muted tones',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Nord Frost Blue)
    primary: '#88c0d0',
    primaryLight: '#a3d4e3',
    primaryDark: '#6fa3b8',
    onPrimary: '#2e3440',
    primaryContainer: '#5e81ac',
    onPrimaryContainer: '#d8dee9',

    // Secondary (Nord Aurora Purple)
    secondary: '#b48ead',
    secondaryLight: '#c7a7c4',
    secondaryDark: '#9a7197',
    onSecondary: '#2e3440',
    secondaryContainer: '#8f5f88',
    onSecondaryContainer: '#e5d9e3',

    // Tertiary (Nord Frost Teal)
    tertiary: '#8fbcbb',
    tertiaryLight: '#a8d0cf',
    tertiaryDark: '#739f9e',
    onTertiary: '#2e3440',
    tertiaryContainer: '#5e8f8e',
    onTertiaryContainer: '#d9e8e7',

    // Error (Nord Aurora Red)
    error: '#bf616a',
    errorLight: '#d08080',
    errorDark: '#a04d55',
    onError: '#2e3440',
    errorContainer: '#8a3f47',
    onErrorContainer: '#e8d0d3',

    // Warning (Nord Aurora Orange)
    warning: '#d08770',
    warningLight: '#dca38c',
    warningDark: '#b36d5c',
    onWarning: '#2e3440',
    warningContainer: '#9a5644',
    onWarningContainer: '#edddd6',

    // Success (Nord Aurora Green)
    success: '#a3be8c',
    successLight: '#b8d1a4',
    successDark: '#8aa372',
    onSuccess: '#2e3440',
    successContainer: '#748c5a',
    onSuccessContainer: '#e3eedd',

    // Neutral (Nord Polar Night to Snow Storm)
    neutral50: '#eceff4',
    neutral100: '#e5e9f0',
    neutral200: '#d8dee9',
    neutral300: '#c4cad9',
    neutral400: '#9099a8',
    neutral500: '#646f87',
    neutral600: '#4c566a',
    neutral700: '#434c5e',
    neutral800: '#3b4252',
    neutral900: '#2e3440',

    // Surfaces (Nord Polar Night)
    surface: '#2e3440',
    surfaceDim: '#242933',
    surfaceVariant: '#3b4252',
    surfaceContainer: '#353b49',
    surfaceContainerLow: '#3e4654',
    surfaceContainerHigh: '#434c5e',
    surfaceContainerHighest: '#4c566a',
    onSurface: '#eceff4',
    onSurfaceVariant: 'rgba(236, 239, 244, 0.7)',

    // Outlines (Nord Frost)
    outline: '#88c0d0',
    outlineVariant: '#a3d4e3',

    // Brand accent
    accent: '#5e81ac',
    accentLight: '#88c0d0',
    accentDark: '#4c6a8f',

    // State layers
    stateHover: 'rgba(136, 192, 208, 0.12)',
    stateFocus: 'rgba(136, 192, 208, 0.18)',
    statePressed: 'rgba(136, 192, 208, 0.24)',
    stateDragged: 'rgba(136, 192, 208, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 10: Solarized
 * Popular balanced theme with carefully chosen mid-tones
 */
export const solarizedTheme: ThemeConfig = {
  id: 'solarized',
  name: 'Solarized',
  description: 'Popular classic with balanced, easy-on-the-eyes colors',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#268bd2',
    primaryLight: '#4ca3e3',
    primaryDark: '#1e6fb8',
    onPrimary: '#fdf6e3',
    primaryContainer: '#185a9d',
    onPrimaryContainer: '#cbe4f5',

    // Secondary (Violet)
    secondary: '#6c71c4',
    secondaryLight: '#8d91d6',
    secondaryDark: '#5558a8',
    onSecondary: '#fdf6e3',
    secondaryContainer: '#40438a',
    onSecondaryContainer: '#d8dae8',

    // Tertiary (Cyan)
    tertiary: '#2aa198',
    tertiaryLight: '#4fbfb5',
    tertiaryDark: '#208680',
    onTertiary: '#fdf6e3',
    onTertiaryContainer: '#c9ebe9',
    tertiaryContainer: '#186a64',

    // Error (Red)
    error: '#dc322f',
    errorLight: '#e55855',
    errorDark: '#b82725',
    onError: '#fdf6e3',
    errorContainer: '#961d1b',
    onErrorContainer: '#f3c4c3',

    // Warning (Orange)
    warning: '#cb4b16',
    warningLight: '#d96c3f',
    warningDark: '#a83c11',
    onWarning: '#fdf6e3',
    warningContainer: '#862d0e',
    onWarningContainer: '#ecc5b5',

    // Success (Green)
    success: '#859900',
    successLight: '#a0b520',
    successDark: '#6b7d00',
    onSuccess: '#fdf6e3',
    successContainer: '#526300',
    onSuccessContainer: '#dce5b3',

    // Neutral (Solarized Base)
    neutral50: '#fdf6e3',
    neutral100: '#eee8d5',
    neutral200: '#93a1a1',
    neutral300: '#839496',
    neutral400: '#657b83',
    neutral500: '#586e75',
    neutral600: '#073642',
    neutral700: '#002b36',
    neutral800: '#001e26',
    neutral900: '#001519',

    // Surfaces (Solarized Dark Base)
    surface: '#002b36',
    surfaceDim: '#001e26',
    surfaceVariant: '#073642',
    surfaceContainer: '#033845',
    surfaceContainerLow: '#084654',
    surfaceContainerHigh: '#0d5463',
    surfaceContainerHighest: '#126272',
    onSurface: '#fdf6e3',
    onSurfaceVariant: 'rgba(253, 246, 227, 0.75)',

    // Outlines (Yellow)
    outline: '#b58900',
    outlineVariant: '#cba520',

    // Brand accent
    accent: '#b58900',
    accentLight: '#cba520',
    accentDark: '#9a7300',

    // State layers
    stateHover: 'rgba(38, 139, 210, 0.12)',
    stateFocus: 'rgba(38, 139, 210, 0.18)',
    statePressed: 'rgba(38, 139, 210, 0.24)',
    stateDragged: 'rgba(38, 139, 210, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 11: Gruvbox Medium
 * Warm retro theme with medium contrast and earthy tones
 */
export const gruvboxTheme: ThemeConfig = {
  id: 'gruvbox',
  name: 'Gruvbox Medium',
  description: 'Warm earthy theme with comfortable medium contrast',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#83a598',
    primaryLight: '#a3c0b5',
    primaryDark: '#6b8a7b',
    onPrimary: '#282828',
    primaryContainer: '#458588',
    onPrimaryContainer: '#d5e3e0',

    // Secondary (Purple)
    secondary: '#d3869b',
    secondaryLight: '#e3a8b8',
    secondaryDark: '#b36b7f',
    onSecondary: '#282828',
    secondaryContainer: '#b16286',
    onSecondaryContainer: '#f0dce3',

    // Tertiary (Aqua)
    tertiary: '#8ec07c',
    tertiaryLight: '#aed99a',
    tertiaryDark: '#72a060',
    onTertiary: '#282828',
    tertiaryContainer: '#689d6a',
    onTertiaryContainer: '#dcefd5',

    // Error (Red)
    error: '#fb4934',
    errorLight: '#fc6d5d',
    errorDark: '#cc241d',
    onError: '#282828',
    errorContainer: '#9d0006',
    onErrorContainer: '#fdc4bf',

    // Warning (Orange)
    warning: '#fe8019',
    warningLight: '#fe9d47',
    warningDark: '#d65d0e',
    onWarning: '#282828',
    warningContainer: '#af3a03',
    onWarningContainer: '#fed9bf',

    // Success (Green)
    success: '#b8bb26',
    successLight: '#c9cc51',
    successDark: '#98971a',
    onSuccess: '#282828',
    successContainer: '#79740e',
    onSuccessContainer: '#e8e9b8',

    // Neutral
    neutral50: '#fbf1c7',
    neutral100: '#ebdbb2',
    neutral200: '#d5c4a1',
    neutral300: '#bdae93',
    neutral400: '#a89984',
    neutral500: '#928374',
    neutral600: '#665c54',
    neutral700: '#504945',
    neutral800: '#3c3836',
    neutral900: '#282828',

    // Surfaces (Gruvbox Medium)
    surface: '#3c3836',
    surfaceDim: '#32302f',
    surfaceVariant: '#504945',
    surfaceContainer: '#45403d',
    surfaceContainerLow: '#4d4742',
    surfaceContainerHigh: '#5a534e',
    surfaceContainerHighest: '#665c54',
    onSurface: '#ebdbb2',
    onSurfaceVariant: 'rgba(235, 219, 178, 0.75)',

    // Outlines (Yellow)
    outline: '#fabd2f',
    outlineVariant: '#d79921',

    // Brand accent
    accent: '#fabd2f',
    accentLight: '#fbd35d',
    accentDark: '#d79921',

    // State layers
    stateHover: 'rgba(250, 189, 47, 0.12)',
    stateFocus: 'rgba(250, 189, 47, 0.18)',
    statePressed: 'rgba(250, 189, 47, 0.24)',
    stateDragged: 'rgba(250, 189, 47, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 12: One Dark
 * Atom's iconic theme with balanced medium-dark and great contrast
 */
export const oneDarkTheme: ThemeConfig = {
  id: 'one-dark',
  name: 'One Dark',
  description: "Atom's iconic theme with balanced medium-dark and great contrast",
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#61afef',
    primaryLight: '#84c0f4',
    primaryDark: '#4e9ad9',
    onPrimary: '#282c34',
    primaryContainer: '#3b7bb5',
    onPrimaryContainer: '#d7eaf8',

    // Secondary (Purple)
    secondary: '#c678dd',
    secondaryLight: '#d499e6',
    secondaryDark: '#b360cc',
    onSecondary: '#282c34',
    secondaryContainer: '#9d4ebb',
    onSecondaryContainer: '#f0e0f7',

    // Tertiary (Cyan)
    tertiary: '#56b6c2',
    tertiaryLight: '#7acad4',
    tertiaryDark: '#4a9aa4',
    onTertiary: '#282c34',
    tertiaryContainer: '#3c7e87',
    onTertiaryContainer: '#d7f0f3',

    // Error (Red)
    error: '#e06c75',
    errorLight: '#e98891',
    errorDark: '#d05763',
    onError: '#282c34',
    errorContainer: '#b8444f',
    onErrorContainer: '#f7d8db',

    // Warning (Orange)
    warning: '#d19a66',
    warningLight: '#ddb085',
    warningDark: '#c08552',
    onWarning: '#282c34',
    warningContainer: '#a86f42',
    onWarningContainer: '#f3e5d9',

    // Success (Green)
    success: '#98c379',
    successLight: '#afd095',
    successDark: '#84af64',
    onSuccess: '#282c34',
    successContainer: '#6f9c51',
    onSuccessContainer: '#e5f3dc',

    // Neutral
    neutral50: '#dcdfe4',
    neutral100: '#c8ccd4',
    neutral200: '#abb2bf',
    neutral300: '#9196a1',
    neutral400: '#6e7582',
    neutral500: '#5c6370',
    neutral600: '#4b5263',
    neutral700: '#3e4451',
    neutral800: '#343842',
    neutral900: '#282c34',

    // Surfaces (One Dark base)
    surface: '#282c34',
    surfaceDim: '#21252b',
    surfaceVariant: '#2c313a',
    surfaceContainer: '#30353e',
    surfaceContainerLow: '#343942',
    surfaceContainerHigh: '#383d47',
    surfaceContainerHighest: '#3e4451',
    onSurface: '#abb2bf',
    onSurfaceVariant: 'rgba(171, 178, 191, 0.75)',

    // Outlines
    outline: '#61afef',
    outlineVariant: '#84c0f4',

    // Brand accent
    accent: '#61afef',
    accentLight: '#84c0f4',
    accentDark: '#4e9ad9',

    // State layers
    stateHover: 'rgba(97, 175, 239, 0.12)',
    stateFocus: 'rgba(97, 175, 239, 0.18)',
    statePressed: 'rgba(97, 175, 239, 0.24)',
    stateDragged: 'rgba(97, 175, 239, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 13: Tokyo Night
 * Popular VS Code theme with vibrant purples and blues
 */
export const tokyoNightTheme: ThemeConfig = {
  id: 'tokyo-night',
  name: 'Tokyo Night',
  description: 'Popular VS Code theme with vibrant purples and blues',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#7aa2f7',
    primaryLight: '#9ab8f9',
    primaryDark: '#5f8ee6',
    onPrimary: '#1a1b26',
    primaryContainer: '#4a6bb5',
    onPrimaryContainer: '#dce5fb',

    // Secondary (Purple)
    secondary: '#bb9af7',
    secondaryLight: '#cdb3f9',
    secondaryDark: '#a781e6',
    onSecondary: '#1a1b26',
    secondaryContainer: '#8965c0',
    onSecondaryContainer: '#eee5fb',

    // Tertiary (Cyan)
    tertiary: '#7dcfff',
    tertiaryLight: '#9ddcff',
    tertiaryDark: '#63bfed',
    onTertiary: '#1a1b26',
    tertiaryContainer: '#4d9cc7',
    onTertiaryContainer: '#dcf2ff',

    // Error (Red)
    error: '#f7768e',
    errorLight: '#f99aac',
    errorDark: '#e55c77',
    onError: '#1a1b26',
    errorContainer: '#c4445d',
    onErrorContainer: '#fcd9df',

    // Warning (Orange)
    warning: '#ff9e64',
    warningLight: '#ffb485',
    warningDark: '#ed864d',
    onWarning: '#1a1b26',
    warningContainer: '#c76f3d',
    onWarningContainer: '#ffe5d9',

    // Success (Green)
    success: '#9ece6a',
    successLight: '#b4dc8a',
    successDark: '#88bd53',
    onSuccess: '#1a1b26',
    successContainer: '#72a042',
    onSuccessContainer: '#e7f5db',

    // Neutral
    neutral50: '#d5d6db',
    neutral100: '#c0c1c9',
    neutral200: '#a9b1d6',
    neutral300: '#8b94b8',
    neutral400: '#6b7399',
    neutral500: '#565f89',
    neutral600: '#414868',
    neutral700: '#33374c',
    neutral800: '#24283b',
    neutral900: '#1a1b26',

    // Surfaces (Tokyo Night base)
    surface: '#1a1b26',
    surfaceDim: '#16161e',
    surfaceVariant: '#1f202d',
    surfaceContainer: '#24283b',
    surfaceContainerLow: '#292e42',
    surfaceContainerHigh: '#2f3549',
    surfaceContainerHighest: '#363c52',
    onSurface: '#c0caf5',
    onSurfaceVariant: 'rgba(192, 202, 245, 0.75)',

    // Outlines
    outline: '#7aa2f7',
    outlineVariant: '#9ab8f9',

    // Brand accent
    accent: '#7aa2f7',
    accentLight: '#9ab8f9',
    accentDark: '#5f8ee6',

    // State layers
    stateHover: 'rgba(122, 162, 247, 0.12)',
    stateFocus: 'rgba(122, 162, 247, 0.18)',
    statePressed: 'rgba(122, 162, 247, 0.24)',
    stateDragged: 'rgba(122, 162, 247, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 14: Catppuccin Mocha
 * Soothing pastel palette on warm dark base
 */
export const catppuccinTheme: ThemeConfig = {
  id: 'catppuccin',
  name: 'Catppuccin Mocha',
  description: 'Soothing pastel palette on warm dark base',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#89b4fa',
    primaryLight: '#a6c7fb',
    primaryDark: '#6fa0e8',
    onPrimary: '#1e1e2e',
    primaryContainer: '#5585c7',
    onPrimaryContainer: '#dce9fd',

    // Secondary (Mauve)
    secondary: '#cba6f7',
    secondaryLight: '#dcc2f9',
    secondaryDark: '#b88de5',
    onSecondary: '#1e1e2e',
    secondaryContainer: '#9570c4',
    onSecondaryContainer: '#f0e5fc',

    // Tertiary (Teal)
    tertiary: '#94e2d5',
    tertiaryLight: '#adeee4',
    tertiaryDark: '#7dcfc3',
    onTertiary: '#1e1e2e',
    tertiaryContainer: '#65b3a8',
    onTertiaryContainer: '#e2f7f3',

    // Error (Red)
    error: '#f38ba8',
    errorLight: '#f6a7bd',
    errorDark: '#e07093',
    onError: '#1e1e2e',
    errorContainer: '#c15678',
    onErrorContainer: '#fce0e7',

    // Warning (Peach)
    warning: '#fab387',
    warningLight: '#fcc5a2',
    warningDark: '#e89d6d',
    onWarning: '#1e1e2e',
    warningContainer: '#c87f56',
    onWarningContainer: '#fde8dd',

    // Success (Green)
    success: '#a6e3a1',
    successLight: '#beedb9',
    successDark: '#8fd088',
    onSuccess: '#1e1e2e',
    successContainer: '#74b46f',
    onSuccessContainer: '#e7f7e6',

    // Neutral (Mocha base)
    neutral50: '#f5e0dc',
    neutral100: '#f2cdcd',
    neutral200: '#cdd6f4',
    neutral300: '#bac2de',
    neutral400: '#a6adc8',
    neutral500: '#9399b2',
    neutral600: '#7f849c',
    neutral700: '#6c7086',
    neutral800: '#585b70',
    neutral900: '#45475a',

    // Surfaces (Catppuccin Mocha)
    surface: '#1e1e2e',
    surfaceDim: '#181825',
    surfaceVariant: '#313244',
    surfaceContainer: '#24243a',
    surfaceContainerLow: '#2a2a40',
    surfaceContainerHigh: '#383850',
    surfaceContainerHighest: '#45475a',
    onSurface: '#cdd6f4',
    onSurfaceVariant: 'rgba(205, 214, 244, 0.75)',

    // Outlines
    outline: '#89b4fa',
    outlineVariant: '#a6c7fb',

    // Brand accent
    accent: '#f5c2e7',
    accentLight: '#f9d8f1',
    accentDark: '#e0a8d5',

    // State layers
    stateHover: 'rgba(137, 180, 250, 0.12)',
    stateFocus: 'rgba(137, 180, 250, 0.18)',
    statePressed: 'rgba(137, 180, 250, 0.24)',
    stateDragged: 'rgba(137, 180, 250, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 15: Everforest
 * Green-tinted theme inspired by forests, easy on the eyes
 */
export const everforestTheme: ThemeConfig = {
  id: 'everforest',
  name: 'Everforest',
  description: 'Green-tinted theme inspired by forests, easy on the eyes',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Green)
    primary: '#a7c080',
    primaryLight: '#bcd09a',
    primaryDark: '#92ab6a',
    onPrimary: '#2d353b',
    primaryContainer: '#7a925a',
    onPrimaryContainer: '#e3eed9',

    // Secondary (Aqua)
    secondary: '#83c092',
    secondaryLight: '#9dd0a7',
    secondaryDark: '#6faa7c',
    onSecondary: '#2d353b',
    secondaryContainer: '#5a8f66',
    onSecondaryContainer: '#dff0e4',

    // Tertiary (Blue)
    tertiary: '#7fbbb3',
    tertiaryLight: '#9bcec7',
    tertiaryDark: '#68a59e',
    onTertiary: '#2d353b',
    tertiaryContainer: '#528a84',
    onTertiaryContainer: '#ddeee9',

    // Error (Red)
    error: '#e67e80',
    errorLight: '#ed9a9c',
    errorDark: '#d36769',
    onError: '#2d353b',
    errorContainer: '#b45355',
    onErrorContainer: '#f9dfe0',

    // Warning (Orange)
    warning: '#e69875',
    warningLight: '#edaf92',
    warningDark: '#d38161',
    onWarning: '#2d353b',
    warningContainer: '#b46950',
    onWarningContainer: '#f9e4dc',

    // Success (Green)
    success: '#a7c080',
    successLight: '#bcd09a',
    successDark: '#92ab6a',
    onSuccess: '#2d353b',
    successContainer: '#7a925a',
    onSuccessContainer: '#e3eed9',

    // Neutral
    neutral50: '#d3c6aa',
    neutral100: '#c5b597',
    neutral200: '#9da68d',
    neutral300: '#859289',
    neutral400: '#7a8478',
    neutral500: '#5d6b66',
    neutral600: '#475258',
    neutral700: '#3a464a',
    neutral800: '#343f44',
    neutral900: '#2d353b',

    // Surfaces (Everforest base)
    surface: '#2d353b',
    surfaceDim: '#272e33',
    surfaceVariant: '#343f44',
    surfaceContainer: '#2f3a3f',
    surfaceContainerLow: '#323d42',
    surfaceContainerHigh: '#3d4f51',
    surfaceContainerHighest: '#475258',
    onSurface: '#d3c6aa',
    onSurfaceVariant: 'rgba(211, 198, 170, 0.75)',

    // Outlines
    outline: '#a7c080',
    outlineVariant: '#bcd09a',

    // Brand accent
    accent: '#dbbc7f',
    accentLight: '#e7ce99',
    accentDark: '#c8a869',

    // State layers
    stateHover: 'rgba(167, 192, 128, 0.12)',
    stateFocus: 'rgba(167, 192, 128, 0.18)',
    statePressed: 'rgba(167, 192, 128, 0.24)',
    stateDragged: 'rgba(167, 192, 128, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 16: Rosé Pine
 * Low-contrast theme with muted pastels and warm tones
 */
export const rosePineTheme: ThemeConfig = {
  id: 'rose-pine',
  name: 'Rosé Pine',
  description: 'Low-contrast theme with muted pastels and warm tones',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Foam)
    primary: '#9ccfd8',
    primaryLight: '#b4dde3',
    primaryDark: '#85bac1',
    onPrimary: '#191724',
    primaryContainer: '#6c9ca4',
    onPrimaryContainer: '#e0f0f2',

    // Secondary (Rose)
    secondary: '#ebbcba',
    secondaryLight: '#f1cfc9',
    secondaryDark: '#dfa8a4',
    onSecondary: '#191724',
    secondaryContainer: '#c59491',
    onSecondaryContainer: '#f9eeec',

    // Tertiary (Iris)
    tertiary: '#c4a7e7',
    tertiaryLight: '#d4bff0',
    tertiaryDark: '#b18fd9',
    onTertiary: '#191724',
    tertiaryContainer: '#9877c1',
    onTertiaryContainer: '#f0e9f8',

    // Error (Love)
    error: '#eb6f92',
    errorLight: '#f18da9',
    errorDark: '#d95a7c',
    onError: '#191724',
    errorContainer: '#bb4767',
    onErrorContainer: '#f9dde4',

    // Warning (Gold)
    warning: '#f6c177',
    warningLight: '#f9d195',
    warningDark: '#ecab5f',
    onWarning: '#191724',
    warningContainer: '#d4954c',
    onWarningContainer: '#fcefd9',

    // Success (Pine)
    success: '#31748f',
    successLight: '#5090a8',
    successDark: '#265e76',
    onSuccess: '#e0def4',
    successContainer: '#1e4d60',
    onSuccessContainer: '#d1e8f0',

    // Neutral (Base)
    neutral50: '#e0def4',
    neutral100: '#d0cce6',
    neutral200: '#908caa',
    neutral300: '#6e6a86',
    neutral400: '#524f67',
    neutral500: '#403d52',
    neutral600: '#2a273f',
    neutral700: '#21202e',
    neutral800: '#1f1d2e',
    neutral900: '#191724',

    // Surfaces (Rosé Pine base)
    surface: '#191724',
    surfaceDim: '#16141f',
    surfaceVariant: '#1f1d2e',
    surfaceContainer: '#1c1a26',
    surfaceContainerLow: '#1e1c29',
    surfaceContainerHigh: '#26233a',
    surfaceContainerHighest: '#2a273f',
    onSurface: '#e0def4',
    onSurfaceVariant: 'rgba(224, 222, 244, 0.7)',

    // Outlines
    outline: '#9ccfd8',
    outlineVariant: '#b4dde3',

    // Brand accent
    accent: '#ebbcba',
    accentLight: '#f1cfc9',
    accentDark: '#dfa8a4',

    // State layers
    stateHover: 'rgba(156, 207, 216, 0.12)',
    stateFocus: 'rgba(156, 207, 216, 0.18)',
    statePressed: 'rgba(156, 207, 216, 0.24)',
    stateDragged: 'rgba(156, 207, 216, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 17: Oceanic Next
 * Blue-tinted theme with balanced saturation
 */
export const oceanicNextTheme: ThemeConfig = {
  id: 'oceanic-next',
  name: 'Oceanic Next',
  description: 'Blue-tinted theme with balanced saturation',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#6699cc',
    primaryLight: '#85afd9',
    primaryDark: '#5282b3',
    onPrimary: '#1b2b34',
    primaryContainer: '#3f6b99',
    onPrimaryContainer: '#d9e5f0',

    // Secondary (Purple)
    secondary: '#c594c5',
    secondaryLight: '#d5aed5',
    secondaryDark: '#b37cb3',
    onSecondary: '#1b2b34',
    secondaryContainer: '#9a669a',
    onSecondaryContainer: '#f0e5f0',

    // Tertiary (Cyan)
    tertiary: '#5fb3b3',
    tertiaryLight: '#7ec7c7',
    tertiaryDark: '#4b9a9a',
    onTertiary: '#1b2b34',
    tertiaryContainer: '#3a8080',
    onTertiaryContainer: '#d9f0f0',

    // Error (Red)
    error: '#ec5f67',
    errorLight: '#f17e85',
    errorDark: '#d84b53',
    onError: '#1b2b34',
    errorContainer: '#b93c43',
    onErrorContainer: '#fcd9db',

    // Warning (Orange)
    warning: '#f99157',
    warningLight: '#faa876',
    warningDark: '#e67a42',
    onWarning: '#1b2b34',
    warningContainer: '#cc6636',
    onWarningContainer: '#ffe5d9',

    // Success (Green)
    success: '#99c794',
    successLight: '#afd5aa',
    successDark: '#83b37c',
    onSuccess: '#1b2b34',
    successContainer: '#6f9c66',
    onSuccessContainer: '#e5f3e2',

    // Neutral
    neutral50: '#d8dee9',
    neutral100: '#cdd3de',
    neutral200: '#a7adba',
    neutral300: '#8f919d',
    neutral400: '#65737e',
    neutral500: '#4f5b66',
    neutral600: '#343d46',
    neutral700: '#2b3339',
    neutral800: '#232a2f',
    neutral900: '#1b2b34',

    // Surfaces (Oceanic Next base)
    surface: '#1b2b34',
    surfaceDim: '#16232b',
    surfaceVariant: '#232a2f',
    surfaceContainer: '#1e2a32',
    surfaceContainerLow: '#212e36',
    surfaceContainerHigh: '#2b3339',
    surfaceContainerHighest: '#343d46',
    onSurface: '#cdd3de',
    onSurfaceVariant: 'rgba(205, 211, 222, 0.75)',

    // Outlines
    outline: '#6699cc',
    outlineVariant: '#85afd9',

    // Brand accent
    accent: '#fac863',
    accentLight: '#fbd582',
    accentDark: '#e7b64e',

    // State layers
    stateHover: 'rgba(102, 153, 204, 0.12)',
    stateFocus: 'rgba(102, 153, 204, 0.18)',
    statePressed: 'rgba(102, 153, 204, 0.24)',
    stateDragged: 'rgba(102, 153, 204, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 18: GitHub Dark Dimmed
 * GitHub's professional dimmed theme with medium gray
 */
export const githubDarkTheme: ThemeConfig = {
  id: 'github-dark',
  name: 'GitHub Dark Dimmed',
  description: "GitHub's dimmed theme, not pure black, professional gray",
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#539bf5',
    primaryLight: '#6cb6ff',
    primaryDark: '#4184e4',
    onPrimary: '#22272e',
    primaryContainer: '#316dca',
    onPrimaryContainer: '#d6ebfd',

    // Secondary (Purple)
    secondary: '#b083f0',
    secondaryLight: '#c49ff4',
    secondaryDark: '#9c6ddd',
    onSecondary: '#22272e',
    secondaryContainer: '#8256d0',
    onSecondaryContainer: '#ede5fb',

    // Tertiary (Teal)
    tertiary: '#56d4dd',
    tertiaryLight: '#76e3eb',
    tertiaryDark: '#3fc1ca',
    onTertiary: '#22272e',
    tertiaryContainer: '#2da7b0',
    onTertiaryContainer: '#d6f6f8',

    // Error (Red)
    error: '#f47067',
    errorLight: '#f78d86',
    errorDark: '#e05d54',
    onError: '#22272e',
    errorContainer: '#c9493f',
    onErrorContainer: '#fde0de',

    // Warning (Orange)
    warning: '#daaa3f',
    warningLight: '#e3bf5e',
    warningDark: '#c79531',
    onWarning: '#22272e',
    warningContainer: '#ae8025',
    onWarningContainer: '#f8f0d9',

    // Success (Green)
    success: '#57ab5a',
    successLight: '#74c177',
    successDark: '#469849',
    onSuccess: '#22272e',
    successContainer: '#347d39',
    onSuccessContainer: '#ddf4de',

    // Neutral
    neutral50: '#c6cdd5',
    neutral100: '#adbac7',
    neutral200: '#909dab',
    neutral300: '#768390',
    neutral400: '#636e7b',
    neutral500: '#545d68',
    neutral600: '#444c56',
    neutral700: '#373e47',
    neutral800: '#2d333b',
    neutral900: '#22272e',

    // Surfaces (GitHub Dark Dimmed)
    surface: '#22272e',
    surfaceDim: '#1c2128',
    surfaceVariant: '#2d333b',
    surfaceContainer: '#272c34',
    surfaceContainerLow: '#2b3139',
    surfaceContainerHigh: '#373e47',
    surfaceContainerHighest: '#444c56',
    onSurface: '#adbac7',
    onSurfaceVariant: 'rgba(173, 186, 199, 0.75)',

    // Outlines
    outline: '#539bf5',
    outlineVariant: '#6cb6ff',

    // Brand accent
    accent: '#539bf5',
    accentLight: '#6cb6ff',
    accentDark: '#4184e4',

    // State layers
    stateHover: 'rgba(83, 155, 245, 0.12)',
    stateFocus: 'rgba(83, 155, 245, 0.18)',
    statePressed: 'rgba(83, 155, 245, 0.24)',
    stateDragged: 'rgba(83, 155, 245, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 19: Ayu Mirage
 * Medium version of Ayu with warm grays and balanced colors
 */
export const ayuMirageTheme: ThemeConfig = {
  id: 'ayu-mirage',
  name: 'Ayu Mirage',
  description: 'Medium version of Ayu with warm grays and balanced colors',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#5ccfe6',
    primaryLight: '#7dd9ee',
    primaryDark: '#47bbd4',
    onPrimary: '#1f2430',
    primaryContainer: '#36a0b5',
    onPrimaryContainer: '#d6f4f8',

    // Secondary (Orange)
    secondary: '#ffad66',
    secondaryLight: '#ffc085',
    secondaryDark: '#ed9a52',
    onSecondary: '#1f2430',
    secondaryContainer: '#d4843f',
    onSecondaryContainer: '#ffe9d9',

    // Tertiary (Purple)
    tertiary: '#d4bfff',
    tertiaryLight: '#e0d1ff',
    tertiaryDark: '#c1aaed',
    onTertiary: '#1f2430',
    tertiaryContainer: '#a68fd4',
    onTertiaryContainer: '#f2edff',

    // Error (Red)
    error: '#f28779',
    errorLight: '#f5a195',
    errorDark: '#e07163',
    onError: '#1f2430',
    errorContainer: '#c95d50',
    onErrorContainer: '#fce0dd',

    // Warning (Yellow)
    warning: '#ffd173',
    warningLight: '#ffdd92',
    warningDark: '#edc05e',
    onWarning: '#1f2430',
    warningContainer: '#d4a94b',
    onWarningContainer: '#fff3d9',

    // Success (Green)
    success: '#95e6cb',
    successLight: '#aeeeda',
    successDark: '#7ed4b6',
    onSuccess: '#1f2430',
    successContainer: '#68b99a',
    onSuccessContainer: '#e0f8f0',

    // Neutral
    neutral50: '#d9d7ce',
    neutral100: '#cccac2',
    neutral200: '#a6a39a',
    neutral300: '#8a8782',
    neutral400: '#707a8c',
    neutral500: '#5c6773',
    neutral600: '#454c5e',
    neutral700: '#3a4150',
    neutral800: '#2e3440',
    neutral900: '#1f2430',

    // Surfaces (Ayu Mirage)
    surface: '#1f2430',
    surfaceDim: '#191e2a',
    surfaceVariant: '#2e3440',
    surfaceContainer: '#242936',
    surfaceContainerLow: '#292e3b',
    surfaceContainerHigh: '#3a4150',
    surfaceContainerHighest: '#454c5e',
    onSurface: '#cccac2',
    onSurfaceVariant: 'rgba(204, 202, 194, 0.75)',

    // Outlines
    outline: '#5ccfe6',
    outlineVariant: '#7dd9ee',

    // Brand accent
    accent: '#ffcc66',
    accentLight: '#ffd985',
    accentDark: '#edba52',

    // State layers
    stateHover: 'rgba(92, 207, 230, 0.12)',
    stateFocus: 'rgba(92, 207, 230, 0.18)',
    statePressed: 'rgba(92, 207, 230, 0.24)',
    stateDragged: 'rgba(92, 207, 230, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 20: Night Owl
 * Sarah Drasner's popular theme, great for long sessions
 */
export const nightOwlTheme: ThemeConfig = {
  id: 'night-owl',
  name: 'Night Owl',
  description: "Sarah Drasner's popular theme, great for long sessions",
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#82aaff',
    primaryLight: '#9dc1ff',
    primaryDark: '#6a93ed',
    onPrimary: '#011627',
    primaryContainer: '#5176d4',
    onPrimaryContainer: '#dde8ff',

    // Secondary (Purple)
    secondary: '#c792ea',
    secondaryLight: '#d7aaf0',
    secondaryDark: '#b579d9',
    onSecondary: '#011627',
    secondaryContainer: '#9b62c7',
    onSecondaryContainer: '#f0e5f8',

    // Tertiary (Cyan)
    tertiary: '#7fdbca',
    tertiaryLight: '#9ce6d8',
    tertiaryDark: '#68c9b8',
    onTertiary: '#011627',
    tertiaryContainer: '#52a99b',
    onTertiaryContainer: '#dcf6f1',

    // Error (Red)
    error: '#ef5350',
    errorLight: '#f37471',
    errorDark: '#dc3f3c',
    onError: '#011627',
    errorContainer: '#c5302e',
    onErrorContainer: '#fbd7d6',

    // Warning (Orange)
    warning: '#f78c6c',
    warningLight: '#f9a58a',
    warningDark: '#e57356',
    onWarning: '#011627',
    onWarningContainer: '#fde0d9',
    warningContainer: '#cc5f43',

    // Success (Green)
    success: '#addb67',
    successLight: '#c2e685',
    successDark: '#98c952',
    onSuccess: '#011627',
    successContainer: '#80ac40',
    onSuccessContainer: '#e9f5d9',

    // Neutral
    neutral50: '#d6deeb',
    neutral100: '#c5d3e6',
    neutral200: '#a7b8cf',
    neutral300: '#8997b3',
    neutral400: '#637777',
    neutral500: '#4e5f7e',
    neutral600: '#2f4858',
    neutral700: '#1d3b53',
    neutral800: '#112840',
    neutral900: '#011627',

    // Surfaces (Night Owl)
    surface: '#011627',
    surfaceDim: '#010e1a',
    surfaceVariant: '#112840',
    surfaceContainer: '#071e30',
    surfaceContainerLow: '#0c2335',
    surfaceContainerHigh: '#1d3b53',
    surfaceContainerHighest: '#2f4858',
    onSurface: '#d6deeb',
    onSurfaceVariant: 'rgba(214, 222, 235, 0.75)',

    // Outlines
    outline: '#82aaff',
    outlineVariant: '#9dc1ff',

    // Brand accent
    accent: '#ffeb95',
    accentLight: '#fff2b3',
    accentDark: '#edd97d',

    // State layers
    stateHover: 'rgba(130, 170, 255, 0.12)',
    stateFocus: 'rgba(130, 170, 255, 0.18)',
    statePressed: 'rgba(130, 170, 255, 0.24)',
    stateDragged: 'rgba(130, 170, 255, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 21: Palenight
 * Material Theme variant with purple tones, medium contrast
 */
export const palenightTheme: ThemeConfig = {
  id: 'palenight',
  name: 'Palenight',
  description: 'Material Theme variant with purple tones, medium contrast',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Blue)
    primary: '#82aaff',
    primaryLight: '#9dc1ff',
    primaryDark: '#6a93ed',
    onPrimary: '#292d3e',
    primaryContainer: '#5176d4',
    onPrimaryContainer: '#dde8ff',

    // Secondary (Purple)
    secondary: '#c792ea',
    secondaryLight: '#d7aaf0',
    secondaryDark: '#b579d9',
    onSecondary: '#292d3e',
    secondaryContainer: '#9b62c7',
    onSecondaryContainer: '#f0e5f8',

    // Tertiary (Cyan)
    tertiary: '#89ddff',
    tertiaryLight: '#a5e8ff',
    tertiaryDark: '#6fcced',
    onTertiary: '#292d3e',
    tertiaryContainer: '#54aed4',
    onTertiaryContainer: '#ddf6ff',

    // Error (Red)
    error: '#ff5370',
    errorLight: '#ff748d',
    errorDark: '#ed3c5b',
    onError: '#292d3e',
    errorContainer: '#d42d49',
    onErrorContainer: '#ffd7dd',

    // Warning (Orange)
    warning: '#ffcb6b',
    warningLight: '#ffd989',
    warningDark: '#edb955',
    onWarning: '#292d3e',
    warningContainer: '#d4a042',
    onWarningContainer: '#fff0d9',

    // Success (Green)
    success: '#c3e88d',
    successLight: '#d1f0a5',
    successDark: '#afd975',
    onSuccess: '#292d3e',
    successContainer: '#94c45d',
    onSuccessContainer: '#ebf7dc',

    // Neutral
    neutral50: '#eeffff',
    neutral100: '#d6deeb',
    neutral200: '#c3cad9',
    neutral300: '#a6accd',
    neutral400: '#8796b0',
    neutral500: '#697098',
    neutral600: '#676e95',
    neutral700: '#595e7b',
    neutral800: '#444267',
    neutral900: '#292d3e',

    // Surfaces (Palenight)
    surface: '#292d3e',
    surfaceDim: '#1f2233',
    surfaceVariant: '#32364a',
    surfaceContainer: '#2e3244',
    surfaceContainerLow: '#30344a',
    surfaceContainerHigh: '#444267',
    surfaceContainerHighest: '#595e7b',
    onSurface: '#d6deeb',
    onSurfaceVariant: 'rgba(214, 222, 235, 0.75)',

    // Outlines
    outline: '#82aaff',
    outlineVariant: '#9dc1ff',

    // Brand accent
    accent: '#ffcb6b',
    accentLight: '#ffd989',
    accentDark: '#edb955',

    // State layers
    stateHover: 'rgba(130, 170, 255, 0.12)',
    stateFocus: 'rgba(130, 170, 255, 0.18)',
    statePressed: 'rgba(130, 170, 255, 0.24)',
    stateDragged: 'rgba(130, 170, 255, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 22: Terracotta
 * Warm earthy theme with rich terracotta and clay tones
 */
