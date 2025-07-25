#!/bin/bash

# Build script for Figma 3D to SVG Plugin
set -e

echo "🚀 Building Figma 3D to SVG Plugin..."

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the plugin
echo "🔨 Building plugin..."
npm run build

# Check if build was successful
if [ ! -f "dist/plugin.js" ] || [ ! -f "dist/ui.js" ] || [ ! -f "dist/ui.html" ]; then
    echo "❌ Build failed - missing required files"
    exit 1
fi

echo "✅ Build completed successfully!"

# Create package if requested
if [ "$1" = "--package" ]; then
    echo "📦 Creating plugin package..."
    npm run package
    echo "✅ Package created: 3d_plugin.zip"
fi

echo "🎉 Plugin is ready for development!"
echo ""
echo "Next steps:"
echo "1. Open Figma Desktop App"
echo "2. Go to Plugins → Development → Import plugin from manifest..."
echo "3. Select the manifest.json file from this directory"
echo "4. Test your plugin!"
