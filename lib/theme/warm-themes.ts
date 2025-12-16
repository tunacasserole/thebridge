/**
 * Warm Color Themes
 * Brown, terracotta, and warm color palette themes
 */

import type { ThemeConfig } from './types';
import { sharedTypography, sharedSpacing, sharedRadius, sharedElevation, sharedMotion } from './shared';

export const terracottaTheme: ThemeConfig = {
  id: 'terracotta',
  name: 'Terracotta',
  description: 'Warm earthy theme with rich terracotta and clay tones',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Terracotta)
    primary: '#d4735e',
    primaryLight: '#e18f7b',
    primaryDark: '#bf5e4a',
    onPrimary: '#2b1f1a',
    primaryContainer: '#a84b38',
    onPrimaryContainer: '#f5d7d1',

    // Secondary (Clay)
    secondary: '#c9916d',
    secondaryLight: '#d9a888',
    secondaryDark: '#b67c59',
    onSecondary: '#2b1f1a',
    secondaryContainer: '#9d6547',
    onSecondaryContainer: '#f2e5dc',

    // Tertiary (Rust)
    tertiary: '#a85b3a',
    tertiaryLight: '#c07858',
    tertiaryDark: '#8f4929',
    onTertiary: '#2b1f1a',
    tertiaryContainer: '#763622',
    onTertiaryContainer: '#ead7d0',

    // Error (Red Clay)
    error: '#d64933',
    errorLight: '#e36d5b',
    errorDark: '#c03525',
    onError: '#2b1f1a',
    errorContainer: '#a1281a',
    onErrorContainer: '#f4d1cb',

    // Warning (Burnt Orange)
    warning: '#e07a3a',
    warningLight: '#e99559',
    warningDark: '#cc6628',
    onWarning: '#2b1f1a',
    warningContainer: '#b35520',
    onWarningContainer: '#f7dece',

    // Success (Sage)
    success: '#8aa67f',
    successLight: '#a4bd9a',
    successDark: '#759068',
    onSuccess: '#2b1f1a',
    successContainer: '#627854',
    onSuccessContainer: '#e2ede0',

    // Neutral
    neutral50: '#f5ede9',
    neutral100: '#e8ddd6',
    neutral200: '#d1c3b8',
    neutral300: '#b8a393',
    neutral400: '#9d876f',
    neutral500: '#826e57',
    neutral600: '#675746',
    neutral700: '#524638',
    neutral800: '#3d352b',
    neutral900: '#2b1f1a',

    // Surfaces
    surface: '#2b1f1a',
    surfaceDim: '#221711',
    surfaceVariant: '#3d352b',
    surfaceContainer: '#322821',
    surfaceContainerLow: '#362d25',
    surfaceContainerHigh: '#524638',
    surfaceContainerHighest: '#675746',
    onSurface: '#e8ddd6',
    onSurfaceVariant: 'rgba(232, 221, 214, 0.75)',

    // Outlines
    outline: '#d4735e',
    outlineVariant: '#e18f7b',

    // Brand accent
    accent: '#c9916d',
    accentLight: '#d9a888',
    accentDark: '#b67c59',

    // State layers
    stateHover: 'rgba(212, 115, 94, 0.12)',
    stateFocus: 'rgba(212, 115, 94, 0.18)',
    statePressed: 'rgba(212, 115, 94, 0.24)',
    stateDragged: 'rgba(212, 115, 94, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 23: Mocha
 * Rich coffee and chocolate tones for a warm, cozy feel
 */
