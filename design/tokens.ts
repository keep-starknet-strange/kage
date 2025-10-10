export const colorTokens = {
  'bg.default': '#FFFFFF',
  'bg.elevated': '#F5F5F7',
  'bg.sunken': '#ECEDEF',
  'surface.glass': 'rgba(20,20,20,0.04)',
  'text.primary': '#0A0C0F',
  'text.secondary': '#3C3F45',
  'text.muted': '#6E7075',
  'brand.accent': '#111318',
  'brand.accentAlt': '#C0C2C8',
  'status.success': '#2E2F33',
  'status.warning': '#4A4B4F',
  'status.error': '#1F2024',
  'border.subtle': '#E3E4E8',
  'border.strong': '#C9CBD1',
} as const;

export const lightColorOverrides = {
  'bg.default': '#FFFFFF',
  'text.primary': '#111318',
  'border.subtle': '#E3E4E8',
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
