import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Model-viewer-like helper functions
function toggleAutoRotate() {
  if (controls) {
    controls.autoRotate = !controls.autoRotate;
    console.log("Auto-rotate:", controls.autoRotate ? "enabled" : "disabled");
  }
}

function resetCamera() {
  if (camera && controls && currentModel && initialCameraState) {
    // Reset to the stored initial camera state
    camera.position.copy(initialCameraState.position);
    controls.target.copy(initialCameraState.target);

    // Reset camera orientation
    camera.lookAt(initialCameraState.target);

    // Update controls
    controls.update();

    console.log("Camera reset to initial view");
  } else if (camera && controls && currentModel) {
    // Fallback: re-focus on model if no initial state stored
    focusOnModel();
  }
}

function focusOnModel() {
  if (currentModel && camera && controls) {
    const box = new THREE.Box3().setFromObject(currentModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    controls.target.copy(center);

    // Better camera positioning for optimal viewing
    const maxDim = Math.max(size.x, size.y, size.z);

    // Base distance multiplier for good starting view
    let distanceMultiplier = 2.8;

    // Adjust camera distance based on model type
    console.log(`Setting camera for model type: ${currentModelType}`);
    if (currentModelType === "gltf") {
      // Much closer for GLTF/GLB models for better detail viewing
      distanceMultiplier = 0.8;
      console.log("Using GLTF close distance multiplier: 0.8");
    } else if (currentModelType === "svg") {
      // Slightly farther for SVG models (but still allows zoom in/out)
      distanceMultiplier = 3.5;
      console.log("Using SVG far distance multiplier: 3.5");
    } else {
      console.log("Using default distance multiplier: 2.8");
    }

    // Ensure minimum distance for very small models
    const minDistance = 20;
    const distance = Math.max(maxDim * distanceMultiplier, minDistance);
    const cameraHeight = maxDim * 0.5;

    // Position camera for optimal 3D viewing angle
    camera.position.set(
      center.x + distance * 0.8, // Side angle for better depth perception
      center.y + cameraHeight, // Elevation for better view
      center.z + distance * 0.8, // Distance from model
    );

    // Set camera look direction
    camera.lookAt(center);

    // Store initial camera state for reset functionality
    initialCameraState = {
      position: camera.position.clone(),
      target: center.clone(),
    };

    // Update controls with smooth transition
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    console.log(
      `Camera focused on ${currentModelType} model: distance=${distance.toFixed(2)}, maxDim=${maxDim.toFixed(2)}, multiplier=${distanceMultiplier}, center=(${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`,
    );
    console.log(
      `Final camera position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`,
    );
  }
}

// --- Global variables ---
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let currentModel: THREE.Group | null = null;
let currentFile: File | null = null;
let currentModelType: "svg" | "gltf" | null = null;
let initialCameraState: {
  position: THREE.Vector3;
  target: THREE.Vector3;
} | null = null;
let modelSettings = {
  // Geometry
  depth: 20,
  bevelSize: 0.5,
  bevelThickness: 1,
  bevelSegments: 3,
  // Material (model-viewer style defaults)
  color: "#808080", // Grey default like model-viewer
  roughness: 0.7,
  metalness: 0.1,
  clearcoat: 0,
  transmission: 0,
  // Environment
  envIntensity: 1,
  ambientLight: 0.5,
  directionalLight: 1,
  // Background (transparent by default like model-viewer)
  backgroundColor: "transparent",
};

// --- Initialize Three.js scene ---
function initThreeJS() {
  const canvas = document.getElementById("threejs-canvas") as HTMLCanvasElement;
  const container = document.getElementById("viewerContainer") as HTMLElement;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 0, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 100;
  controls.target.set(0, 0, 0);
  controls.screenSpacePanning = false;
  controls.enableRotate = true;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 1.0;

  // Set transparent background by default (model-viewer style)
  scene.background = null;

  // Lights
  setupLights();

  // Handle resize
  window.addEventListener("resize", onWindowResize);

  // Start render loop
  animate();
}

function setupLights() {
  // Remove any existing lights
  const lightsToRemove: THREE.Light[] = [];
  scene.traverse((object) => {
    if ((object as any).isLight) {
      lightsToRemove.push(object as THREE.Light);
    }
  });
  lightsToRemove.forEach((light) => scene.remove(light));

  // Model-viewer style lighting setup with dynamic parameters
  // Ambient light for overall illumination - uses modelSettings.ambientLight
  const ambientLight = new THREE.AmbientLight(
    0x404040,
    modelSettings.ambientLight,
  );
  scene.add(ambientLight);

  // Key light (main directional light) - uses modelSettings.directionalLight
  const keyLight = new THREE.DirectionalLight(
    0xffffff,
    modelSettings.directionalLight * 1.2,
  );
  keyLight.position.set(1, 1, 1).normalize().multiplyScalar(10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);

  // Fill light (softer directional light from opposite side)
  const fillLight = new THREE.DirectionalLight(
    0xffffff,
    modelSettings.directionalLight * 0.4,
  );
  fillLight.position.set(-1, 0.5, -1).normalize().multiplyScalar(8);
  scene.add(fillLight);

  // Rim light (back light for edge definition)
  const rimLight = new THREE.DirectionalLight(
    0xffffff,
    modelSettings.directionalLight * 0.3,
  );
  rimLight.position.set(0, 1, -1).normalize().multiplyScalar(6);
  scene.add(rimLight);

  // Environment lighting - also uses ambientLight setting
  const hemisphereLight = new THREE.HemisphereLight(
    0x87ceeb,
    0x362d1d,
    modelSettings.ambientLight * 0.8,
  );
  scene.add(hemisphereLight);
}

function onWindowResize() {
  const container = document.getElementById("viewerContainer") as HTMLElement;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Helper function to create shapes from SVG data using official SVGLoader API
function createSVGShapes(svgData: any) {
  const shapes: THREE.Shape[] = [];

  if (svgData.paths) {
    svgData.paths.forEach((path: any) => {
      const pathShapes = SVGLoader.createShapes(path);
      shapes.push(...pathShapes);
    });
  }

  return shapes;
}

// --- SVG to 3D conversion ---
function createSVGModel(svgContent: string) {
  return new Promise((resolve, reject) => {
    try {
      showLoadingProgress("Processing SVG content...", 40);

      // Remove special characters and symbols that can cause parsing issues
      const processedSvgData = svgContent
        .replace(/[™®©]/g, "") // Remove trademark, registered, and copyright symbols
        .replace(/&trade;|&reg;|&copy;/g, ""); // Remove HTML entities

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(processedSvgData, "image/svg+xml");

      const parserError = svgDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("SVG parse error: " + parserError.textContent);
      }

      const svgElement = svgDoc.querySelector("svg");
      if (!svgElement) {
        throw new Error("Invalid SVG: No SVG element found");
      }

      showLoadingProgress("Cleaning SVG elements...", 50);

      // Remove text elements containing special characters
      const textElements = svgDoc.querySelectorAll("text");
      if (textElements.length > 0) {
        textElements.forEach((textEl) => {
          const text = textEl.textContent || "";
          if (/[™®©]|&trade;|&reg;|&copy;/.test(text)) {
            textEl.parentNode?.removeChild(textEl);
          }
        });
      }

      const svgString = new XMLSerializer().serializeToString(svgDoc);

      // Get dimensions
      const viewBox = svgElement.getAttribute("viewBox");
      let width = parseFloat(svgElement.getAttribute("width") || "100");
      let height = parseFloat(svgElement.getAttribute("height") || "100");

      if (viewBox) {
        const [, , vbWidth, vbHeight] = viewBox.split(" ").map(parseFloat);
        width = vbWidth;
        height = vbHeight;
      }

      showLoadingProgress("Creating 3D geometry...", 60);

      const loader = new SVGLoader();
      const svgData = loader.parse(svgString);
      const group = new THREE.Group();

      // Process SVG paths with improved material handling
      svgData.paths.forEach((path, index) => {
        try {
          const shapes = SVGLoader.createShapes(path);
          if (shapes.length === 0) {
            console.warn("No shapes created from path", index);
            return;
          }

          // Update progress during geometry creation
          const progress = 60 + (index / svgData.paths.length) * 20;
          showLoadingProgress(
            `Building 3D shapes... ${index + 1}/${svgData.paths.length}`,
            Math.round(progress),
          );

          shapes.forEach((shape) => {
            const material = new THREE.MeshPhysicalMaterial({
              color: path.color
                ? new THREE.Color(path.color)
                : new THREE.Color(modelSettings.color),
              roughness: Math.max(0.05, modelSettings.roughness),
              metalness: modelSettings.metalness,
              clearcoat: Math.max(modelSettings.clearcoat, 0.05),
              clearcoatRoughness: 0.05,
              transmission: modelSettings.transmission,
              envMapIntensity: modelSettings.envIntensity,
              reflectivity: 1,
              side: THREE.DoubleSide,
              flatShading: false,
            });

            const extrudeSettings = {
              depth: modelSettings.depth / 10, // Better scaling
              bevelEnabled: true,
              bevelThickness: modelSettings.bevelThickness,
              bevelSize: modelSettings.bevelSize,
              bevelSegments: Math.max(4, modelSettings.bevelSegments),
              curveSegments: Math.max(8, modelSettings.bevelSegments * 2),
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
          });
        } catch (error) {
          console.warn("Error creating shapes from path:", error);
        }
      });

      if (group.children.length === 0) {
        throw new Error("No valid shapes found in SVG");
      }

      showLoadingProgress("Finalizing model...", 85);

      // Center and scale the model
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      group.position.sub(center);

      // Better scaling based on viewport
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scale = 8 / Math.max(width, height); // Scale based on original SVG dimensions
        group.scale.setScalar(scale);
      }

      // Add slight rotation for better 3D viewing
      group.rotation.set(0, Math.PI / 4, 0);

      showLoadingProgress("", 100);

      console.log(
        `SVG loaded successfully: ${group.children.length} meshes, dimensions: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`,
      );

      // Brief delay to show completion
      setTimeout(() => {
        resolve(group);
      }, 300);
    } catch (error) {
      console.error("Error creating SVG model:", error);
      reject(error);
    }
  });
}

// --- GLTF model loading ---
function loadGLTFModel(file: File) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const url = URL.createObjectURL(file);

    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene || gltf;

        // Center and scale the model (model-viewer style)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Move model to origin
        model.position.sub(center);

        // Don't scale GLTF models - preserve their natural size
        // This allows the distance multiplier to have a visible effect
        const maxDim = Math.max(size.x, size.y, size.z);

        // Focus camera on the model (this will handle all positioning)
        focusOnModel();

        // Update materials and setup shadows
        model.traverse((child) => {
          if ((child as any).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Preserve original materials but allow color override
            const material = mesh.material as any;
            if (material) {
              if (material.color) {
                material.color = new THREE.Color(modelSettings.color);
              }
              if (material.roughness !== undefined) {
                material.roughness = modelSettings.roughness;
              }
              if (material.metalness !== undefined) {
                material.metalness = modelSettings.metalness;
              }
            }
          }
        });

        URL.revokeObjectURL(url);
        resolve(model);
      },
      (progress) => {
        console.log(
          "Loading progress:",
          (progress.loaded / progress.total) * 100 + "%",
        );
      },
      (error) => {
        console.error("Error loading GLTF:", error);
        URL.revokeObjectURL(url);
        reject(error);
      },
    );
  });
}