export const mochaTheme: ThemeConfig = {
  id: 'mocha',
  name: 'Mocha',
  description: 'Rich coffee and chocolate tones for a warm, cozy feel',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Coffee)
    primary: '#a67c52',
    primaryLight: '#bf9670',
    primaryDark: '#8f6641',
    onPrimary: '#1f1512',
    primaryContainer: '#75532f',
    onPrimaryContainer: '#ede1d5',

    // Secondary (Chocolate)
    secondary: '#8b6f47',
    secondaryLight: '#a38963',
    secondaryDark: '#745a35',
    onSecondary: '#1f1512',
    secondaryContainer: '#5f4828',
    onSecondaryContainer: '#e9ddd0',

    // Tertiary (Caramel)
    tertiary: '#c9a877',
    tertiaryLight: '#d8bd92',
    tertiaryDark: '#b6945f',
    onTertiary: '#1f1512',
    tertiaryContainer: '#9c7e4d',
    onTertiaryContainer: '#f3ead9',

    // Error (Burnt Sienna)
    error: '#c7543f',
    errorLight: '#d7735f',
    errorDark: '#b2422e',
    onError: '#1f1512',
    errorContainer: '#96321f',
    onErrorContainer: '#f2d6d0',

    // Warning (Amber)
    warning: '#d9a851',
    warningLight: '#e3be73',
    warningDark: '#c69440',
    onWarning: '#1f1512',
    warningContainer: '#ad7e31',
    onWarningContainer: '#f7ecd9',

    // Success (Olive)
    success: '#8a956f',
    successLight: '#a3ad8a',
    successDark: '#758059',
    onSuccess: '#1f1512',
    successContainer: '#626a45',
    onSuccessContainer: '#e4e9dd',

    // Neutral
    neutral50: '#f0e9e0',
    neutral100: '#e0d5c8',
    neutral200: '#c9baaa',
    neutral300: '#b09d88',
    neutral400: '#96806a',
    neutral500: '#7d6754',
    neutral600: '#645143',
    neutral700: '#504134',
    neutral800: '#3c3127',
    neutral900: '#1f1512',

    // Surfaces
    surface: '#1f1512',
    surfaceDim: '#181109',
    surfaceVariant: '#3c3127',
    surfaceContainer: '#271f18',
    surfaceContainerLow: '#2e251d',
    surfaceContainerHigh: '#504134',
    surfaceContainerHighest: '#645143',
    onSurface: '#e0d5c8',
    onSurfaceVariant: 'rgba(224, 213, 200, 0.75)',

    // Outlines
    outline: '#a67c52',
    outlineVariant: '#bf9670',

    // Brand accent
    accent: '#c9a877',
    accentLight: '#d8bd92',
    accentDark: '#b6945f',

    // State layers
    stateHover: 'rgba(166, 124, 82, 0.12)',
    stateFocus: 'rgba(166, 124, 82, 0.18)',
    statePressed: 'rgba(166, 124, 82, 0.24)',
    stateDragged: 'rgba(166, 124, 82, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 24: Desert Sand
 * Warm sandy tones inspired by desert landscapes
 */
export const desertSandTheme: ThemeConfig = {
  id: 'desert-sand',
  name: 'Desert Sand',
  description: 'Warm sandy tones inspired by desert landscapes',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Sand)
    primary: '#d4a574',
    primaryLight: '#e1ba8f',
    primaryDark: '#c1915f',
    onPrimary: '#2a1f16',
    primaryContainer: '#a67a4a',
    onPrimaryContainer: '#f3e7d9',

    // Secondary (Sandstone)
    secondary: '#c99977',
    secondaryLight: '#d9ad92',
    secondaryDark: '#b6845f',
    onSecondary: '#2a1f16',
    secondaryContainer: '#9d6f4d',
    onSecondaryContainer: '#f2e3d9',

    // Tertiary (Dune)
    tertiary: '#b89968',
    tertiaryLight: '#ccb085',
    tertiaryDark: '#a38453',
    onTertiary: '#2a1f16',
    tertiaryContainer: '#8a6f42',
    onTertiaryContainer: '#ede5d9',

    // Error (Red Rock)
    error: '#c65d42',
    errorLight: '#d77c63',
    errorDark: '#b2492f',
    onError: '#2a1f16',
    errorContainer: '#953723',
    onErrorContainer: '#f2d9d2',

    // Warning (Sunset Orange)
    warning: '#e08c4a',
    warningLight: '#e9a56c',
    warningDark: '#cc7836',
    onWarning: '#2a1f16',
    warningContainer: '#b36829',
    onWarningContainer: '#f7dfc9',

    // Success (Desert Sage)
    success: '#9fa97c',
    successLight: '#b7c199',
    successDark: '#899464',
    onSuccess: '#2a1f16',
    successContainer: '#737c51',
    onSuccessContainer: '#e7eddd',

    // Neutral
    neutral50: '#f5eee6',
    neutral100: '#e8ddd0',
    neutral200: '#d4c5b3',
    neutral300: '#bda890',
    neutral400: '#a68d72',
    neutral500: '#8c7459',
    neutral600: '#705d47',
    neutral700: '#5a4b39',
    neutral800: '#45382c',
    neutral900: '#2a1f16',

    // Surfaces
    surface: '#2a1f16',
    surfaceDim: '#22180e',
    surfaceVariant: '#45382c',
    surfaceContainer: '#32271c',
    surfaceContainerLow: '#382d20',
    surfaceContainerHigh: '#5a4b39',
    surfaceContainerHighest: '#705d47',
    onSurface: '#e8ddd0',
    onSurfaceVariant: 'rgba(232, 221, 208, 0.75)',

    // Outlines
    outline: '#d4a574',
    outlineVariant: '#e1ba8f',

    // Brand accent
    accent: '#d4a574',
    accentLight: '#e1ba8f',
    accentDark: '#c1915f',

    // State layers
    stateHover: 'rgba(212, 165, 116, 0.12)',
    stateFocus: 'rgba(212, 165, 116, 0.18)',
    statePressed: 'rgba(212, 165, 116, 0.24)',
    stateDragged: 'rgba(212, 165, 116, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 25: Adobe Clay
 * Southwestern adobe and clay colors
 */
