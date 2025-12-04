import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  outDir: '.output',
  publicDir: 'public',
  
  manifest: {
    name: 'KAGE Wallet',
    description: 'Starknet wallet for managing your digital assets',
    version: '0.1.0',
    
    permissions: [
      'storage',           // For encrypted wallet storage
      'activeTab',         // For dApp interaction
      'tabs',              // For managing tabs
      'scripting',         // For injecting content scripts
    ],
    
    // Allow communication with Starknet RPCs and DeFi protocols
    host_permissions: [
      'https://*.starknet.io/*',
      'https://*.avnu.fi/*',
      'https://*.argent.xyz/*',
    ],
    
    action: {
      default_popup: 'index.html',
      default_title: 'KAGE Wallet',
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
        48: 'icon-48.png',
        128: 'icon-128.png',
      },
    },
    
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },

    // Content Security Policy for MV3
    // Allow wasm for crypto operations
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
  },

  vite: () => ({
    // Don't try to bundle the Expo output
    build: {
      rollupOptions: {
        external: [
          '/expo/**',
          '/assets/**',
        ],
      },
    },
  }),
});

