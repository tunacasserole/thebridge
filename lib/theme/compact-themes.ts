/**
 * Compact Themes
 * Vibrant, seasonal, and specialty themes using createCompactTheme helper
 */

import type { ThemeConfig, ThemeVariant } from './types';
import { sharedTypography, sharedSpacing, sharedRadius, sharedElevation, sharedMotion } from './shared';

const createCompactTheme = (id: ThemeVariant, name: string, desc: string, primary: string, secondary: string, tertiary: string, surface: string, mode: 'dark' | 'light' = 'dark'): ThemeConfig => ({
  id, name, description: desc, category: 'standard', mode,
  colors: {
    primary, primaryLight: primary + '33', primaryDark: primary.replace('#', '#cc'), onPrimary: mode === 'dark' ? surface : '#ffffff',
    primaryContainer: primary.replace('#', '#99'), onPrimaryContainer: mode === 'dark' ? '#ffffff' : surface,
    secondary, secondaryLight: secondary + '33', secondaryDark: secondary.replace('#', '#cc'), onSecondary: mode === 'dark' ? surface : '#ffffff',
    secondaryContainer: secondary.replace('#', '#99'), onSecondaryContainer: mode === 'dark' ? '#ffffff' : surface,
    tertiary, tertiaryLight: tertiary + '33', tertiaryDark: tertiary.replace('#', '#cc'), onTertiary: mode === 'dark' ? surface : '#ffffff',
    tertiaryContainer: tertiary.replace('#', '#99'), onTertiaryContainer: mode === 'dark' ? '#ffffff' : surface,
    error: '#ff5252', errorLight: '#ff7979', errorDark: '#ed3d3d', onError: mode === 'dark' ? surface : '#ffffff',
    errorContainer: mode === 'dark' ? '#d42929' : '#ffcdd2', onErrorContainer: mode === 'dark' ? '#ffd6d6' : '#b71c1c',
    warning: '#ffb74d', warningLight: '#ffc973', warningDark: '#ffa726', onWarning: mode === 'dark' ? surface : '#ffffff',
    warningContainer: mode === 'dark' ? '#ff9800' : '#ffe0b2', onWarningContainer: mode === 'dark' ? '#fff3e0' : '#e65100',
    success: '#66bb6a', successLight: '#81c784', successDark: '#4caf50', onSuccess: mode === 'dark' ? surface : '#ffffff',
    successContainer: mode === 'dark' ? '#388e3c' : '#c8e6c9', onSuccessContainer: mode === 'dark' ? '#e8f5e9' : '#1b5e20',
    neutral50: '#fafafa', neutral100: '#f5f5f5', neutral200: '#eeeeee', neutral300: '#e0e0e0', neutral400: '#bdbdbd',
    neutral500: '#9e9e9e', neutral600: '#757575', neutral700: '#616161', neutral800: '#424242', neutral900: mode === 'dark' ? surface : '#212121',
    surface, surfaceDim: mode === 'dark' ? '#0a0a0a' : '#f5f5f5', surfaceVariant: mode === 'dark' ? '#333333' : '#eeeeee',
    surfaceContainer: mode === 'dark' ? '#1a1a1a' : '#f8f8f8', surfaceContainerLow: mode === 'dark' ? '#242424' : '#fafafa',
    surfaceContainerHigh: mode === 'dark' ? '#2e2e2e' : '#ececec', surfaceContainerHighest: mode === 'dark' ? '#383838' : '#e0e0e0',
    onSurface: mode === 'dark' ? '#ffffff' : '#212121', onSurfaceVariant: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 33, 33, 0.7)',
    outline: primary, outlineVariant: primary + '66',
    accent: secondary, accentLight: secondary + '33', accentDark: secondary.replace('#', '#cc'),
    stateHover: `rgba(${parseInt(primary.slice(1,3),16)}, ${parseInt(primary.slice(3,5),16)}, ${parseInt(primary.slice(5,7),16)}, 0.08)`,
    stateFocus: `rgba(${parseInt(primary.slice(1,3),16)}, ${parseInt(primary.slice(3,5),16)}, ${parseInt(primary.slice(5,7),16)}, 0.12)`,
    statePressed: `rgba(${parseInt(primary.slice(1,3),16)}, ${parseInt(primary.slice(3,5),16)}, ${parseInt(primary.slice(5,7),16)}, 0.16)`,
    stateDragged: `rgba(${parseInt(primary.slice(1,3),16)}, ${parseInt(primary.slice(3,5),16)}, ${parseInt(primary.slice(5,7),16)}, 0.24)`,
  },
  typography: sharedTypography, spacing: sharedSpacing, radius: sharedRadius, elevation: sharedElevation, motion: sharedMotion,
});

