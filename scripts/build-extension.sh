#!/bin/bash

# KAGE Extension Build Script
# This script builds the complete browser extension including the Expo web bundle

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXTENSION_DIR="$PROJECT_ROOT/extension"
EXPO_OUTPUT_DIR="$EXTENSION_DIR/public"

echo -e "${BLUE}╔═════════════════════════════════╗${NC}"
echo -e "${BLUE}║   KAGE Extension Build Script   ║${NC}"
echo -e "${BLUE}╚═════════════════════════════════╝${NC}"
echo ""

# Parse arguments
BUILD_MODE="production"
TARGET_BROWSER="chrome"
SKIP_EXPO=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dev)
      BUILD_MODE="development"
      shift
      ;;
    --firefox)
      TARGET_BROWSER="firefox"
      shift
      ;;
    --skip-expo)
      SKIP_EXPO=true
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
echo -e "  Project Root: ${GREEN}$PROJECT_ROOT${NC}"
echo ""

# Check if extension directory exists
if [ ! -d "$EXTENSION_DIR" ]; then
  echo -e "${RED}✗ Extension directory not found: $EXTENSION_DIR${NC}"
  exit 1
fi

# Install extension dependencies if needed
echo -e "${BLUE}[1/5]${NC} Checking extension dependencies..."
if [ ! -d "$EXTENSION_DIR/node_modules" ]; then
  echo -e "${YELLOW}  Installing extension dependencies...${NC}"
  cd "$EXTENSION_DIR"
  npm install
  cd "$PROJECT_ROOT"
else
  echo -e "${BLUE} ✓ Dependencies already installed ${NC}"
fi
echo -e "${BLUE}[1/5]${NC} ----"
echo ""

# Build Expo web bundle
if [ "$SKIP_EXPO" = false ]; then
  echo -e "${BLUE}[2/5]${NC} Building Expo web bundle..."
  
  # Clean previous build
  if [ -d "$EXPO_OUTPUT_DIR/_expo" ]; then
    echo -e "${YELLOW}  Cleaning previous build...${NC}"
    rm -rf "$EXPO_OUTPUT_DIR/_expo"
    rm -rf "$EXPO_OUTPUT_DIR/assets"
    rm -f "$EXPO_OUTPUT_DIR/metadata.json"
  fi
  
  # Build Expo
  cd "$PROJECT_ROOT"
  if [ "$BUILD_MODE" = "production" ]; then
    echo -e "${YELLOW}  Running: npx expo export --platform web --output-dir $EXPO_OUTPUT_DIR"
    npx expo export --platform web --output-dir "$EXPO_OUTPUT_DIR"
  else
    echo -e "${YELLOW}  Running: npx expo export --platform web --output-dir $EXPO_OUTPUT_DIR${NC}"
    npx expo export --platform web --output-dir "$EXPO_OUTPUT_DIR"
  fi
  
  echo -e "${GREEN} ✓ Expo web bundle built${NC}"
else
  echo -e "${BLUE} Skipping Expo build (--skip-expo flag) ${NC}"
fi
echo -e "${BLUE}[2/5]${NC} ----"
echo ""

# Copy icons from resources/logo/web to extension output
echo -e "${BLUE}[3/5]${NC} Copying extension icons..."
for size in 16 32 48 128; do
  SRC_ICON="$PROJECT_ROOT/resources/logo/web/favicon-${size}x${size}.png"
  DEST_ICON="$EXPO_OUTPUT_DIR/icon-$size.png"
  if [ -f "$SRC_ICON" ]; then
    cp "$SRC_ICON" "$DEST_ICON"
    echo -e "${GREEN}  ✓ Copied favicon-${size}x${size}.png to icon-$size.png${NC}"
  else
    echo -e "${YELLOW}  ⚠ Source icon missing: $SRC_ICON${NC}"
  fi
done
echo -e "${BLUE}[3/5]${NC} ----"
echo ""

# Remove _ from expo directory and replace its usage
echo -e "${BLUE}[4/5]${NC} Replace _ from expo output..."
if [ -d "$EXPO_OUTPUT_DIR/_expo" ]; then
  mv "$EXPO_OUTPUT_DIR/_expo" "$EXPO_OUTPUT_DIR/expo"
  echo -e "${GREEN}  ✓ Renamed _expo directory to expo${NC}"
else
  echo -e "${RED}✗ Expo export directory not found: $EXPO_OUTPUT_DIR/expo${NC}"
  exit 1
fi
INDEX_HTML="$EXPO_OUTPUT_DIR/index.html"
if [ -f "$INDEX_HTML" ]; then
  if grep -q "/_expo/" "$INDEX_HTML"; then
    echo -e "${BLUE}[*]${NC} Updating index.html: replacing /_expo/ with /expo/"
    # Use sed to do an in-place replacement
    sed -i.bak 's|/_expo/|/expo/|g' "$INDEX_HTML"
    rm "$INDEX_HTML.bak"
    echo -e "${GREEN}  ✓ Updated index.html to use /expo/${NC}"
  fi
fi
echo -e "${BLUE}[4/5]${NC} ----"
echo ""

# Building the extension
echo -e "${BLUE}[5/5]${NC} Building extension..."
cd "$EXTENSION_DIR"
if [ "$TARGET_BROWSER" = "firefox" ]; then
  if [ "$BUILD_MODE" = "development" ]; then
    npm run dev:firefox &
    echo -e "${GREEN}  ✓ Extension dev server started for Firefox${NC}"
    echo -e "${YELLOW}  Press Ctrl+C to stop${NC}"
    wait
  else
    npm run build:firefox
    npm run zip:firefox
    echo -e "${GREEN}  ✓ Firefox extension built and zipped${NC}"
    echo -e "${GREEN}  Output: $EXTENSION_DIR/.output/firefox-mv3-*.zip${NC}"
  fi
else
  if [ "$BUILD_MODE" = "development" ]; then
    npm run dev &
    echo -e "${GREEN}  ✓ Extension dev server started for Chrome${NC}"
    echo -e "${YELLOW}  Press Ctrl+C to stop${NC}"
    wait
  else
    npm run build
    npm run zip
    echo -e "${GREEN}  ✓ Chrome extension built and zipped${NC}"
    echo -e "${GREEN}  Output: $EXTENSION_DIR/.output/chrome-mv3-*.zip${NC}"
  fi
fi
echo -e "${BLUE}[5/5]${NC} ----"
echo ""

echo -e "${GREEN}╔═════════════════════╗${NC}"
echo -e "${GREEN}║   Build Complete!   ║${NC}"
echo -e "${GREEN}╚═════════════════════╝${NC}"
echo ""

if [ "$BUILD_MODE" = "production" ]; then
  echo -e "${YELLOW}Next steps:${NC}"
  echo -e "  1. Test the extension by loading it in your browser"
  echo -e "  2. Upload the zip file to the extension store"
  echo ""
  echo -e "${YELLOW}To load in Chrome:${NC}"
  echo -e "  1. Go to chrome://extensions"
  echo -e "  2. Enable 'Developer mode'"
  echo -e "  3. Click 'Load unpacked'"
  echo -e "  4. Select: $EXTENSION_DIR/.output/$TARGET_BROWSER-mv3"
fi