export const adobeClayTheme: ThemeConfig = {
  id: 'adobe-clay',
  name: 'Adobe Clay',
  description: 'Southwestern adobe and clay colors',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Adobe)
    primary: '#c28563',
    primaryLight: '#d4a081',
    primaryDark: '#ad6f4e',
    onPrimary: '#241813',
    primaryContainer: '#925b3d',
    onPrimaryContainer: '#f0ddd2',

    // Secondary (Clay Red)
    secondary: '#b86f5d',
    secondaryLight: '#cc8c7b',
    secondaryDark: '#a35a47',
    onSecondary: '#241813',
    secondaryContainer: '#8a4734',
    onSecondaryContainer: '#ecdcd6',

    // Tertiary (Desert Rose)
    tertiary: '#d09383',
    tertiaryLight: '#dcab9d',
    tertiaryDark: '#be7d6c',
    onTertiary: '#241813',
    tertiaryContainer: '#a86958',
    onTertiaryContainer: '#f3e2dd',

    // Error (Red Clay)
    error: '#c24d3a',
    errorLight: '#d36e5d',
    errorDark: '#ad3828',
    onError: '#241813',
    errorContainer: '#8f281a',
    onErrorContainer: '#f0d4ce',

    // Warning (Burnt Umber)
    warning: '#d47a4a',
    warningLight: '#e1966c',
    warningDark: '#c06536',
    onWarning: '#241813',
    warningContainer: '#a65329',
    onWarningContainer: '#f3dec9',

    // Success (Sage Green)
    success: '#8c9c7a',
    successLight: '#a5b497',
    successDark: '#778864',
    onSuccess: '#241813',
    successContainer: '#637251',
    onSuccessContainer: '#e5edde',

    // Neutral
    neutral50: '#f2e8e0',
    neutral100: '#e3d5ca',
    neutral200: '#cdbcad',
    neutral300: '#b39f8b',
    neutral400: '#99826d',
    neutral500: '#806956',
    neutral600: '#675445',
    neutral700: '#524336',
    neutral800: '#3e332a',
    neutral900: '#241813',

    // Surfaces
    surface: '#241813',
    surfaceDim: '#1c110c',
    surfaceVariant: '#3e332a',
    surfaceContainer: '#2c221a',
    surfaceContainerLow: '#33281e',
    surfaceContainerHigh: '#524336',
    surfaceContainerHighest: '#675445',
    onSurface: '#e3d5ca',
    onSurfaceVariant: 'rgba(227, 213, 202, 0.75)',

    // Outlines
    outline: '#c28563',
    outlineVariant: '#d4a081',

    // Brand accent
    accent: '#d09383',
    accentLight: '#dcab9d',
    accentDark: '#be7d6c',

    // State layers
    stateHover: 'rgba(194, 133, 99, 0.12)',
    stateFocus: 'rgba(194, 133, 99, 0.18)',
    statePressed: 'rgba(194, 133, 99, 0.24)',
    stateDragged: 'rgba(194, 133, 99, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 26: Caramel
 * Sweet caramel and toffee tones
 */
