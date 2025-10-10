import { colorTokens, lightColorOverrides } from './tokens';

type ThemeKeys =
  | 'background'
  | 'surface'
  | 'surfaceElevated'
  | 'surfaceSunken'
  | 'glass'
  | 'color'
  | 'colorMuted'
  | 'colorSecondary'
  | 'accent'
  | 'accentAlt'
  | 'success'
  | 'warning'
  | 'error'
  | 'border'
  | 'borderStrong';

type ThemeDefinition = Record<ThemeKeys, string>;

const darkTheme: ThemeDefinition = {
  background: colorTokens['bg.default'],
  surface: colorTokens['bg.default'],
  surfaceElevated: colorTokens['bg.elevated'],
  surfaceSunken: colorTokens['bg.sunken'],
  glass: colorTokens['surface.glass'],
  color: colorTokens['text.primary'],
  colorSecondary: colorTokens['text.secondary'],
  colorMuted: colorTokens['text.muted'],
  accent: colorTokens['brand.accent'],
  accentAlt: colorTokens['brand.accentAlt'],
  success: colorTokens['status.success'],
  warning: colorTokens['status.warning'],
  error: colorTokens['status.error'],
  border: colorTokens['border.subtle'],
  borderStrong: colorTokens['border.strong'],
};

const lightTheme: ThemeDefinition = {
  ...darkTheme,
  background: lightColorOverrides['bg.default'],
  surface: lightColorOverrides['bg.default'],
  surfaceElevated: '#FFFFFF',
  surfaceSunken: '#F0F3F7',
  color: lightColorOverrides['text.primary'],
  border: lightColorOverrides['border.subtle'],
};

export const kageThemes = {
  dark: darkTheme,
  light: lightTheme,
};

export type ThemeName = keyof typeof kageThemes;
