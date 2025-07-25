# Deployment and Development Guide - 3D - Figma plugin

## Quick Start

### 1. Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd 3d
npm install

# Build the plugin
npm run build

# Or use the build script
./scripts/build.sh
```

### 2. Load Plugin in Figma

1. Open **Figma Desktop App** (plugin development requires desktop version)
2. Go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Select the `manifest.json` file from this project directory
4. The plugin will appear in your plugins list

### 3. Test the Plugin

1. Create a new Figma file or open an existing one
2. Go to **Plugins** → **3D**
3. Test with sample 3D models (.glb, .gltf files) or SVG files

## Development Workflow

### File Structure
```
3d/
├── manifest.json          # Plugin configuration
├── src/
│   ├── plugin.ts          # Main plugin logic (Figma sandbox)
│   ├── ui.ts              # UI logic (iframe)
│   └── ui.html            # Plugin interface
├── dist/                  # Build output
└── scripts/build.sh       # Build automation
```

### Development Commands

```bash
# Development build with file watching
npm run dev

# Production build
npm run build

# Clean build artifacts
npm run clean

# Create distribution package
npm run package

# Build and package in one command
npm run publish
```

### Hot Reloading During Development

1. Run `npm run dev` to start file watching
2. Make changes to your source files
3. Reload the plugin in Figma:
   - Right-click on canvas → **Plugins** → **Development** → **Hot reload plugin**
   - Or close and reopen the plugin

## Publishing to Figma Community

### Prerequisites

1. **Figma Account**: Ensure you have a Figma account
2. **Plugin Ready**: Complete development and testing
3. **Assets**: Prepare plugin icon and cover image

### Step 1: Prepare for Publication

```bash
# Build production version
npm run build

# Create distribution package
npm run package
```

This creates `3d_plugin.zip` containing:
- `manifest.json`
- `dist/plugin.js`
- `dist/ui.js`
- `dist/ui.html`

### Step 2: Plugin Submission

1. **Login to Figma**: Go to [figma.com](https://figma.com)
2. **Access Publisher**: Visit [figma.com/developers](https://figma.com/developers)
3. **Create New Plugin**: Click "Publish a plugin"
4. **Upload Package**: Upload the `3d_plugin.zip` file
5. **Plugin Details**:
   - **Name**: "3D"
   - **Description**: Brief description of functionality
   - **Tags**: "3D", "svg", "png", "glb", "gltf"
   - **Category**: "Import/Export"

### Step 3: Assets and Metadata

#### Required Assets
- **Plugin Icon**: 128x128px PNG
- **Cover Image**: 1920x960px PNG/JPG
- **Screenshots**: Multiple screenshots showing usage

#### Recommended Content
- Clear description of features
- Step-by-step usage instructions
- Supported file formats
- Example use cases

### Step 4: Review Process

1. **Automated Review**: Figma checks technical requirements
2. **Manual Review**: Team reviews content and functionality
3. **Approval**: Usually takes 1-3 business days
4. **Publication**: Plugin appears in community

## Version Management

### Updating Your Plugin

1. **Update Version**: Modify version in `manifest.json`
2. **Build**: Run `npm run build`
3. **Test**: Verify all features work correctly
4. **Package**: Create new package with `npm run package`
5. **Upload**: Submit updated package through Figma developer portal

### Version Numbering
Follow semantic versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.0.1): Bug fixes
---

## Quick Reference

### Essential Commands
```bash
npm run dev         # Development with hot reload
npm run build       # Production build
npm run package     # Create distribution zip
./scripts/build.sh  # Complete build process
```

### Key Files
- `manifest.json`: Plugin configuration and permissions
- `src/plugin.ts`: Main Figma API interactions
- `src/ui.ts`: User interface and 3D processing logic
- `src/ui.html`: Plugin interface markup

### Figma API Resources
- [Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [Developer Community](https://forum.figma.com/c/developers)
- [Plugin Samples](https://github.com/figma/plugin-samples)
