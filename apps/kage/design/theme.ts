import { colorTokens, lightColorOverrides, radiusTokens, spaceTokens } from './tokens';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  glass: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentAlt: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  borderStrong: string;
}

export interface AppTheme {
  colors: ColorPalette;
  radii: typeof radiusTokens;
  spacing: typeof spaceTokens;
  opacity: {
    muted: number;
    disabled: number;
    glass: number;
  };
}

const makeTheme = (overrides: Partial<ColorPalette> = {}): AppTheme => ({
  colors: {
    background: colorTokens['bg.default'],
    surface: colorTokens['bg.default'],
    surfaceElevated: colorTokens['bg.elevated'],
    surfaceSunken: colorTokens['bg.sunken'],
    glass: colorTokens['surface.glass'],
    text: colorTokens['text.primary'],
    textSecondary: colorTokens['text.secondary'],
    textMuted: colorTokens['text.muted'],
    accent: colorTokens['brand.accent'],
    accentAlt: colorTokens['brand.accentAlt'],
    success: colorTokens['status.success'],
    warning: colorTokens['status.warning'],
    error: colorTokens['status.error'],
    border: colorTokens['border.subtle'],
    borderStrong: colorTokens['border.strong'],
    ...overrides,
  },
  radii: radiusTokens,
  spacing: spaceTokens,
  opacity: {
    muted: 0.64,
    disabled: 0.38,
    glass: 0.06,
  },
});

export const darkTheme: AppTheme = makeTheme();

export const lightTheme: AppTheme = makeTheme({
  background: lightColorOverrides['bg.default'],
  surface: lightColorOverrides['bg.default'],
  surfaceElevated: '#FFFFFF',
  surfaceSunken: '#F0F3F7',
  text: lightColorOverrides['text.primary'],
  border: lightColorOverrides['border.subtle'],
});

export type ThemeName = 'dark' | 'light';
