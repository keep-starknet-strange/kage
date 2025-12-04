# KAGE Browser Extension

This directory contains the browser extension version of KAGE wallet, built using [WXT](https://wxt.dev/).

## Quick Start

### 1. Install Dependencies

```bash
cd extension
npm install
```

### 2. Build Expo Web Bundle

The extension loads the Expo web build. You need to build it first:

```bash
# From the root of the project
cd ..
npx expo export --platform web --output-dir extension/public
```

### 3. Add Icons

Copy your app icons to `extension/public/`:
- `icon-16.png` (16x16)
- `icon-32.png` (32x32)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)

Or run this to copy from your existing resources:

```bash
# Example - adjust paths as needed
cp ../resources/logo/web/favicon-48x48.png public/icon-48.png
```

### 4. Run Development Mode

```bash
npm run dev
```

This will:
- Build the extension
- Watch for changes
- Output to `.output/chrome-mv3/`

### 5. Load in Browser

**Chrome/Edge:**
1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `extension/.output/chrome-mv3` directory

**Firefox:**
```bash
npm run dev:firefox
```
Then:
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in `extension/.output/firefox-mv3`

## Development Workflow

### Watch Mode

For active development, run both watchers in separate terminals:

**Terminal 1 - Watch Expo changes:**
```bash
# From project root
npx expo export --platform web --output-dir extension/public --watch
```

**Terminal 2 - Watch extension changes:**
```bash
cd extension
npm run dev
```

Now any changes to your Expo app or extension code will automatically rebuild.

### Making Changes

- **Expo App Changes**: Edit files in `src/`, they'll rebuild automatically
- **Extension Logic**: Edit files in `extension/entrypoints/`
- **Extension Config**: Edit `extension/wxt.config.ts`

## Building for Production

### 1. Build Expo (optimized)

```bash
# From project root
npx expo export --platform web --output-dir extension/public --minify
```

### 2. Build Extension

```bash
cd extension

# For Chrome/Edge
npm run build

# For Firefox
npm run build:firefox
```

### 3. Create Distribution Zip

```bash
# For Chrome/Edge
npm run zip

# For Firefox  
npm run zip:firefox
```

The zip files will be in `extension/.output/`:
- `chrome-mv3-X.X.X.zip` - For Chrome Web Store
- `firefox-mv3-X.X.X.zip` - For Firefox Add-ons

## Project Structure

```
extension/
├── entrypoints/              # Extension entry points
│   ├── popup.html           # Main popup (loads Expo app)
│   └── background.ts        # Background service worker
├── public/                  # Static assets
│   ├── _expo/              # Expo web build (generated)
│   ├── assets/             # Expo assets (generated)
│   └── icon-*.png          # Extension icons
├── wxt.config.ts           # WXT configuration
├── package.json            # Extension dependencies
└── tsconfig.json           # TypeScript config
```

## How It Works

1. **Expo Export**: Your Expo app is built for web, creating static HTML/JS/CSS
2. **Extension Popup**: `popup.html` loads the Expo web build
3. **Storage Bridge**: Extension uses `chrome.storage` instead of `localStorage`
4. **Background Script**: Handles extension-specific logic

## Storage

The app automatically detects when running in an extension and uses `chrome.storage.local` instead of `localStorage`:

```typescript
// Automatically handled by the storage layer
import { isExtension } from '@/polyfills/extension';

if (isExtension()) {
  // Uses ExtensionKeyValueStorage (chrome.storage.local)
} else {
  // Uses WebKeyValueStorage (localStorage)
}
```

## Debugging

### View Extension Logs

**Chrome:**
1. Right-click extension icon → "Inspect popup"
2. Console shows popup logs

**Background script:**
1. Go to `chrome://extensions`
2. Click "Inspect views: background page"

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Inspect" on your extension

### Common Issues

**Issue: Blank popup**
- Check console for errors
- Ensure Expo web build exists in `public/`
- Verify CSP settings in `wxt.config.ts`

**Issue: Storage not working**
- Check that `storage` permission is in manifest
- Verify `isExtension()` returns true
- Check background script logs

**Issue: Assets not loading**
- Ensure all asset paths use `chrome.runtime.getURL()`
- Check that files exist in `public/`

## Testing

### Manual Testing Checklist

- [ ] Extension installs without errors
- [ ] Popup opens and shows UI
- [ ] Can create new wallet
- [ ] Can restore wallet from seed phrase
- [ ] Storage persists after closing popup
- [ ] Can send transactions
- [ ] Can receive transactions
- [ ] Network switching works
- [ ] All routes accessible

### Testing in Different Browsers

```bash
# Chrome/Edge
npm run dev

# Firefox
npm run dev:firefox
```

## Publishing

### Chrome Web Store

1. Build production version: `npm run build && npm run zip`
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload `chrome-mv3-X.X.X.zip`
4. Fill in store listing details
5. Submit for review

### Firefox Add-ons

1. Build Firefox version: `npm run build:firefox && npm run zip:firefox`
2. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
3. Upload `firefox-mv3-X.X.X.zip`
4. Fill in listing details
5. Submit for review

## Configuration

### Manifest Permissions

Edit `wxt.config.ts` to modify permissions:

```typescript
manifest: {
  permissions: [
    'storage',      // Required for wallet storage
    'activeTab',    // For dApp interaction
    'tabs',         // For tab management
  ],
  host_permissions: [
    'https://*.starknet.io/*',  // Add RPC endpoints
  ],
}
```

### Popup Size

Edit `popup.html` to change popup dimensions:

```css
html, body {
  width: 375px;   /* Adjust width */
  height: 600px;  /* Adjust height */
}
```

## Resources

- [WXT Documentation](https://wxt.dev/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Firefox Extension Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Expo Web Docs](https://docs.expo.dev/workflow/web/)

## Support

For issues specific to:
- **Extension functionality**: Check WXT docs
- **Expo web build**: Check Expo docs
- **KAGE wallet**: Check main project README


