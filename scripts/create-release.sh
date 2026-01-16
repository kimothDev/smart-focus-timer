#!/bin/bash

# Smart Focus Timer Release Script
# Usage: ./scripts/create-release.sh

set -e

echo "========================================"
echo "  Smart Focus Timer Release Script"
echo "========================================"
echo ""

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Version: $VERSION"
echo ""

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI found"
    USE_GH=true
else
    echo "⚠️  GitHub CLI not found"
    echo "   You'll need to create the release manually on GitHub"
    echo ""
    USE_GH=false
fi

# Build APKs
echo "========================================"
echo "  Building APKs..."
echo "========================================"
cd android
./gradlew assembleRelease --quiet
cd ..

echo "✅ Build complete!"
echo ""

# Rename APKs to desired format
echo "========================================"
echo "  Renaming APKs..."
echo "========================================"

# Define source and target files
declare -A APK_MAP=(
    ["app-arm64-v8a-release.apk"]="SmartFocusTimer-${VERSION}-arm64-v8a.apk"
    ["app-armeabi-v7a-release.apk"]="SmartFocusTimer-${VERSION}-armeabi-v7a.apk"
)

APK_DIR="android/app/build/outputs/apk/release"

for source in "${!APK_MAP[@]}"; do
    target="${APK_MAP[$source]}"
    if [ -f "$APK_DIR/$source" ]; then
        cp "$APK_DIR/$source" "$APK_DIR/$target"
        echo "✅ Created: $target"
    else
        echo "❌ Missing: $source"
    fi
done

echo ""

# Create release notes
RELEASE_NOTES="**Smart Focus Timer v${VERSION}**

## What's New
- Version update and build system cleanup
- Removed EAS dependencies (now using Gradle builds only)
- Optimized APK naming for real devices

## Files
- SmartFocusTimer-${VERSION}-arm64-v8a.apk (Most modern devices)
- SmartFocusTimer-${VERSION}-armeabi-v7a.apk (Older 32-bit devices)

## Installation
Enable \"Install from unknown sources\" in your Android settings, then open the APK."

# Save release notes to file
echo "$RELEASE_NOTES" > "RELEASE_NOTES.md"
echo "✅ Created RELEASE_NOTES.md"
echo ""

# Create GitHub release
if [ "$USE_GH" = true ]; then
    echo "========================================"
    echo "  Creating GitHub Release..."
    echo "========================================"

    # Create release and upload APKs
    gh release create "v${VERSION}" \
        --title "Smart Focus Timer v${VERSION}" \
        --notes-file "RELEASE_NOTES.md" \
        "$APK_DIR/SmartFocusTimer-${VERSION}-arm64-v8a.apk" \
        "$APK_DIR/SmartFocusTimer-${VERSION}-armeabi-v7a.apk"

    echo "✅ GitHub release created!"
    echo ""
    echo "🔗 View release: $(gh release view "v${VERSION}" --json url -q '.url')"
else
    echo "========================================"
    echo "  Manual Release Instructions"
    echo "========================================"
    echo ""
    echo "1. Go to: https://github.com/kimoth/smart-focus-timer/releases/new"
    echo ""
    echo "2. Create a new tag: v${VERSION}"
    echo ""
    echo "3. Release title: Smart Focus Timer v${VERSION}"
    echo ""
    echo "4. Copy the contents of RELEASE_NOTES.md into the description"
    echo ""
    echo "5. Drag and drop these files to upload:"
    echo "   - android/app/build/outputs/apk/release/SmartFocusTimer-${VERSION}-arm64-v8a.apk"
    echo "   - android/app/build/outputs/apk/release/SmartFocusTimer-${VERSION}-armeabi-v7a.apk"
    echo ""
    echo "6. Click \"Publish release\""
    echo ""
fi

echo "========================================"
echo "  Done!"
echo "========================================"
