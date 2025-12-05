#!/bin/bash

# KAGE Extension Build Script
# Builds the extension using only Expo web export and basic TypeScript compilation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_DIR="$PROJECT_ROOT/public"
OUTPUT_DIR="$PROJECT_ROOT/extension"
OUTPUT_DIR_UNPACKED="$OUTPUT_DIR/unpacked"

echo -e "${BLUE}╔══════════════════════════╗${NC}"
echo -e "${BLUE}║   KAGE Extension Build   ║${NC}"
echo -e "${BLUE}╚══════════════════════════╝${NC}"
echo ""

# Parse arguments
BUILD_MODE="production"
TARGET_BROWSER="chrome"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dev)
      BUILD_MODE="development"
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Build Mode: ${GREEN}$BUILD_MODE${NC}"
echo -e "  Target Browser: ${GREEN}$TARGET_BROWSER${NC}"
echo -e "  Output Directory: ${GREEN}$OUTPUT_DIR_UNPACKED${NC}"
echo ""

# Clean output directory
echo -e "${BLUE}[1/6]${NC} Cleaning output directory..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR_UNPACKED"
echo -e "${GREEN}  ✓ Output directory cleaned${NC}"
echo ""

# Build Expo web bundle
echo -e "${BLUE}[2/6]${NC} Building Expo web bundle..."
cd "$PROJECT_ROOT"
EXPO_EXPORT_CMD="npx expo export --platform web --output-dir \"$OUTPUT_DIR_UNPACKED\""
if [[ "$BUILD_MODE" != "production" ]]; then
  EXPO_EXPORT_CMD="$EXPO_EXPORT_CMD --dev --no-minify"
else 
  EXPO_EXPORT_CMD="$EXPO_EXPORT_CMD --clear"
fi
eval $EXPO_EXPORT_CMD
echo -e "${GREEN}  ✓ Expo web bundle built${NC}"
echo ""

# Rename _expo to expo (Chrome doesn't like leading underscores)
echo -e "${BLUE}[3/6]${NC} Renaming _expo directory..."
if [ -d "$OUTPUT_DIR_UNPACKED/_expo" ]; then
  mv "$OUTPUT_DIR_UNPACKED/_expo" "$OUTPUT_DIR_UNPACKED/expo"
  echo -e "${GREEN}  ✓ Renamed _expo to expo${NC}"
  
  # Update references in index.html
  if [ -f "$OUTPUT_DIR_UNPACKED/index.html" ]; then
    sed -i.bak 's|/_expo/|/expo/|g' "$OUTPUT_DIR_UNPACKED/index.html"
    rm "$OUTPUT_DIR_UNPACKED/index.html.bak"
    echo -e "${GREEN}  ✓ Updated index.html references${NC}"
  fi
else
  echo -e "${RED}  ✗ _expo directory not found${NC}"
  exit 1
fi
echo ""

# Copy extension icons
echo -e "${BLUE}[4/6]${NC} Copying extension icons..."
for size in 16 32 48 128; do
  SRC_ICON="$PROJECT_ROOT/resources/logo/web/favicon-${size}x${size}.png"
  DEST_ICON="$OUTPUT_DIR_UNPACKED/icon-$size.png"
  if [ -f "$SRC_ICON" ]; then
    cp "$SRC_ICON" "$DEST_ICON"
    echo -e "${GREEN}  ✓ Copied icon-$size.png${NC}"
  else
    echo -e "${YELLOW}  ⚠ Source icon missing: $SRC_ICON${NC}"
  fi
done
echo ""

