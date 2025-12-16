/**
 * TheBridge Theme Definitions
 * Main entry point - re-exports all theme variants
 */

import type { ThemeConfig } from './types';

// Re-export all individual theme files
export * from './standard-themes';
export * from './developer-themes';
export * from './warm-themes';
export * from './compact-themes';

// Import specific themes for the themes registry
import {
  midnightCommandTheme,
  daylightOperationsTheme,
  highContrastTheme,
  focusedCommanderTheme,
  executiveDashboardTheme,
  cupcakeTheme,
} from './standard-themes';

import {
  terminalGreenTheme,
  cyberpunkTheme,
  nordTheme,
  solarizedTheme,
  gruvboxTheme,
  oneDarkTheme,
  tokyoNightTheme,
  catppuccinTheme,
  everforestTheme,
  rosePineTheme,
  oceanicNextTheme,
  githubDarkTheme,
  ayuMirageTheme,
  nightOwlTheme,
  palenightTheme,
} from './developer-themes';

import {
  terracottaTheme,
  mochaTheme,
  desertSandTheme,
  adobeClayTheme,
  caramelTheme,
  mapleWoodTheme,
  emberTheme,
  sunsetBlazeTheme,
  volcanicTheme,
  crimsonTheme,
  tangerineDreamTheme,
  hotLavaTheme,
} from './warm-themes';

import {
  synthwave84Theme,
  vaporwaveTheme,
  outrunTheme,
  miamiViceTheme,
  neonNightsTheme,
  arcadeTheme,
  neonBurstTheme,
  fluorescentTheme,
  popArtTheme,
  electricTheme,
  autumnLeavesTheme,
  halloweenTheme,
  springBloomTheme,
  summerSkyTheme,
  coralReefTheme,
  canyonTheme,
  tokyoNeonTheme,
  retroDinerTheme,
  cyberpunkPinkTheme,
  vintagePosterTheme,
  neonForestTheme,
  sunsetBoulevardTheme,
  artDecoTheme,
  bubblegumPopTheme,
  rustCopperTheme,
  lavenderDreamsTheme,
  emeraldCityTheme,
  cherryColaTheme,
  mintChocolateTheme,
  peacockTheme,
  desertSunsetTheme,
  cosmicPurpleTheme,
  forestMossTheme,
  candyShopTheme,
  industrialTheme,
  tropicalPunchTheme,
  retroComputerTheme,
} from './compact-themes';

/**
 * Complete themes registry
 * Maps theme IDs to theme configurations
 */
export const themes: Record<string, ThemeConfig> = {
  // Standard Professional Themes
  'midnight-command': midnightCommandTheme,
  'daylight-operations': daylightOperationsTheme,
  'high-contrast': highContrastTheme,
  'focused-commander': focusedCommanderTheme,
  'executive-dashboard': executiveDashboardTheme,
  'cupcake': cupcakeTheme,

  // Developer Themes
  'terminal-green': terminalGreenTheme,
  'cyberpunk': cyberpunkTheme,
  'nord': nordTheme,
  'solarized': solarizedTheme,
  'gruvbox': gruvboxTheme,
  'one-dark': oneDarkTheme,
  'tokyo-night': tokyoNightTheme,
  'catppuccin': catppuccinTheme,
  'everforest': everforestTheme,
  'rose-pine': rosePineTheme,
  'oceanic-next': oceanicNextTheme,
  'github-dark': githubDarkTheme,
  'ayu-mirage': ayuMirageTheme,
  'night-owl': nightOwlTheme,
  'palenight': palenightTheme,

  // Warm/Brown Themes
  'terracotta': terracottaTheme,
  'mocha': mochaTheme,
  'desert-sand': desertSandTheme,
  'adobe-clay': adobeClayTheme,
  'caramel': caramelTheme,
  'maple-wood': mapleWoodTheme,
  'ember': emberTheme,
  'sunset-blaze': sunsetBlazeTheme,
  'volcanic': volcanicTheme,
  'crimson': crimsonTheme,
  'tangerine-dream': tangerineDreamTheme,
  'hot-lava': hotLavaTheme,

  // Retro/Synthwave Compact Themes
  'synthwave-84': synthwave84Theme,
  'vaporwave': vaporwaveTheme,
  'outrun': outrunTheme,
  'miami-vice': miamiViceTheme,
  'neon-nights': neonNightsTheme,
  'arcade': arcadeTheme,

  // Neon/Bright Compact Themes
  'neon-burst': neonBurstTheme,
  'fluorescent': fluorescentTheme,
  'pop-art': popArtTheme,
  'electric': electricTheme,

  // Seasonal Compact Themes
  'autumn-leaves': autumnLeavesTheme,
  'halloween': halloweenTheme,
  'spring-bloom': springBloomTheme,
  'summer-sky': summerSkyTheme,

  // Nature/Cultural Compact Themes
  'coral-reef': coralReefTheme,
  'canyon': canyonTheme,
  'tokyo-neon': tokyoNeonTheme,
  'retro-diner': retroDinerTheme,
  'cyberpunk-pink': cyberpunkPinkTheme,
  'vintage-poster': vintagePosterTheme,
  'neon-forest': neonForestTheme,
  'sunset-boulevard': sunsetBoulevardTheme,
  'art-deco': artDecoTheme,
  'bubblegum-pop': bubblegumPopTheme,
  'rust-copper': rustCopperTheme,
  'lavender-dreams': lavenderDreamsTheme,
  'emerald-city': emeraldCityTheme,
  'cherry-cola': cherryColaTheme,
  'mint-chocolate': mintChocolateTheme,
  'peacock': peacockTheme,
  'desert-sunset': desertSunsetTheme,
  'cosmic-purple': cosmicPurpleTheme,
  'forest-moss': forestMossTheme,
  'candy-shop': candyShopTheme,
  'industrial': industrialTheme,
  'tropical-punch': tropicalPunchTheme,
  'retro-computer': retroComputerTheme,
};

/**
 * Default theme
 */
export const defaultTheme = midnightCommandTheme;
