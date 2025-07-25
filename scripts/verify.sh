#!/bin/bash

# Verification script for Figma 3D to SVG Plugin
set -e

echo "🔍 Verifying Figma 3D to SVG Plugin Setup..."
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}❌ Error: manifest.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo "📁 Checking project structure..."

# Check essential files
[ -f "package.json" ]
print_status $? "package.json exists"

[ -f "tsconfig.json" ]
print_status $? "tsconfig.json exists"

[ -f "webpack.config.js" ]
print_status $? "webpack.config.js exists"

[ -f "manifest.json" ]
print_status $? "manifest.json exists"

[ -f "src/plugin.ts" ]
print_status $? "src/plugin.ts exists"

[ -f "src/ui.ts" ]
print_status $? "src/ui.ts exists"

[ -f "src/ui.html" ]
print_status $? "src/ui.html exists"

echo ""
echo "📦 Checking dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules not found. Running npm install...${NC}"
    npm install
fi

# Verify key dependencies
if node -e "require('@google/model-viewer')" 2>/dev/null; then
    print_status 0 "@google/model-viewer installed"
else
    print_status 1 "@google/model-viewer not found"
fi

if node -e "require('three')" 2>/dev/null; then
    print_status 0 "three.js installed"
else
    print_status 1 "three.js not found"
fi

if node -e "require('typescript')" 2>/dev/null; then
    print_status 0 "TypeScript installed"
else
    print_status 1 "TypeScript not found"
fi

echo ""
echo "🔨 Testing build process..."

# Clean and build
npm run clean > /dev/null 2>&1
npm run build > /dev/null 2>&1
build_status=$?

if [ $build_status -eq 0 ]; then
    print_status 0 "Build completed successfully"
else
    print_status 1 "Build failed"
fi

# Check build outputs
[ -f "dist/plugin.js" ]
print_status $? "dist/plugin.js generated"

[ -f "dist/ui.js" ]
print_status $? "dist/ui.js generated"

[ -f "dist/ui.html" ]
print_status $? "dist/ui.html generated"

# Check file sizes (cross-platform)
if [ -f "dist/plugin.js" ]; then
    plugin_size=$(wc -c < "dist/plugin.js" | tr -d ' ')
else
    plugin_size=0
fi

if [ -f "dist/ui.js" ]; then
    ui_size=$(wc -c < "dist/ui.js" | tr -d ' ')
else
    ui_size=0
fi

if [ "$plugin_size" -gt 0 ]; then
    print_status 0 "plugin.js has content (${plugin_size} bytes)"
else
    print_status 1 "plugin.js is empty"
fi

if [ "$ui_size" -gt 100000 ]; then
    print_status 0 "ui.js has expected size (${ui_size} bytes)"
    if [ "$ui_size" -gt 600000 ]; then
        print_warning "ui.js is large (${ui_size} bytes). Consider optimizing."
    fi
else
    print_status 1 "ui.js is unexpectedly small (${ui_size} bytes)"
fi

echo ""
echo "📋 Validating manifest.json..."

# Check manifest structure
manifest_valid=$(node -e "
try {
    const manifest = require('./manifest.json');
    const required = ['name', 'id', 'api', 'main', 'ui'];
    const missing = required.filter(key => !manifest[key]);
    if (missing.length === 0) {
        console.log('valid');
    } else {
        console.log('missing: ' + missing.join(', '));
    }
} catch(e) {
    console.log('invalid: ' + e.message);
}
")

if [ "$manifest_valid" = "valid" ]; then
    print_status 0 "manifest.json structure is valid"
else
    print_status 1 "manifest.json is invalid: $manifest_valid"
fi

echo ""
echo "🧪 Running package creation test..."

# Test package creation
npm run package > /dev/null 2>&1
package_status=$?

if [ $package_status -eq 0 ] && [ -f "3d_plugin.zip" ]; then
    print_status 0 "Package created successfully"

    # Check package contents
    zip_contents=$(unzip -l 3d_plugin.zip 2>/dev/null | grep -E "(manifest\.json|dist/)")
    if echo "$zip_contents" | grep -q "manifest.json" && echo "$zip_contents" | grep -q "dist/"; then
        print_status 0 "Package contains required files"
    else
        print_status 1 "Package missing required files"
    fi
else
    print_status 1 "Package creation failed"
fi

echo ""
echo "🎯 Plugin Information:"
echo "======================"

# Extract plugin info from manifest
plugin_name=$(node -e "console.log(require('./manifest.json').name)" 2>/dev/null)
plugin_id=$(node -e "console.log(require('./manifest.json').id)" 2>/dev/null)
plugin_api=$(node -e "console.log(require('./manifest.json').api)" 2>/dev/null)

echo "Name: $plugin_name"
echo "ID: $plugin_id"
echo "API Version: $plugin_api"
if [ -f "3d_plugin.zip" ]; then
    zip_size=$(wc -c < "3d_plugin.zip" | tr -d ' ')
    echo "Package Size: ${zip_size} bytes"
else
    echo "Package Size: Not created"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
print_info "1. Open Figma Desktop App"
print_info "2. Go to Plugins → Development → Import plugin from manifest..."
print_info "3. Select the manifest.json file from this directory"
print_info "4. Test the plugin with sample 3D models"

echo ""
echo "📚 Useful Commands:"
echo "=================="
echo "npm run dev          # Development build with watching"
echo "npm run build        # Production build"
echo "npm run package      # Create distribution package"
echo "./scripts/build.sh   # Complete build with verification"

echo ""
echo "🔗 Resources:"
echo "============"
echo "• Documentation: README.md"
echo "• Examples: EXAMPLES.md"
echo "• Deployment: DEPLOYMENT.md"
echo "• Sample models: https://sketchfab.com (search for downloadable glTF)"

echo ""
if [ $build_status -eq 0 ] && [ $package_status -eq 0 ]; then
    echo -e "${GREEN}🎉 Plugin setup verification completed successfully!${NC}"
    echo -e "${GREEN}   Your Figma plugin is ready for development and testing.${NC}"
else
    echo -e "${RED}❌ Setup verification failed. Please check the errors above.${NC}"
    exit 1
fi