export const synthwave84Theme = createCompactTheme('synthwave-84', 'Synthwave 84', 'Retro 1980s synthwave with neon colors', '#ff6c11', '#fe4a49', '#2ab7ca', '#0d0221');
export const vaporwaveTheme = createCompactTheme('vaporwave', 'Vaporwave', 'Dreamy vaporwave with pink and cyan', '#ff71ce', '#01cdfe', '#b967ff', '#1a0d26');
export const outrunTheme = createCompactTheme('outrun', 'Outrun', 'Retro outrun racing with sunset gradients', '#f233a8', '#ffd319', '#2de2e6', '#1a0520');
export const miamiViceTheme = createCompactTheme('miami-vice', 'Miami Vice', 'Miami Vice inspired teal and pink', '#ff6bbe', '#00d9ff', '#ff3864', '#0f1a1f');
export const neonNightsTheme = createCompactTheme('neon-nights', 'Neon Nights', 'Vibrant neon city at night', '#ff00ff', '#00ffff', '#ffff00', '#0a0a0a');
export const arcadeTheme = createCompactTheme('arcade', 'Arcade', 'Classic arcade game aesthetics', '#ff3f3f', '#3f9fff', '#ffbf3f', '#1a0505');
export const neonBurstTheme = createCompactTheme('neon-burst', 'Neon Burst', 'Explosive bright neon colors', '#ff0080', '#00ff80', '#8000ff', '#0f0f0f');
export const fluorescentTheme = createCompactTheme('fluorescent', 'Fluorescent', 'Bright fluorescent highlighter colors', '#ccff00', '#ff00cc', '#00ccff', '#0d1a00');
export const popArtTheme = createCompactTheme('pop-art', 'Pop Art', 'Bold pop art comic book colors', '#ff3333', '#3333ff', '#ffff33', '#1a0a0a');
export const electricTheme = createCompactTheme('electric', 'Electric', 'High voltage electric blue and yellow', '#00d4ff', '#ffee00', '#9933ff', '#001a1f');
export const autumnLeavesTheme = createCompactTheme('autumn-leaves', 'Autumn Leaves', 'Warm autumn colors', '#d97742', '#c94f2e', '#bf9860', '#1a0f08');
export const halloweenTheme = createCompactTheme('halloween', 'Halloween', 'Spooky orange and purple', '#ff6600', '#9933ff', '#66ff66', '#1a0a00');
export const springBloomTheme = createCompactTheme('spring-bloom', 'Spring Bloom', 'Fresh spring pastels', '#e91e63', '#66bb6a', '#9c27b0', '#ffffff', 'light');
export const summerSkyTheme = createCompactTheme('summer-sky', 'Summer Sky', 'Bright summer blues and yellows', '#03a9f4', '#ffd54f', '#26c6da', '#ffffff', 'light');
export const coralReefTheme = createCompactTheme('coral-reef', 'Coral Reef', 'Vibrant coral and ocean blues', '#ff6b6b', '#4ecdc4', '#95e1d3', '#0d1a1f');
export const canyonTheme = createCompactTheme('canyon', 'Canyon', 'Desert canyon reds and oranges', '#d4603e', '#cc7a52', '#bf954d', '#1a0f08');
export const tokyoNeonTheme = createCompactTheme('tokyo-neon', 'Tokyo Neon', 'Vibrant Tokyo street neon lights', '#ff0066', '#00ffff', '#ff33cc', '#0f0a1a');
export const retroDinerTheme = createCompactTheme('retro-diner', 'Retro Diner', '1950s diner with warm browns and orange accents', '#ff8c42', '#8b4513', '#d4a574', '#1a0f08');
export const cyberpunkPinkTheme = createCompactTheme('cyberpunk-pink', 'Cyberpunk Pink', 'Hot pink and electric green dystopian future', '#ff1493', '#9333ff', '#00ff41', '#0a0014');
export const vintagePosterTheme = createCompactTheme('vintage-poster', 'Vintage Poster', 'Mauve, mustard, and teal 1960s poster art', '#9c6b98', '#d4a017', '#2f847c', '#1a110f');
export const neonForestTheme = createCompactTheme('neon-forest', 'Neon Forest', 'Bright green and electric lime on dark forest background', '#39ff14', '#00ff00', '#7fff00', '#0a1a0a');
export const sunsetBoulevardTheme = createCompactTheme('sunset-boulevard', 'Sunset Boulevard', 'Orange to pink to purple sunset gradient', '#ff6b35', '#ff00ff', '#b565d8', '#1a0814');
export const artDecoTheme = createCompactTheme('art-deco', 'Art Deco', 'Gold, emerald, and burgundy luxury 1920s style', '#ffd700', '#50c878', '#800020', '#0f0a08');
export const bubblegumPopTheme = createCompactTheme('bubblegum-pop', 'Bubblegum Pop', 'Hot pink, baby blue, and mint playful colors', '#ff69b4', '#89cff0', '#98fb98', '#ffe6f0', 'light');
export const rustCopperTheme = createCompactTheme('rust-copper', 'Rust & Copper', 'Rust orange, copper metallic, and dark brown industrial', '#b7410e', '#b87333', '#6e3b23', '#1a0f08');
export const lavenderDreamsTheme = createCompactTheme('lavender-dreams', 'Lavender Dreams', 'Lavender, mauve, and soft pink dreamy pastels', '#e6e6fa', '#d8b0d8', '#ffb6c1', '#faf0fa', 'light');
export const emeraldCityTheme = createCompactTheme('emerald-city', 'Emerald City', 'Emerald green, gold, and dark forest mystical', '#50c878', '#ffd700', '#2e8b57', '#0a1a0f');
export const cherryColaTheme = createCompactTheme('cherry-cola', 'Cherry Cola', 'Cherry red, cola brown, and cream vintage soda fountain', '#d2042d', '#613613', '#e0c097', '#1a0a05');
export const mintChocolateTheme = createCompactTheme('mint-chocolate', 'Mint Chocolate', 'Mint green, chocolate brown, and cream ice cream delight', '#98ff98', '#3b2414', '#f5f5dc', '#fafff5', 'light');
export const peacockTheme = createCompactTheme('peacock', 'Peacock', 'Teal, purple, and gold vibrant peacock feathers', '#008b8b', '#9370db', '#daa520', '#0a0f1a');
export const desertSunsetTheme = createCompactTheme('desert-sunset', 'Desert Sunset', 'Terracotta, burnt orange, and dusty pink desert warmth', '#e2725b', '#cc5500', '#dcae96', '#1a0f08');
export const cosmicPurpleTheme = createCompactTheme('cosmic-purple', 'Cosmic Purple', 'Deep purple, magenta, and cyan space nebula', '#663399', '#ff1493', '#00ffff', '#0a0020');
export const forestMossTheme = createCompactTheme('forest-moss', 'Forest Moss', 'Moss green, brown, and earth tones natural woodland', '#8a9a5b', '#6b4423', '#556b2f', '#0f1408');
export const candyShopTheme = createCompactTheme('candy-shop', 'Candy Shop', 'Bright pink, yellow, and cyan sweet candy colors', '#ff1493', '#ffff00', '#00ffff', '#fff0f5', 'light');
export const industrialTheme = createCompactTheme('industrial', 'Industrial', 'Gunmetal, orange, and steel blue metallic factory', '#5a6572', '#ff6600', '#4682b4', '#1a1a1a');
export const tropicalPunchTheme = createCompactTheme('tropical-punch', 'Tropical Punch', 'Hot pink, orange, and lime green vibrant tropical', '#ff69b4', '#ff8c00', '#32cd32', '#fff5ee', 'light');
export const retroComputerTheme = createCompactTheme('retro-computer', 'Retro Computer', 'Amber, green phosphor, and beige vintage computing', '#ffbf00', '#33ff33', '#d2b48c', '#f5f5dc', 'light');


