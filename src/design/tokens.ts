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

// Ztarknet-inspired theme: Cypherpunk aesthetic with deep blacks and vibrant orange accents
// Based on https://www.ztarknet.cash/
export const ztarknetColorTokens = {
  'bg.default': '#040405',
  'bg.elevated': 'rgba(12, 13, 17, 0.85)',
  'bg.sunken': '#000000',
  'surface.glass': 'rgba(12, 13, 17, 0.85)',
  'surface.overlay': 'rgba(255, 107, 26, 0.12)',
  'text.primary': '#f4f4f6',
  'text.secondary': '#B8B8C8',
  'text.muted': '#777c8e',
  'text.inverted': '#040405',
  'brand.accent': '#ff6b1a',
  'brand.accentSoft': '#ff8946',
  'brand.glow': 'rgba(255, 107, 26, 0.32)',
  'status.success': '#00FF88', // Bright green for "proof verified" states
  'status.info': '#5B9EFF',
  'status.warning': '#FFB84D',
  'status.error': '#FF1744',
  'border.subtle': 'rgba(255, 107, 26, 0.2)',
  'border.strong': 'rgba(255, 107, 26, 0.4)',
  'shadow.primary': 'rgba(255, 107, 26, 0.16)',
  'shadow.deep': 'rgba(0, 0, 0, 0.72)',
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
