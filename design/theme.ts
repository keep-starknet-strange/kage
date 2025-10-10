import { blurTokens, colorTokens, opacityTokens, radiusTokens, spaceTokens } from './tokens';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  glass: string;
  overlay: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverted: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  borderStrong: string;
  shadowPrimary: string;
  shadowDeep: string;
}

export interface AppTheme {
  colors: ColorPalette;
  radii: typeof radiusTokens;
  spacing: typeof spaceTokens;
  opacity: typeof opacityTokens;
  blur: typeof blurTokens;
}

export const appTheme: AppTheme = {
  colors: {
    background: colorTokens['bg.default'],
    surface: colorTokens['bg.elevated'],
    surfaceElevated: colorTokens['bg.elevated'],
    surfaceSunken: colorTokens['bg.sunken'],
    glass: colorTokens['surface.glass'],
    overlay: colorTokens['surface.overlay'],
    text: colorTokens['text.primary'],
    textSecondary: colorTokens['text.secondary'],
    textMuted: colorTokens['text.muted'],
    textInverted: colorTokens['text.inverted'],
    accent: colorTokens['brand.accent'],
    accentSoft: colorTokens['brand.accentSoft'],
    accentGlow: colorTokens['brand.glow'],
    success: colorTokens['status.success'],
    warning: colorTokens['status.warning'],
    error: colorTokens['status.error'],
    border: colorTokens['border.subtle'],
    borderStrong: colorTokens['border.strong'],
    shadowPrimary: colorTokens['shadow.primary'],
    shadowDeep: colorTokens['shadow.deep'],
  },
  radii: radiusTokens,
  spacing: spaceTokens,
  opacity: opacityTokens,
  blur: blurTokens,
};