// --- Update model with current settings ---
function updateModel() {
  if (!currentModel) return;

  currentModel.traverse((child) => {
    if ((child as any).isMesh) {
      const mesh = child as THREE.Mesh;
      const material = mesh.material as any;
      if (material) {
        if (material.color) {
          material.color = new THREE.Color(modelSettings.color);
        }
        if (material.roughness !== undefined) {
          material.roughness = modelSettings.roughness;
        }
        if (material.metalness !== undefined) {
          material.metalness = modelSettings.metalness;
        }
        if (material.clearcoat !== undefined) {
          material.clearcoat = modelSettings.clearcoat;
        }
        if (material.transmission !== undefined) {
          material.transmission = modelSettings.transmission;
        }
        if (material.envMapIntensity !== undefined) {
          material.envMapIntensity = modelSettings.envIntensity;
        }
      }
    }
  });

  setupLights();
}

// --- File handling ---
function handleFile(file: File) {
  const validExts = [".glb", ".gltf", ".svg"];
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

  if (!validExts.includes(ext)) {
    showError(
      `Invalid file type: ${ext}. Please select a .glb, .gltf, or .svg file.`,
    );
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maximum size is 50MB.`,
    );
    return;
  }

  currentFile = file;

  // Add file validation for SVG
  if (ext === ".svg") {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // Basic SVG validation
      if (!content.includes("<svg") || !content.includes("</svg>")) {
        showError("Invalid SVG file: Missing required SVG tags.");
        return;
      }
      loadModel(file);
    };
    reader.onerror = () => {
      showError("Failed to read SVG file.");
    };
    reader.readAsText(file);
  } else {
    loadModel(file);
  }
}

function loadModel(file: File) {
  const loading = document.getElementById("loading") as HTMLElement;
  loading.classList.add("visible");

  // Clear current model
  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
    currentModelType = null;
    initialCameraState = null;
  }

  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

  if (ext === ".svg") {
    // Handle SVG files - show all tabs
    currentModelType = "svg";
    showAllTabs();
    showLoadingProgress("Reading SVG file...", 10);
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const svgContent = e.target?.result as string;
        console.log("Creating SVG model from content...");
        currentModel = (await createSVGModel(svgContent)) as THREE.Group;
        if (currentModel) {
          scene.add(currentModel);
          console.log("SVG model added to scene");
          // Focus camera on the new model
          focusOnModel();
        }
        showViewer();
        loading.classList.remove("visible");
        hideLoadingProgress();
      } catch (error) {
        console.error("Error loading SVG:", error);
        let errorMessage = "Failed to load SVG file. ";
        if (error instanceof Error) {
          if (error.message.includes("parse error")) {
            errorMessage += "The SVG contains invalid syntax.";
          } else if (error.message.includes("No valid shapes")) {
            errorMessage += "The SVG doesn't contain any drawable shapes.";
          } else {
            errorMessage += "Please check the file format.";
          }
        } else {
          errorMessage += "Please check the file format.";
        }
        showError(errorMessage);
        loading.classList.remove("visible");
        hideLoadingProgress();
      }
    };
    reader.readAsText(file);
  } else {
    // Handle GLTF/GLB files - hide geometry tab
    currentModelType = "gltf";
    hideGeometryTab();
    loadGLTFModel(file)
      .then((model) => {
        currentModel = model as THREE.Group;
        if (currentModel) {
          scene.add(currentModel);
          console.log(
            "GLTF model added to scene, currentModelType:",
            currentModelType,
          );
          // Focus camera on the new model
          focusOnModel();
        }
        showViewer();
        loading.classList.remove("visible");
      })
      .catch((error) => {
        console.error("Error loading GLTF:", error);
        showError("Failed to load 3D model. Please check the file format.");
        loading.classList.remove("visible");
      });
  }
}

function showViewer() {
  document.getElementById("filePicker")?.classList.add("hidden");
  document.getElementById("viewerContainer")?.classList.add("visible");
  document.getElementById("actionButtons")?.classList.add("visible");

  // Trigger resize to ensure proper canvas sizing
  setTimeout(() => {
    onWindowResize();
  }, 100);
}

function showAllTabs() {
  const geometryTab = document.getElementById("geometry-tab") as HTMLElement;
  if (geometryTab) geometryTab.style.display = "block";
  // Switch to geometry tab for SVG files
  document
    .querySelectorAll(".tab-button")
    .forEach((b) => b.classList.remove("active"));
  if (geometryTab) geometryTab.classList.add("active");
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("geometry-panel")?.classList.add("active");
}

function hideGeometryTab() {
  const geometryTab = document.getElementById("geometry-tab") as HTMLElement;
  if (geometryTab) geometryTab.style.display = "none";
  // Switch to material tab for 3D models
  document
    .querySelectorAll(".tab-button")
    .forEach((b) => b.classList.remove("active"));
  document.querySelector('[data-tab="material"]')?.classList.add("active");
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("material-panel")?.classList.add("active");
}

function hideViewer() {
  document.getElementById("filePicker")?.classList.remove("hidden");
  document.getElementById("viewerContainer")?.classList.remove("visible");
  document.getElementById("actionButtons")?.classList.remove("visible");

  // Reset tabs to show all
  showAllTabs();
}

function showError(message: string) {
  const errorEl = document.getElementById("error") as HTMLElement;
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
    setTimeout(() => {
      errorEl.style.display = "none";
    }, 5000);
  }
}

// Export to SVG using THREE.js SVGRenderer
function exportToSVG() {
  if (!currentModel) {
    showError("Please load a model first.");
    return;
  }

  showLoadingProgress("Exporting to SVG...", 0);

  setTimeout(async () => {
    try {
      const container = document.getElementById("viewerContainer");
      if (!container) {
        showError("Could not find viewer container.");
        hideLoadingProgress();
        return;
      }
      const width = container.clientWidth;
      const height = container.clientHeight;

      showLoadingProgress("Setting up SVG renderer...", 20);

      // Create SVGRenderer
      const svgRenderer = new SVGRenderer();

      svgRenderer.setSize(width, height);
      svgRenderer.setPrecision(1);
      svgRenderer.setQuality("low");
      svgRenderer.overdraw = 1.0;

      // Add xmlns attribute
      svgRenderer.domElement.setAttribute(
        "xmlns",
        "http://www.w3.org/2000/svg",
      );

      showLoadingProgress("Creating SVG scene...", 40);

      // Render to SVG
      svgRenderer.render(scene, camera);

      showLoadingProgress("Optimizing SVG paths...", 85);

      // Get SVG content and optimize
      let svgContent = svgRenderer.domElement.outerHTML;

      // Clean up and optimize SVG
      svgContent = svgContent.replace(/style="[^"]*"/g, (match) => {
        // Simplify style attributes
        return match
          .replace(/fill:\s*none;?/g, "fill:none")
          .replace(/stroke-linecap:\s*round;?/g, "stroke-linecap:round");
      });

      showLoadingProgress("", 100);

      parent.postMessage(
        {
          pluginMessage: {
            type: "create-svg",
            svgContent: svgContent,
            width: width,
            height: height,
          },
        },
        "*",
      );

      console.log(
        "SVG exported successfully with SVGRenderer and vertex reduction",
      );

      // Show "Complete!" for a moment before hiding
      setTimeout(() => {
        hideLoadingProgress();
      }, 800);
    } catch (error) {
      console.error("Error exporting to SVG:", error);
      showError("Failed to export to SVG. Please try again.");
      hideLoadingProgress();
    }
  }, 50);
}

// PNG export: snapshot with lighting and all settings exactly as in viewer
function exportToPNG() {
  if (!currentModel) {
    showError("Please load a model first.");
    return;
  }

  showLoadingProgress("Exporting to PNG...", 0);

  setTimeout(() => {
    try {
      const container = document.getElementById("viewerContainer");
      if (!container) {
        showError("Could not find viewer container.");
        hideLoadingProgress();
        return;
      }
      const width = container.clientWidth;
      const height = container.clientHeight;

      showLoadingProgress("Setting up PNG renderer...", 20);

      // Create canvas for PNG export with higher resolution
      const scale = 2; // 2x resolution for better quality
      const webglCanvas = document.createElement("canvas");
      webglCanvas.width = width * scale;
      webglCanvas.height = height * scale;

      // Create temporary renderer with transparent background and high quality
      const tempRenderer = new THREE.WebGLRenderer({
        canvas: webglCanvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        precision: "highp",
        powerPreference: "high-performance",
        premultipliedAlpha: true,
      });
      tempRenderer.setSize(width * scale, height * scale);
      tempRenderer.setPixelRatio(1); // Don't double-apply device pixel ratio

      // Set background color as in viewer
      if (scene.background === null) {
        tempRenderer.setClearColor(0x000000, 0); // Transparent
      } else if (scene.background instanceof THREE.Color) {
        tempRenderer.setClearColor(scene.background, 1);
      } else {
        tempRenderer.setClearColor(0x000000, 0);
      }

      showLoadingProgress("Preparing scene...", 40);

      // Clone the current scene
      // Instead of deep clone, render the actual scene and camera for exact match
      // Save current renderer/canvas size and pixel ratio
      const oldSize = renderer.getSize(new THREE.Vector2());
      const oldPixelRatio = renderer.getPixelRatio();

      // Temporarily set renderer size and pixel ratio
      renderer.setSize(width * scale, height * scale, false);
      renderer.setPixelRatio(1);

      // Render to the export canvas using the real scene/camera
      tempRenderer.render(scene, camera);

      // Restore renderer size and pixel ratio
      renderer.setSize(oldSize.x, oldSize.y, false);
      renderer.setPixelRatio(oldPixelRatio);

      showLoadingProgress("Finalizing...", 80);

      // Copy WebGL canvas to a 2D canvas for PNG export
      const canvas2d = document.createElement("canvas");
      canvas2d.width = width * scale;
      canvas2d.height = height * scale;
      const ctx = canvas2d.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(webglCanvas, 0, 0);

      // Convert 2D canvas to PNG blob and then to array buffer
      canvas2d.toBlob((blob) => {
        if (!blob) {
          showError("Failed to create PNG blob.");
          hideLoadingProgress();
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);

          showLoadingProgress("", 100);

          // Send binary data to plugin
          parent.postMessage(
            {
              pluginMessage: {
                type: "create-png",
                pngData: Array.from(uint8Array),
                width: width,
                height: height,
              },
            },
            "*",
          );

          console.log("PNG exported successfully");

          // Show "Complete!" for a moment before hiding
          setTimeout(() => {
            hideLoadingProgress();
          }, 800);
        };
        reader.onerror = () => {
          showError("Failed to read PNG data.");
          hideLoadingProgress();
        };
        reader.readAsArrayBuffer(blob);
      }, "image/png");
    } catch (error) {
      console.error("Error exporting to PNG:", error);
      showError("Failed to export to PNG. Please try again.");
      hideLoadingProgress();
    }
  }, 50);
}

// Loading progress functions
function showLoadingProgress(message: string, percent: number) {
  const progressBarContainer = document.getElementById("progressBarContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  if (progressBarContainer && progressBar && progressText) {
    progressBarContainer.classList.add("visible");
    progressBar.style.width = `${percent}%`;
    if (message) {
      progressText.textContent = message;
      progressText.classList.add("visible");
    } else {
      progressText.classList.remove("visible");
    }
  }
}

function hideLoadingProgress() {
  const progressBarContainer = document.getElementById("progressBarContainer");
  if (progressBarContainer) {
    progressBarContainer.classList.remove("visible");
  }
}

// --- Event handlers ---
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Three.js
  initThreeJS();

  // Get DOM elements
  const fileInput = document.getElementById("fileInput") as HTMLInputElement;
  const selectButton = document.getElementById(
    "selectFileButton",
  ) as HTMLButtonElement;
  const filePicker = document.getElementById("filePicker") as HTMLElement;
  const loadNewButton = document.getElementById(
    "loadNewButton",
  ) as HTMLButtonElement;
  const resetButton = document.getElementById(
    "resetButton",
  ) as HTMLButtonElement;
  const exportButton = document.getElementById(
    "exportButton",
  ) as HTMLButtonElement;

  // File selection
  if (selectButton && fileInput) {
    selectButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target?.files && target.files.length > 0) {
        handleFile(target.files[0]);
      }
    });
  }

  // Drag and drop
  if (filePicker) {
    filePicker.addEventListener("dragenter", (e) => {
      e.preventDefault();
      filePicker.classList.add("drag-over");
    });

    filePicker.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    });

    filePicker.addEventListener("dragleave", (e) => {
      e.preventDefault();
      if (!filePicker.contains(e.relatedTarget as Node)) {
        filePicker.classList.remove("drag-over");
      }
    });

    filePicker.addEventListener("drop", (e) => {
      e.preventDefault();
      filePicker.classList.remove("drag-over");
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Prevent default drag behaviors
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => e.preventDefault());

  // Tab switching
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");

      // Only allow tab switching if tab is visible
      if ((button as HTMLElement).style.display === "none") {
        return;
      }

      // Update active tab button
      document
        .querySelectorAll(".tab-button")
        .forEach((b) => b.classList.remove("active"));
      button.classList.add("active");

      // Update active tab panel
      document
        .querySelectorAll(".tab-panel")
        .forEach((p) => p.classList.remove("active"));
      document.getElementById(`${tabName}-panel`)?.classList.add("active");
    });
  });

  // Control event handlers
  // Add keyboard and interaction handlers (model-viewer style)
  function setupKeyboardControls() {
    document.addEventListener("keydown", (event) => {
      if (!currentModel) return;

      switch (event.key.toLowerCase()) {
        case "r":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetCamera();
          }
          break;
        case "a":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            toggleAutoRotate();
          }
          break;
        case "f":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            focusOnModel();
          }
          break;
        case " ":
          event.preventDefault();
          toggleAutoRotate();
          break;
      }
    });

    // Add double-click to reset camera
    if (renderer && renderer.domElement) {
      renderer.domElement.addEventListener("dblclick", () => {
        resetCamera();
      });
    }
  }

  function setupControlHandlers() {
    // Geometry controls
    const depthSlider = document.getElementById(
      "depthSlider",
    ) as HTMLInputElement;
    const depthValue = document.getElementById("depthValue") as HTMLElement;
    if (depthSlider && depthValue) {
      depthSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        modelSettings.depth = parseFloat(target.value);
        depthValue.textContent = target.value;
        if (currentFile && currentFile.name.endsWith(".svg")) {
          loadModel(currentFile); // Reload SVG with new settings
        }
      });
    }

    const bevelSizeSlider = document.getElementById(
      "bevelSizeSlider",
    ) as HTMLInputElement;
    const bevelSizeValue = document.getElementById(
      "bevelSizeValue",
    ) as HTMLElement;
    if (bevelSizeSlider && bevelSizeValue) {
      bevelSizeSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        modelSettings.bevelSize = parseFloat(target.value);
        bevelSizeValue.textContent = target.value;
        if (currentFile && currentFile.name.endsWith(".svg")) {
          loadModel(currentFile);
        }
      });
    }

    const bevelThicknessSlider = document.getElementById(
      "bevelThicknessSlider",
    ) as HTMLInputElement;
    const bevelThicknessValue = document.getElementById(
      "bevelThicknessValue",
    ) as HTMLElement;
    if (bevelThicknessSlider && bevelThicknessValue) {
      bevelThicknessSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        modelSettings.bevelThickness = parseFloat(target.value);
        bevelThicknessValue.textContent = target.value;
        if (currentFile && currentFile.name.endsWith(".svg")) {
          loadModel(currentFile);
        }
      });
    }

    const bevelSegmentsSlider = document.getElementById(
      "bevelSegmentsSlider",
    ) as HTMLInputElement;
    const bevelSegmentsValue = document.getElementById(
      "bevelSegmentsValue",
    ) as HTMLElement;
    if (bevelSegmentsSlider && bevelSegmentsValue) {
      bevelSegmentsSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        modelSettings.bevelSegments = parseInt(target.value);
        bevelSegmentsValue.textContent = target.value;
        if (currentFile && currentFile.name.endsWith(".svg")) {
          loadModel(currentFile);
        }
      });
    }

    // Material controls
    const colorPicker = document.getElementById(
      "colorPicker",
    ) as HTMLInputElement;
    if (colorPicker) {
      colorPicker.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        modelSettings.color = target.value;
        updateModel();
      });
    }

    const roughnessSlider = document.getElementById(
      "roughnessSlider",
    ) as HTMLInputElement;
    const roughnessValue = document.getElementById(
      "roughnessValue",
    ) as HTMLElement;
    if (roughnessSlider && roughnessValue) {
      roughnessSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        modelSettings.roughness = parseFloat(target.value);
        roughnessValue.textContent = target.value;
        updateModel();
      });
    }

    const metalnessSlider = document.getElementById(
      "metalnessSlider",
    ) as HTMLInputElement;
    const metalnessValue = document.getElementById(
      "metalnessValue",
    ) as HTMLElement;
    if (metalnessSlider && metalnessValue) {
      metalnessSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        modelSettings.metalness = parseFloat(target.value);
        metalnessValue.textContent = target.value;
        updateModel();
      });
    }

    const clearcoatSlider = document.getElementById(
      "clearcoatSlider",
    ) as HTMLInputElement;
    const clearcoatValue = document.getElementById(
      "clearcoatValue",
    ) as HTMLElement;
    if (clearcoatSlider && clearcoatValue) {
      clearcoatSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        modelSettings.clearcoat = parseFloat(target.value);
        clearcoatValue.textContent = target.value;
        updateModel();
      });
    }

    const transmissionSlider = document.getElementById(
      "transmissionSlider",
    ) as HTMLInputElement;
    const transmissionValue = document.getElementById(
      "transmissionValue",
    ) as HTMLElement;
    if (transmissionSlider && transmissionValue) {
      transmissionSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        modelSettings.transmission = parseFloat(target.value);
        transmissionValue.textContent = target.value;
        updateModel();
      });
    }

    // Environment controls
    const envIntensitySlider = document.getElementById("envIntensitySlider");
    const envIntensityValue = document.getElementById("envIntensityValue");
    envIntensitySlider?.addEventListener("input", (e) => {
      modelSettings.envIntensity = parseFloat(
        (e.target as HTMLInputElement).value,
      );
      if (envIntensityValue)
        envIntensityValue.textContent = (e.target as HTMLInputElement).value;
      updateModel();
    });

    const ambientLightSlider = document.getElementById("ambientLightSlider");
    const ambientLightValue = document.getElementById("ambientLightValue");
    ambientLightSlider?.addEventListener("input", (e) => {
      modelSettings.ambientLight = parseFloat(
        (e.target as HTMLInputElement).value,
      );
      if (ambientLightValue)
        ambientLightValue.textContent = (e.target as HTMLInputElement).value;
      setupLights();
    });

    const directionalLightSlider = document.getElementById(
      "directionalLightSlider",
    );
    const directionalLightValue = document.getElementById(
      "directionalLightValue",
    );
    directionalLightSlider?.addEventListener("input", (e) => {
      modelSettings.directionalLight = parseFloat(
        (e.target as HTMLInputElement).value,
      );
      if (directionalLightValue)
        directionalLightValue.textContent = (
          e.target as HTMLInputElement
        ).value;
      setupLights();
    });

    // Background controls
    const transparentBgCheckbox = document.getElementById(
      "transparentBgCheckbox",
    );
    const backgroundColorPicker = document.getElementById(
      "backgroundColorPicker",
    );
    const backgroundColorGroup = document.getElementById(
      "backgroundColorGroup",
    );

    transparentBgCheckbox?.addEventListener("change", (e) => {
      const isTransparent = (e.target as HTMLInputElement).checked;
      modelSettings.backgroundColor = isTransparent
        ? "transparent"
        : (backgroundColorPicker as HTMLInputElement).value;

      if (isTransparent) {
        scene.background = null;
        if (backgroundColorGroup) backgroundColorGroup.style.display = "none";
      } else {
        scene.background = new THREE.Color(
          (backgroundColorPicker as HTMLInputElement).value,
        );
        if (backgroundColorGroup) backgroundColorGroup.style.display = "block";
      }
    });

    backgroundColorPicker?.addEventListener("input", (e) => {
      if (!(transparentBgCheckbox as HTMLInputElement).checked) {
        modelSettings.backgroundColor = (e.target as HTMLInputElement).value;
        scene.background = new THREE.Color(
          (e.target as HTMLInputElement).value,
        );
      }
    });
  }

  setupControlHandlers();
  setupKeyboardControls();

  // Action buttons
  if (loadNewButton) {
    loadNewButton.addEventListener("click", () => {
      if (currentModel) {
        scene.remove(currentModel);
        currentModel = null;
      }
      currentFile = null;
      hideViewer();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      resetCamera();
    });
  }

  if (exportButton) {
    exportButton.addEventListener("click", exportToSVG);
  }

  // PNG Export button
  const exportPngButton = document.getElementById(
    "exportPngButton",
  ) as HTMLButtonElement;
  if (exportPngButton) {
    exportPngButton.addEventListener("click", exportToPNG);
  }

  console.log("✅ 3D to SVG converter initialized");
});
