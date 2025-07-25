<p>
    <img src="https://raw.githubusercontent.com/hi-sch/3d/refs/heads/main/img1.svg" alt="3D - Figma Plugin">
</p>

<p align="center">
    <img src="https://raw.githubusercontent.com/hi-sch/3d/refs/heads/main/screenshot.png" width="96%" alt="3D - Figma Plugin - Screenshot">
</p>

<br />

<p align="center">
    <img src="https://raw.githubusercontent.com/hi-sch/3d/refs/heads/main/3D_export.png" alt="3D - PNG export">
</p>

<p align="center">
    <img src="https://raw.githubusercontent.com/hi-sch/3d/refs/heads/main/3D_export.svg" alt="3D - SVG export">
</p>

<br />
<br />
<br />

<p align="center">
    <img src="https://raw.githubusercontent.com/hi-sch/3d/refs/heads/main/img2.svg" width="80%" alt="3D - import your Spline files">
</p>

<br />
<br />

# 3D - Figma plugin

Transform 3D models into graphics for your Figma designs. Load existing 3D models or create 3D models from SVG files with customizable geometry, materials, and lighting.

## 📁 Supported File Formats

### 3D Models
- **`.glb`** - Binary glTF files (recommended for best performance)
- **`.gltf`** - Text-based glTF files with external assets

### SVG Graphics
- **`.svg`** - Vector graphics automatically converted to 3D models
- **Supported elements**: Paths, shapes, complex geometries with special character cleanup
- **Live preview**: See your SVG transform into 3D with real-time material updates
- **Smart processing**: Automatic cleanup of problematic characters and elements

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build Plugin**:
   ```bash
   npm run build
   ```

3. **Load in Figma**:
   - Open Figma Desktop App
   - Go to Plugins → Development → Import plugin from manifest...
   - Select `manifest.json` from this directory

4. **Test Plugin**:
   - Create or open a Figma file
   - Run "3D" from plugins menu
   - Drop a 3D model file and export to SVG!

## 🛠️ Development

### Prerequisites
- **Node.js 16+**
- **Figma Desktop App** (required for plugin development)
- Basic knowledge of TypeScript and 3D graphics

### Build Scripts
```bash
npm run dev         # Development build with file watching
npm run build       # Production build
npm run clean       # Remove build artifacts
npm run package     # Create distribution package
npm run publish     # Build and package for publishing
```

### Automated Setup
```bash
# Use the build script for guided setup
./scripts/build.sh --package

# Verify everything is working
./scripts/verify.sh
```

### Pro Tips

#### For 3D Models:
- **Use .glb files** for best performance and compatibility
- **Keep models under 10MB** for smooth loading

#### For SVG to 3D:
- **Simple shapes work best** - avoid overly complex SVGs with many paths
- **Clean SVGs perform better** - use optimized SVGs without unnecessary elements
- **Experiment with depth** - start with smaller values (5-15) and adjust
- **Try different materials** - metallic logos look great with higher metalness values
- **Use bevels wisely** - they add realism but increase complexity
- **Special characters** - automatically cleaned (™, ®, ©) to prevent parsing errors

## 📊 Performance & Limitations

### Bundle Size
- **UI Bundle**: ~730KB (Complete Three.js ecosystem + loaders + controls + materials)
- **Plugin Bundle**: ~4KB (minimal Figma API code)
- **HTML Bundle**: ~740KB (processed HTML with embedded styles)
- **Load Time**: 2-3 seconds for initial plugin startup

### Model Recommendations
- **Optimal Size**: Under 5MB for best performance
- **Triangle Count**: Under 50K triangles for smooth interaction
- **Format**: .glb preferred over .gltf for faster loading
- **Natural Sizing**: Models preserve their original dimensions for optimal camera positioning

### SVG Processing Recommendations
- **File Size**: Under 10MB for smooth processing
- **Complexity**: Simple to medium complexity paths work best
- **Clean Files**: Optimized SVGs without unnecessary elements perform better
- **Character Cleanup**: Special characters automatically removed during processing

### Known Limitations
- SVG output is static (no animation preservation)
- Complex models/SVGs may result in large SVG files
- Advanced material effects are simplified in SVG format
- Memory usage scales with model complexity
- Very detailed geometry may impact performance

## 📁 Project Structure

```
3d/
├── 📄 manifest.json           # Plugin configuration & permissions
├── 📦 package.json            # Dependencies & build scripts
├── ⚙️ tsconfig.json           # TypeScript compiler settings
├── 🔧 webpack.config.js       # Build configuration
├── 📂 src/
│   ├── 🔌 plugin.ts           # Figma API integration
│   ├── 🎨 ui.ts               # 3D viewer & export logic
│   └── 🌐 ui.html             # Plugin interface
├── 📂 dist/                   # Build output (auto-generated)
├── 📂 scripts/                # Build automation tools
├── 🚀 DEPLOYMENT.md           # Publishing instructions
├── 📊 PROJECT_SUMMARY.md      # Technical details
└── 📘 README.md               # This file
```

## 🤝 Contributing

Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature-name`
3. **Test** your changes thoroughly with sample models
4. **Submit** a pull request with clear description

### Areas for Contribution
- Performance optimizations (bundle size reduction, code splitting)
- Additional material presets and lighting environments
- Enhanced SVG processing capabilities
- Support for more 3D file formats (OBJ, FBX)
- Animation export capabilities
- Advanced camera controls and presets
- HDR environment maps for enhanced lighting
- Batch processing for multiple files

### Documentation
- 🚀 **Deployment**: `DEPLOYMENT.md` - Publishing to Figma Community
- 📊 **Project Summary**: `PROJECT_SUMMARY.md` - Technical overview

### External Resources
- **Figma Plugin API**: https://www.figma.com/plugin-docs/
- **Three.js Documentation**: https://threejs.org/docs/
- **Sample 3D Models**: https://sketchfab.com (search for downloadable glTF)
- **glTF Validator**: https://github.khronos.org/glTF-Validator/

### Performance Tips
- Use .glb format instead of .gltf for better loading performance
- Clean SVG files before import (remove unnecessary elements)
- Start with simple geometry and gradually increase complexity
- Clear browser cache if experiencing persistent issues
- Monitor memory usage with complex models

## 📜 License

MIT License - see LICENSE file for details