export const caramelTheme: ThemeConfig = {
  id: 'caramel',
  name: 'Caramel',
  description: 'Sweet caramel and toffee tones',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Caramel)
    primary: '#c99d6e',
    primaryLight: '#d9b48b',
    primaryDark: '#b68858',
    onPrimary: '#1f1610',
    primaryContainer: '#9c7244',
    onPrimaryContainer: '#f3e8db',

    // Secondary (Toffee)
    secondary: '#b8885e',
    secondaryLight: '#cca17c',
    secondaryDark: '#a37349',
    onSecondary: '#1f1610',
    secondaryContainer: '#8a5f38',
    onSecondaryContainer: '#eddfd1',

    // Tertiary (Butterscotch)
    tertiary: '#d4ae77',
    tertiaryLight: '#e1c294',
    tertiaryDark: '#c1995f',
    onTertiary: '#1f1610',
    onTertiaryContainer: '#f5ebd9',
    tertiaryContainer: '#a6844d',

    // Error (Burnt Caramel)
    error: '#c45d42',
    errorLight: '#d57c63',
    errorDark: '#af482f',
    onError: '#1f1610',
    errorContainer: '#8f3522',
    onErrorContainer: '#f2d8d0',

    // Warning (Golden)
    warning: '#d9a84a',
    warningLight: '#e3be6c',
    warningDark: '#c69436',
    onWarning: '#1f1610',
    warningContainer: '#ad7e29',
    onWarningContainer: '#f7eac9',

    // Success (Pistachio)
    success: '#93a77c',
    successLight: '#acbf99',
    successDark: '#7f9264',
    onSuccess: '#1f1610',
    successContainer: '#6b7a51',
    onSuccessContainer: '#e5eddd',

    // Neutral
    neutral50: '#f5ede3',
    neutral100: '#e8dccf',
    neutral200: '#d4c4b3',
    neutral300: '#bda890',
    neutral400: '#a58d72',
    neutral500: '#8b7459',
    neutral600: '#6f5d47',
    neutral700: '#594a39',
    neutral800: '#44382c',
    neutral900: '#1f1610',

    // Surfaces
    surface: '#1f1610',
    surfaceDim: '#18110a',
    surfaceVariant: '#44382c',
    surfaceContainer: '#282018',
    surfaceContainerLow: '#2e261c',
    surfaceContainerHigh: '#594a39',
    surfaceContainerHighest: '#6f5d47',
    onSurface: '#e8dccf',
    onSurfaceVariant: 'rgba(232, 220, 207, 0.75)',

    // Outlines
    outline: '#c99d6e',
    outlineVariant: '#d9b48b',

    // Brand accent
    accent: '#d4ae77',
    accentLight: '#e1c294',
    accentDark: '#c1995f',

    // State layers
    stateHover: 'rgba(201, 157, 110, 0.12)',
    stateFocus: 'rgba(201, 157, 110, 0.18)',
    statePressed: 'rgba(201, 157, 110, 0.24)',
    stateDragged: 'rgba(201, 157, 110, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 27: Maple Wood
 * Rich maple wood and amber tones
 */
export const mapleWoodTheme: ThemeConfig = {
  id: 'maple-wood',
  name: 'Maple Wood',
  description: 'Rich maple wood and amber tones',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Maple)
    primary: '#b8794e',
    primaryLight: '#cc956d',
    primaryDark: '#a36339',
    onPrimary: '#1c1108',
    primaryContainer: '#8a502c',
    onPrimaryContainer: '#ecdacc',

    // Secondary (Walnut)
    secondary: '#99664a',
    secondaryLight: '#b28368',
    secondaryDark: '#825335',
    onSecondary: '#1c1108',
    secondaryContainer: '#6a4128',
    onSecondaryContainer: '#e6d5ca',

    // Tertiary (Amber)
    tertiary: '#d4a05a',
    tertiaryLight: '#e1b779',
    tertiaryDark: '#c18c44',
    onTertiary: '#1c1108',
    tertiaryContainer: '#a67236',
    onTertiaryContainer: '#f5e7d0',

    // Error (Cherry)
    error: '#c24a39',
    errorLight: '#d3695a',
    errorDark: '#ad3528',
    onError: '#1c1108',
    errorContainer: '#8f261a',
    onErrorContainer: '#f0d1cc',

    // Warning (Honey)
    warning: '#d99752',
    warningLight: '#e3af73',
    warningDark: '#c6813f',
    onWarning: '#1c1108',
    warningContainer: '#ad6c30',
    onWarningContainer: '#f7e2c9',

    // Success (Forest)
    success: '#7a9166',
    successLight: '#96a984',
    successDark: '#677c53',
    onSuccess: '#1c1108',
    successContainer: '#546640',
    onSuccessContainer: '#dfe8d9',

    // Neutral
    neutral50: '#f0e5d9',
    neutral100: '#e0d0bf',
    neutral200: '#c9b49a',
    neutral300: '#b0957a',
    neutral400: '#96795f',
    neutral500: '#7d614a',
    neutral600: '#644d3b',
    neutral700: '#503d2f',
    neutral800: '#3c2e24',
    neutral900: '#1c1108',

    // Surfaces
    surface: '#1c1108',
    surfaceDim: '#140c04',
    surfaceVariant: '#3c2e24',
    surfaceContainer: '#241b10',
    surfaceContainerLow: '#2a2115',
    surfaceContainerHigh: '#503d2f',
    surfaceContainerHighest: '#644d3b',
    onSurface: '#e0d0bf',
    onSurfaceVariant: 'rgba(224, 208, 191, 0.75)',

    // Outlines
    outline: '#b8794e',
    outlineVariant: '#cc956d',

    // Brand accent
    accent: '#d4a05a',
    accentLight: '#e1b779',
    accentDark: '#c18c44',

    // State layers
    stateHover: 'rgba(184, 121, 78, 0.12)',
    stateFocus: 'rgba(184, 121, 78, 0.18)',
    statePressed: 'rgba(184, 121, 78, 0.24)',
    stateDragged: 'rgba(184, 121, 78, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 28: Ember
 * Glowing ember and fire tones
 */
