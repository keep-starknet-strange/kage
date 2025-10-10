import { createFont, createTokens, createTamagui } from 'tamagui';

import { kageThemes } from './design/theme';
import { radiusTokens, spaceTokens } from './design/tokens';

const spaceScale = {
  xxs: spaceTokens[0],
  xs: spaceTokens[1],
  sm: spaceTokens[2],
  md: spaceTokens[3],
  lg: spaceTokens[4],
  xl: spaceTokens[5],
  '2xl': spaceTokens[6],
  '3xl': spaceTokens[7],
  '4xl': spaceTokens[8],
  '5xl': spaceTokens[9],
} as const;

const sizeScale = {
  ...spaceScale,
  '6xl': 80,
  '7xl': 96,
} as const;

const customShorthands = {
  px: 'paddingHorizontal',
  py: 'paddingVertical',
  mx: 'marginHorizontal',
  my: 'marginVertical',
} as const;

const baseSize = {
  xs: 13,
  sm: 16,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  display: 40,
} as const;

const baseLineHeight = {
  xs: 18,
  sm: 22,
  md: 24,
  lg: 26,
  xl: 30,
  '2xl': 34,
  display: 48,
} as const;

const baseWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

const baseLetter = {
  xs: 0.1,
  sm: 0,
  md: 0,
  lg: 0,
  xl: -0.2,
  '2xl': -0.2,
  display: -0.4,
} as const;

const bodyFont = createFont({
  family: 'Inter',
  size: baseSize,
  lineHeight: baseLineHeight,
  weight: baseWeight,
  letterSpacing: baseLetter,
  face: {
    400: { normal: 'Inter_400Regular' },
    500: { normal: 'Inter_500Medium' },
    600: { normal: 'Inter_600SemiBold' },
    700: { normal: 'Inter_700Bold' },
  },
});

const monoFont = createFont({
  family: 'JetBrainsMono',
  size: baseSize,
  lineHeight: baseLineHeight,
  weight: baseWeight,
  letterSpacing: {
    ...baseLetter,
    xs: -0.25,
  },
  face: {
    400: { normal: 'JetBrainsMono_400Regular' },
    500: { normal: 'JetBrainsMono_500Medium' },
    600: { normal: 'JetBrainsMono_600SemiBold' },
  },
});

const tokens = createTokens({
  color: {
    bgDefault: '#0B0F10',
    bgElevated: '#11161A',
    bgSunken: '#070A0C',
    glass: 'rgba(255,255,255,0.06)',
    textPrimary: '#E6F0F2',
    textSecondary: '#A6B3B8',
    textMuted: '#7A8792',
    accent: '#4AF0B8',
    accentAlt: '#9B8CFF',
    success: '#2AD38C',
    warning: '#FFB545',
    error: '#FF5D5D',
    borderSubtle: '#1A2329',
    borderStrong: '#26313A',
  },
  radius: radiusTokens,
  space: {
    none: 0,
    ...spaceScale,
  },
  size: {
    none: 0,
    ...sizeScale,
  },
  zIndex: {
    base: 0,
    raised: 10,
    overlay: 20,
    modal: 30,
    toast: 40,
  },
  opacity: {
    muted: 0.64,
    disabled: 0.38,
    glass: 0.06,
  },
});

const themes = Object.fromEntries(
  Object.entries(kageThemes).map(([key, value]) => [
    key,
    {
      background: value.background,
      surface: value.surface,
      surfaceElevated: value.surfaceElevated,
      surfaceSunken: value.surfaceSunken,
      glass: value.glass,
      color: value.color,
      colorMuted: value.colorMuted,
      colorSecondary: value.colorSecondary,
      accent: value.accent,
      accentAlt: value.accentAlt,
      success: value.success,
      warning: value.warning,
      error: value.error,
      border: value.border,
      borderStrong: value.borderStrong,
    },
  ])
);

export const config = createTamagui({
  fonts: {
    body: bodyFont,
    mono: monoFont,
  },
  tokens,
  themes,
  shorthands: customShorthands,
  media: {
    xs: { maxWidth: 380 },
    sm: { maxWidth: 420 },
    md: { maxWidth: 768 },
  },
});

export default config;
export type AppConfig = typeof config;
