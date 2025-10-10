export const colorTokens = {
  'bg.default': '#0B0F10',
  'bg.elevated': '#11161A',
  'bg.sunken': '#070A0C',
  'surface.glass': 'rgba(255,255,255,0.06)',
  'text.primary': '#E6F0F2',
  'text.secondary': '#A6B3B8',
  'text.muted': '#7A8792',
  'brand.accent': '#4AF0B8',
  'brand.accentAlt': '#9B8CFF',
  'status.success': '#2AD38C',
  'status.warning': '#FFB545',
  'status.error': '#FF5D5D',
  'border.subtle': '#1A2329',
  'border.strong': '#26313A',
} as const;

export const lightColorOverrides = {
  'bg.default': '#F6F8FA',
  'text.primary': '#0B0F10',
  'border.subtle': '#E3E8ED',
} as const;

export const radiusTokens = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const spaceTokens = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

export const elevationTokens = {
  e0: { y: 0, b: 0, r: 0.04 },
  e1: { y: 2, b: 8, r: 0.06 },
  e2: { y: 6, b: 16, r: 0.08 },
  e3: { y: 12, b: 24, r: 0.12 },
} as const;

export const blurTokens = {
  soft: 14,
  heavy: 22,
} as const;

export const opacityTokens = {
  muted: 0.64,
  disabled: 0.38,
  glass: 0.06,
} as const;

export type ColorTokenKey = keyof typeof colorTokens;