export const emberTheme: ThemeConfig = {
  id: 'ember',
  name: 'Ember',
  description: 'Glowing ember and fire tones',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Ember Red)
    primary: '#e85d3e',
    primaryLight: '#f17e64',
    primaryDark: '#d44429',
    onPrimary: '#1a0c08',
    primaryContainer: '#b7341d',
    onPrimaryContainer: '#fcd5ce',

    // Secondary (Flame Orange)
    secondary: '#ff7f3f',
    secondaryLight: '#ff9d66',
    secondaryDark: '#ed6625',
    onSecondary: '#1a0c08',
    secondaryContainer: '#d4511b',
    onSecondaryContainer: '#ffddc9',

    // Tertiary (Hot Coal)
    tertiary: '#d44f2e',
    tertiaryLight: '#e3725e',
    tertiaryDark: '#c03a1d',
    onTertiary: '#1a0c08',
    tertiaryContainer: '#a12a14',
    onTertiaryContainer: '#f7d3cb',

    // Error (Inferno)
    error: '#ff3d00',
    errorLight: '#ff6333',
    errorDark: '#e62e00',
    onError: '#1a0c08',
    errorContainer: '#bf2400',
    onErrorContainer: '#ffc9b3',

    // Warning (Blaze)
    warning: '#ff8a3d',
    warningLight: '#ffa566',
    warningDark: '#ed7229',
    onWarning: '#1a0c08',
    warningContainer: '#d45b1b',
    onWarningContainer: '#ffdfc9',

    // Success (Ash Green)
    success: '#7a9470',
    successLight: '#96a98f',
    successDark: '#677f5c',
    onSuccess: '#1a0c08',
    successContainer: '#547749',
    onSuccessContainer: '#dde8d9',

    // Neutral
    neutral50: '#fff3f0',
    neutral100: '#ffe0d9',
    neutral200: '#ffc4b8',
    neutral300: '#ffa08f',
    neutral400: '#ff7560',
    neutral500: '#e85d3e',
    neutral600: '#c4461f',
    neutral700: '#993614',
    neutral800: '#66230d',
    neutral900: '#1a0c08',

    // Surfaces
    surface: '#1a0c08',
    surfaceDim: '#120704',
    surfaceVariant: '#66230d',
    surfaceContainer: '#22140c',
    surfaceContainerLow: '#2e1a10',
    surfaceContainerHigh: '#993614',
    surfaceContainerHighest: '#c4461f',
    onSurface: '#ffe0d9',
    onSurfaceVariant: 'rgba(255, 224, 217, 0.75)',

    // Outlines
    outline: '#e85d3e',
    outlineVariant: '#f17e64',

    // Brand accent
    accent: '#ff7f3f',
    accentLight: '#ff9d66',
    accentDark: '#ed6625',

    // State layers
    stateHover: 'rgba(232, 93, 62, 0.12)',
    stateFocus: 'rgba(232, 93, 62, 0.18)',
    statePressed: 'rgba(232, 93, 62, 0.24)',
    stateDragged: 'rgba(232, 93, 62, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 29: Sunset Blaze
 * Vibrant sunset oranges and reds
 */
export const sunsetBlazeTheme: ThemeConfig = {
  id: 'sunset-blaze',
  name: 'Sunset Blaze',
  description: 'Vibrant sunset oranges and reds',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Sunset Orange)
    primary: '#ff6b3d',
    primaryLight: '#ff8c66',
    primaryDark: '#ed5329',
    onPrimary: '#1a0906',
    primaryContainer: '#d43f1b',
    onPrimaryContainer: '#ffd9ce',

    // Secondary (Coral Red)
    secondary: '#ff5757',
    secondaryLight: '#ff7979',
    secondaryDark: '#ed4040',
    onSecondary: '#1a0906',
    secondaryContainer: '#d42e2e',
    onSecondaryContainer: '#ffd3d3',

    // Tertiary (Marigold)
    tertiary: '#ffa947',
    tertiaryLight: '#ffc06c',
    tertiaryDark: '#ed9532',
    onTertiary: '#1a0906',
    tertiaryContainer: '#d4801e',
    onTertiaryContainer: '#ffe9ce',

    // Error (Ruby)
    error: '#e63946',
    errorLight: '#f05f6b',
    errorDark: '#d32735',
    onError: '#1a0906',
    errorContainer: '#b71f2c',
    onErrorContainer: '#fcd0d4',

    // Warning (Tangerine)
    warning: '#ffaa47',
    warningLight: '#ffc16c',
    warningDark: '#ed9532',
    onWarning: '#1a0906',
    warningContainer: '#d4801e',
    onWarningContainer: '#ffe9ce',

    // Success (Sage)
    success: '#84a07a',
    successLight: '#9fb897',
    successDark: '#708b65',
    onSuccess: '#1a0906',
    successContainer: '#5c7451',
    onSuccessContainer: '#e0ead9',

    // Neutral
    neutral50: '#fff5f2',
    neutral100: '#ffe3dc',
    neutral200: '#ffcabf',
    neutral300: '#ffac99',
    neutral400: '#ff856d',
    neutral500: '#ff6b3d',
    neutral600: '#e84f23',
    neutral700: '#bf3e1c',
    neutral800: '#8f2e15',
    neutral900: '#1a0906',

    // Surfaces
    surface: '#1a0906',
    surfaceDim: '#120503',
    surfaceVariant: '#8f2e15',
    surfaceContainer: '#24120a',
    surfaceContainerLow: '#301710',
    surfaceContainerHigh: '#bf3e1c',
    surfaceContainerHighest: '#e84f23',
    onSurface: '#ffe3dc',
    onSurfaceVariant: 'rgba(255, 227, 220, 0.75)',

    // Outlines
    outline: '#ff6b3d',
    outlineVariant: '#ff8c66',

    // Brand accent
    accent: '#ffa947',
    accentLight: '#ffc06c',
    accentDark: '#ed9532',

    // State layers
    stateHover: 'rgba(255, 107, 61, 0.12)',
    stateFocus: 'rgba(255, 107, 61, 0.18)',
    statePressed: 'rgba(255, 107, 61, 0.24)',
    stateDragged: 'rgba(255, 107, 61, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 30: Volcanic
 * Dark volcanic red and lava tones
 */
