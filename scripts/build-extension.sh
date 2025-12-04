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

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   KAGE Extension Build Script         ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
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

# Step 1: Check if extension directory exists
if [ ! -d "$EXTENSION_DIR" ]; then
  echo -e "${RED}✗ Extension directory not found: $EXTENSION_DIR${NC}"
  exit 1
fi

# Step 2: Install extension dependencies if needed
echo -e "${BLUE}[1/4]${NC} Checking extension dependencies..."
if [ ! -d "$EXTENSION_DIR/node_modules" ]; then
  echo -e "${YELLOW}  Installing extension dependencies...${NC}"
  cd "$EXTENSION_DIR"
  npm install
  cd "$PROJECT_ROOT"
else
  echo -e "${GREEN}  ✓ Dependencies already installed${NC}"
fi
echo ""

# Step 3: Build Expo web bundle
if [ "$SKIP_EXPO" = false ]; then
  echo -e "${BLUE}[2/4]${NC} Building Expo web bundle..."
  
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
  
  echo -e "${GREEN}  ✓ Expo web bundle built${NC}"
else
  echo -e "${BLUE}[2/4]${NC} Skipping Expo build (--skip-expo flag)"
fi
echo ""

# Step 3.5: Copy icons from resources/logo/web to extension output
echo -e "${BLUE}[*]${NC} Copying extension icons..."
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
echo ""

# Rename $EXPO_OUTPUT_DIR/_expo directory to $EXPO_OUTPUT_DIR/expo if it exists
if [ -d "$EXPO_OUTPUT_DIR/_expo" ]; then
  mv "$EXPO_OUTPUT_DIR/_expo" "$EXPO_OUTPUT_DIR/expo"
  echo -e "${GREEN}  ✓ Renamed _expo directory to expo${NC}"
else
  echo -e "${RED}✗ Expo export directory not found: $EXPO_OUTPUT_DIR/expo${NC}"
  exit 1
fi


# Rename _expo to expo in the main HTML index file if present
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


if [ "$ICONS_MISSING" = true ]; then
  echo -e "${YELLOW}  Note: You should add extension icons to $EXPO_OUTPUT_DIR/${NC}"
  echo -e "${YELLOW}  Required: icon-16.png, icon-32.png, icon-48.png, icon-128.png${NC}"
  echo -e "${YELLOW}  The build will continue but may fail without icons.${NC}"
else
  echo -e "${GREEN}  ✓ All icons present${NC}"
fi
echo ""

# Step 5: Build extension
echo -e "${BLUE}[4/4]${NC} Building extension..."
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

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Build Complete!                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
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