# Compile background script if it exists
echo -e "${BLUE}[5/6]${NC} Compiling background script..."
if [ -f "$PUBLIC_DIR/background.ts" ]; then
  # Check if TypeScript is available
  if command -v npx &> /dev/null; then
    echo -e "${YELLOW}  Compiling background.ts...${NC}"
    npx tsc "$PUBLIC_DIR/background.ts" \
      --outDir "$OUTPUT_DIR_UNPACKED" \
      --target ES2020 \
      --module ES2020 \
      --moduleResolution node \
      --skipLibCheck \
      --esModuleInterop \
      --allowSyntheticDefaultImports
    
    # Move background.js to root if it was compiled to a subdirectory
    if [ -f "$OUTPUT_DIR_UNPACKED/entrypoints/background.js" ]; then
      mv "$OUTPUT_DIR_UNPACKED/entrypoints/background.js" "$OUTPUT_DIR_UNPACKED/background.js"
      rm -rf "$OUTPUT_DIR_UNPACKED/entrypoints"
    fi
    
    echo -e "${GREEN}  ✓ Background script compiled${NC}"
  else
    echo -e "${YELLOW}  ⚠ TypeScript not found, skipping background script${NC}"
  fi
else
  echo -e "${YELLOW}  ⚠ No background script found${NC}"
fi
echo ""

# Create manifest.json
echo -e "${BLUE}[6/6]${NC} Creating manifest.json..."
# Read app.json for name, description, version
APP_JSON="$PROJECT_ROOT/app.json"
if [ ! -f "$APP_JSON" ]; then
  echo -e "${RED}  ✗ app.json not found at $APP_JSON${NC}"
  exit 1
fi

APP_NAME=$(node -p "require('$APP_JSON').expo.name || ''")
APP_VERSION=$(node -p "require('$APP_JSON').expo.version || ''")

if [ -z "$APP_NAME" ] || [ -z "$APP_VERSION" ]; then
  echo -e "${RED}  ✗ Could not parse name, or version from app.json${NC}"
  exit 1
fi

cat > "$OUTPUT_DIR_UNPACKED/manifest.json" << MANIFEST_EOF
{
  "manifest_version": 3,
  "name": "$APP_NAME",
  "description": "Privacy is STARK Normal",
  "version": "$APP_VERSION",
  "icons": {
    "16": "icon-16.png",
    "32": "icon-32.png",
    "48": "icon-48.png",
    "128": "icon-128.png"
  },
  "permissions": [
    "storage",
    "activeTab",
    "tabs",
    "scripting"
  ],
  "host_permissions": [
    "https://*.starknet.io/*",
    "https://*.avnu.fi/*",
    "https://*.argent.xyz/*"
  ],
  "action": {
    "default_popup": "index.html",
    "default_title": "$APP_NAME",
    "default_icon": {
      "16": "icon-16.png",
      "32": "icon-32.png",
      "48": "icon-48.png",
      "128": "icon-128.png"
    }
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  },
  "background": {
    "service_worker": "background.js"
  }
}
MANIFEST_EOF
echo -e "${GREEN}  ✓ manifest.json created${NC}"
echo ""

# Create zip file for distribution
if [ "$BUILD_MODE" = "production" ]; then
  echo -e "${BLUE}Creating distribution zip...${NC}"
  cd "$OUTPUT_DIR"
  ZIP_NAME="kage-extension-${TARGET_BROWSER}-$(date +%Y%m%d-%H%M%S).zip"
  zip -r "$ZIP_NAME" . -x "*.DS_Store" -x "__MACOSX/*"
  echo -e "${GREEN}  ✓ Created: $OUTPUT_DIR/$ZIP_NAME${NC}"
  echo ""
fi

echo -e "${GREEN}╔═════════════════════╗${NC}"
echo -e "${GREEN}║   Build Complete!   ║${NC}"
echo -e "${GREEN}╚═════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Extension built at:${NC} $OUTPUT_DIR"
echo ""
echo -e "${YELLOW}To load in Chrome:${NC}"
echo -e "  1. Go to ${BLUE}chrome://extensions${NC}"
echo -e "  2. Enable ${BLUE}'Developer mode'${NC}"
echo -e "  3. Click ${BLUE}'Load unpacked'${NC}"
echo -e "  4. Select: ${BLUE}$OUTPUT_DIR_UNPACKED${NC}"

if [ "$BUILD_MODE" = "production" ]; then
  echo -e "${YELLOW}To publish in Chrome Web Store:${NC}"
  echo -e "  1. Upload the ZIP file: ${BLUE}$OUTPUT_DIR/$ZIP_NAME${NC}"
fi

echo ""