export const volcanicTheme: ThemeConfig = {
  id: 'volcanic',
  name: 'Volcanic',
  description: 'Dark volcanic red and lava tones',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Lava Red)
    primary: '#d4463e',
    primaryLight: '#e36961',
    primaryDark: '#c0302a',
    onPrimary: '#140504',
    primaryContainer: '#a12219',
    onPrimaryContainer: '#f7d1ce',

    // Secondary (Magma Orange)
    secondary: '#e66038',
    secondaryLight: '#f0825f',
    secondaryDark: '#d34a27',
    onSecondary: '#140504',
    secondaryContainer: '#b73a1a',
    onSecondaryContainer: '#fcd8ce',

    // Tertiary (Volcanic Ash)
    tertiary: '#7a6e68',
    tertiaryLight: '#958b85',
    tertiaryDark: '#655a54',
    onTertiary: '#140504',
    tertiaryContainer: '#524842',
    onTertiaryContainer: '#ddd9d6',

    // Error (Eruption)
    error: '#ff4444',
    errorLight: '#ff6b6b',
    errorDark: '#ed2f2f',
    onError: '#140504',
    errorContainer: '#d41f1f',
    onErrorContainer: '#ffd1d1',

    // Warning (Molten)
    warning: '#ff8533',
    warningLight: '#ffa05c',
    warningDark: '#ed6f1f',
    onWarning: '#140504',
    warningContainer: '#d45815',
    onWarningContainer: '#ffddc9',

    // Success (Basalt Green)
    success: '#6d7a68',
    successLight: '#8a9685',
    successDark: '#596655',
    onSuccess: '#140504',
    successContainer: '#475342',
    onSuccessContainer: '#d8ddd6',

    // Neutral
    neutral50: '#f2e8e6',
    neutral100: '#e0d3cf',
    neutral200: '#c9b6af',
    neutral300: '#b0968c',
    neutral400: '#96786d',
    neutral500: '#7a6058',
    neutral600: '#624c46',
    neutral700: '#4e3d37',
    neutral800: '#3a2e2a',
    neutral900: '#140504',

    // Surfaces
    surface: '#140504',
    surfaceDim: '#0c0302',
    surfaceVariant: '#3a2e2a',
    surfaceContainer: '#1c0f0c',
    surfaceContainerLow: '#251613',
    surfaceContainerHigh: '#4e3d37',
    surfaceContainerHighest: '#624c46',
    onSurface: '#e0d3cf',
    onSurfaceVariant: 'rgba(224, 211, 207, 0.75)',

    // Outlines
    outline: '#d4463e',
    outlineVariant: '#e36961',

    // Brand accent
    accent: '#e66038',
    accentLight: '#f0825f',
    accentDark: '#d34a27',

    // State layers
    stateHover: 'rgba(212, 70, 62, 0.12)',
    stateFocus: 'rgba(212, 70, 62, 0.18)',
    statePressed: 'rgba(212, 70, 62, 0.24)',
    stateDragged: 'rgba(212, 70, 62, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 31: Crimson
 * Deep crimson and burgundy tones
 */
