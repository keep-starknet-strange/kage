export const colorTokens = {
  'bg.default': '#F6F7FB',
  'bg.elevated': '#FFFFFF',
  'bg.sunken': '#EEF0F5',
  'surface.glass': 'rgba(255,255,255,0.56)',
  'surface.overlay': 'rgba(16,18,26,0.36)',
  'text.primary': '#141824',
  'text.secondary': '#3E4354',
  'text.muted': '#6C7285',
  'text.inverted': '#FFFFFF',
  'brand.accent': '#4E3CC8',
  'brand.accentSoft': '#7260F2',
  'brand.glow': 'rgba(93,62,247,0.16)',
  'status.success': '#2FB984',
  'status.warning': '#F5A623',
  'status.error': '#E94B65',
  'border.subtle': '#E4E6EF',
  'border.strong': '#C9CCDA',
  'shadow.primary': 'rgba(20,24,36,0.12)',
  'shadow.deep': 'rgba(20,24,36,0.24)',
} as const;

export const radiusTokens = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const spaceTokens = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

export const elevationTokens = {
  e0: { y: 0, b: 0, r: 0.04 },
  e1: { y: 2, b: 12, r: 0.08 },
  e2: { y: 8, b: 24, r: 0.12 },
  e3: { y: 16, b: 32, r: 0.18 },
} as const;

export const blurTokens = {
  glass: 22,
  sheet: 28,
} as const;

export const opacityTokens = {
  muted: 0.64,
  disabled: 0.38,
  overlay: 0.22,
} as const;

export type ColorTokenKey = keyof typeof colorTokens;
