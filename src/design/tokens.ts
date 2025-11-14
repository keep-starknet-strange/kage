export const lightColorTokens = {
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
  'status.info': '#3B82F6',
  'status.warning': '#F5A623',
  'status.error': '#E94B65',
  'border.subtle': '#E4E6EF',
  'border.strong': '#C9CCDA',
  'shadow.primary': 'rgba(20,24,36,0.12)',
  'shadow.deep': 'rgba(20,24,36,0.24)',
} as const;

export const darkColorTokens = {
  'bg.default': '#0F1117',
  'bg.elevated': '#1A1D28',
  'bg.sunken': '#080A0F',
  'surface.glass': 'rgba(26,29,40,0.56)',
  'surface.overlay': 'rgba(255,255,255,0.12)',
  'text.primary': '#F6F7FB',
  'text.secondary': '#C9CCDA',
  'text.muted': '#8B8FA3',
  'text.inverted': '#141824',
  'brand.accent': '#7260F2',
  'brand.accentSoft': '#9B8DF5',
  'brand.glow': 'rgba(114,96,242,0.24)',
  'status.success': '#3FD99D',
  'status.info': '#5B9EFF',
  'status.warning': '#FFB84D',
  'status.error': '#FF6B87',
  'border.subtle': '#2A2E3C',
  'border.strong': '#3E4354',
  'shadow.primary': 'rgba(0,0,0,0.24)',
  'shadow.deep': 'rgba(0,0,0,0.48)',
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