export const crimsonTheme: ThemeConfig = {
  id: 'crimson',
  name: 'Crimson',
  description: 'Deep crimson and burgundy tones',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Crimson)
    primary: '#c93847',
    primaryLight: '#dc5c68',
    primaryDark: '#b62533',
    onPrimary: '#120406',
    primaryContainer: '#981b26',
    onPrimaryContainer: '#f5ced1',

    // Secondary (Burgundy)
    secondary: '#a02f3e',
    secondaryLight: '#ba4f5e',
    secondaryDark: '#8a1f2e',
    onSecondary: '#120406',
    secondaryContainer: '#721621',
    onSecondaryContainer: '#eacdd1',

    // Tertiary (Wine)
    tertiary: '#8e3342',
    tertiaryLight: '#a95361',
    tertiaryDark: '#7a2130',
    onTertiary: '#120406',
    tertiaryContainer: '#641523',
    onTertiaryContainer: '#e6cdd1',

    // Error (Ruby Red)
    error: '#e63946',
    errorLight: '#f05f6b',
    errorDark: '#d32735',
    onError: '#120406',
    errorContainer: '#b71f2c',
    onErrorContainer: '#fcd0d4',

    // Warning (Vermillion)
    warning: '#e85d3e',
    warningLight: '#f17e64',
    warningDark: '#d44429',
    onWarning: '#120406',
    warningContainer: '#b7341d',
    onWarningContainer: '#fcd5ce',

    // Success (Forest)
    success: '#6d7a63',
    successLight: '#8a9681',
    successDark: '#59664f',
    onSuccess: '#120406',
    successContainer: '#47533d',
    onSuccessContainer: '#d8ddd4',

    // Neutral
    neutral50: '#f2e6e8',
    neutral100: '#e0d0d3',
    neutral200: '#c9b3b8',
    neutral300: '#b0939a',
    neutral400: '#96757d',
    neutral500: '#7a5c64',
    neutral600: '#624950',
    neutral700: '#4e3a40',
    neutral800: '#3a2b30',
    neutral900: '#120406',

    // Surfaces
    surface: '#120406',
    surfaceDim: '#0a0203',
    surfaceVariant: '#3a2b30',
    surfaceContainer: '#1a0c0f',
    surfaceContainerLow: '#241316',
    surfaceContainerHigh: '#4e3a40',
    surfaceContainerHighest: '#624950',
    onSurface: '#e0d0d3',
    onSurfaceVariant: 'rgba(224, 208, 211, 0.75)',

    // Outlines
    outline: '#c93847',
    outlineVariant: '#dc5c68',

    // Brand accent
    accent: '#a02f3e',
    accentLight: '#ba4f5e',
    accentDark: '#8a1f2e',

    // State layers
    stateHover: 'rgba(201, 56, 71, 0.12)',
    stateFocus: 'rgba(201, 56, 71, 0.18)',
    statePressed: 'rgba(201, 56, 71, 0.24)',
    stateDragged: 'rgba(201, 56, 71, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 32: Tangerine Dream
 * Bright tangerine and citrus tones
 */
export const tangerineDreamTheme: ThemeConfig = {
  id: 'tangerine-dream',
  name: 'Tangerine Dream',
  description: 'Bright tangerine and citrus tones',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Tangerine)
    primary: '#ff9933',
    primaryLight: '#ffb35c',
    primaryDark: '#ed801f',
    onPrimary: '#1a0c03',
    primaryContainer: '#d46815',
    onPrimaryContainer: '#ffe5c9',

    // Secondary (Orange Peel)
    secondary: '#ffa64d',
    secondaryLight: '#ffbe73',
    secondaryDark: '#ed8f36',
    onSecondary: '#1a0c03',
    secondaryContainer: '#d4771f',
    onSecondaryContainer: '#ffe9d1',

    // Tertiary (Citrus)
    tertiary: '#ffb84d',
    tertiaryLight: '#ffc973',
    tertiaryDark: '#eda336',
    onTertiary: '#1a0c03',
    tertiaryContainer: '#d48b1f',
    onTertiaryContainer: '#ffeed1',

    // Error (Red Orange)
    error: '#ff5722',
    errorLight: '#ff784d',
    errorDark: '#ed4015',
    onError: '#1a0c03',
    errorContainer: '#d42f0e',
    onErrorContainer: '#ffd4c9',

    // Warning (Amber)
    warning: '#ffaa33',
    warningLight: '#ffc15c',
    warningDark: '#ed951f',
    onWarning: '#1a0c03',
    warningContainer: '#d47f15',
    onWarningContainer: '#ffe9c9',

    // Success (Lime)
    success: '#8fa668',
    successLight: '#a9bd85',
    successDark: '#7b9155',
    onSuccess: '#1a0c03',
    successContainer: '#677a42',
    onSuccessContainer: '#e3edd6',

    // Neutral
    neutral50: '#fff3e6',
    neutral100: '#ffe3cc',
    neutral200: '#ffcaa3',
    neutral300: '#ffad77',
    neutral400: '#ff8e47',
    neutral500: '#ff7722',
    neutral600: '#e8590d',
    neutral700: '#bf4908',
    neutral800: '#8f3606',
    neutral900: '#1a0c03',

    // Surfaces
    surface: '#1a0c03',
    surfaceDim: '#120702',
    surfaceVariant: '#8f3606',
    surfaceContainer: '#241407',
    surfaceContainerLow: '#30190b',
    surfaceContainerHigh: '#bf4908',
    surfaceContainerHighest: '#e8590d',
    onSurface: '#ffe3cc',
    onSurfaceVariant: 'rgba(255, 227, 204, 0.75)',

    // Outlines
    outline: '#ff9933',
    outlineVariant: '#ffb35c',

    // Brand accent
    accent: '#ffb84d',
    accentLight: '#ffc973',
    accentDark: '#eda336',

    // State layers
    stateHover: 'rgba(255, 153, 51, 0.12)',
    stateFocus: 'rgba(255, 153, 51, 0.18)',
    statePressed: 'rgba(255, 153, 51, 0.24)',
    stateDragged: 'rgba(255, 153, 51, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * Theme 33: Hot Lava
 * Intense lava and magma colors
 */
