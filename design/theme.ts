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

export const darkTheme: AppTheme = makeTheme({
  background: '#0A0C0F',
  surface: '#111318',
  surfaceElevated: '#171A1E',
  surfaceSunken: '#0E1014',
  text: '#F5F6F8',
  textSecondary: '#D0D3D8',
  textMuted: '#9599A1',
  accent: '#F0F1F5',
  accentAlt: '#C0C2C8',
  border: '#262A31',
  borderStrong: '#3A3F48',
});

export const lightTheme: AppTheme = makeTheme({
  background: lightColorOverrides['bg.default'],
  surface: '#FFFFFF',
  surfaceElevated: '#F7F7F9',
  surfaceSunken: '#F0F1F3',
  text: lightColorOverrides['text.primary'],
  textSecondary: '#3C3F45',
  textMuted: '#6E7075',
  accent: '#111318',
  accentAlt: '#C0C2C8',
  border: lightColorOverrides['border.subtle'],
  borderStrong: '#D5D7DC',
});

export type ThemeName = 'dark' | 'light';
