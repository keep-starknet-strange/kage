import { Platform } from "react-native";

// Inspired by https://www.ztarknet.cash/
export const ztarknetColorTokens = {
  'bg.default': '#0a0908',
  'bg.elevated': '#221e1c',
  'bg.sunken': '#16130f',
  'surface.glass': 'rgba(34, 30, 28, 0.85)',
  'surface.overlay': 'rgba(255, 107, 26, 0.12)',
  'text.primary': '#f4f4f6',
  'text.secondary': '#B8B8C8',
  'text.muted': '#777c8e',
  'text.inverted': '#040405',
  'brand.accent': '#ff6b1a',
  'brand.accentSoft': '#ff8946',
  'brand.glow': 'rgba(255, 107, 26, 0.32)',
  'status.success': '#00FF88',
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

export const fontTokens = {
  ubuntuMono: {
    regular: Platform.select({
      ios: 'UbuntuMono-Regular',
      android: 'UbuntuMono_400Regular',
      default: 'UbuntuMono_400Regular',
    }),
    italic: Platform.select({
      ios: 'UbuntuMono-Italic',
      android: 'UbuntuMono_400Regular_Italic',
      default: 'UbuntuMono_400Regular_Italic',
    }),
    bold: Platform.select({
      ios: 'UbuntuMono-Bold',
      android: 'UbuntuMono_700Bold',
      default: 'UbuntuMono_700Bold',
    }),
    boldItalic: Platform.select({
      ios: 'UbuntuMono-BoldItalic',
      android: 'UbuntuMono_700Bold_Italic',
      default: 'UbuntuMono_700Bold_Italic',
    }),
  },
} as const;

export const fontStyles = {
  ubuntuMono: {
    semibold: {
      fontWeight: "600",
      fontFamily: fontTokens.ubuntuMono.bold,
    },
    bold: {
      fontWeight: "700",
      fontFamily: fontTokens.ubuntuMono.bold,
    },
    boldItalic: {
      fontWeight: "700",
      fontStyle: "italic",
      fontFamily: fontTokens.ubuntuMono.boldItalic,
    },
    regular: {
      fontWeight: "400",
      fontFamily: fontTokens.ubuntuMono.regular,
    },
    italic: {
      fontWeight: "400",
      fontStyle: "italic",
      fontFamily: fontTokens.ubuntuMono.italic,
    },
  }
}