export const hotLavaTheme: ThemeConfig = {
  id: 'hot-lava',
  name: 'Hot Lava',
  description: 'Intense lava and magma colors',
  category: 'standard',
  mode: 'dark',

  colors: {
    // Primary (Lava)
    primary: '#ff5733',
    primaryLight: '#ff7a5c',
    primaryDark: '#ed401f',
    onPrimary: '#1a0704',
    primaryContainer: '#d42f15',
    onPrimaryContainer: '#ffd4c9',

    // Secondary (Magma)
    secondary: '#ff7043',
    secondaryLight: '#ff916b',
    secondaryDark: '#ed592f',
    onSecondary: '#1a0704',
    secondaryContainer: '#d4431b',
    onSecondaryContainer: '#ffdad1',

    // Tertiary (Molten Gold)
    tertiary: '#ffc043',
    tertiaryLight: '#ffd06b',
    tertiaryDark: '#edaa2f',
    onTertiary: '#1a0704',
    tertiaryContainer: '#d4931b',
    onTertiaryContainer: '#ffeed1',

    // Error (Inferno Red)
    error: '#ff3838',
    errorLight: '#ff6161',
    errorDark: '#ed2424',
    onError: '#1a0704',
    errorContainer: '#d41515',
    onErrorContainer: '#ffcece',

    // Warning (Flame)
    warning: '#ff8533',
    warningLight: '#ffa05c',
    warningDark: '#ed6f1f',
    onWarning: '#1a0704',
    warningContainer: '#d45815',
    onWarningContainer: '#ffddc9',

    // Success (Cooled Lava)
    success: '#6d7a68',
    successLight: '#8a9685',
    successDark: '#596655',
    onSuccess: '#1a0704',
    successContainer: '#475342',
    onSuccessContainer: '#d8ddd6',

    // Neutral
    neutral50: '#fff0ed',
    neutral100: '#ffddd6',
    neutral200: '#ffc4b8',
    neutral300: '#ffa38f',
    neutral400: '#ff7960',
    neutral500: '#ff5733',
    neutral600: '#e8411f',
    neutral700: '#bf3418',
    neutral800: '#8f2612',
    neutral900: '#1a0704',

    // Surfaces
    surface: '#1a0704',
    surfaceDim: '#120402',
    surfaceVariant: '#8f2612',
    surfaceContainer: '#24100a',
    surfaceContainerLow: '#30140d',
    surfaceContainerHigh: '#bf3418',
    surfaceContainerHighest: '#e8411f',
    onSurface: '#ffddd6',
    onSurfaceVariant: 'rgba(255, 221, 214, 0.75)',

    // Outlines
    outline: '#ff5733',
    outlineVariant: '#ff7a5c',

    // Brand accent
    accent: '#ffc043',
    accentLight: '#ffd06b',
    accentDark: '#edaa2f',

    // State layers
    stateHover: 'rgba(255, 87, 51, 0.12)',
    stateFocus: 'rgba(255, 87, 51, 0.18)',
    statePressed: 'rgba(255, 87, 51, 0.24)',
    stateDragged: 'rgba(255, 87, 51, 0.32)',
  },

  typography: sharedTypography,
  spacing: sharedSpacing,
  radius: sharedRadius,
  elevation: sharedElevation,
  motion: sharedMotion,
};

/**
 * All available themes
 */
