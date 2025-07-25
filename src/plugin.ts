// Main plugin code that runs in Figma's sandbox environment
console.log("🚀 Plugin starting...");

// Show UI immediately
figma.showUI(__html__, {
  width: 800,
  height: 600,
  themeColors: true,
});

console.log("✅ UI shown");

// Handle messages from the UI
figma.ui.onmessage = async (msg: any) => {
  console.log("📨 Received message from UI:", msg.type);

  try {
    switch (msg.type) {
      case "create-svg":
        await createSVGNode(msg.svgContent, msg.width, msg.height);
        break;

      case "create-png":
        await createImageNode(msg.pngData, msg.width, msg.height);
        break;

      case "file-loaded":
        console.log("📁 File loaded in UI:", msg.fileName, msg.fileSize);
        figma.ui.postMessage({
          type: "file-received",
          success: true,
          message: `File ${msg.fileName} received successfully`,
        });
        break;

      case "close":
        figma.closePlugin();
        break;

      case "resize":
        figma.ui.resize(msg.width, msg.height);
        break;

      case "ping":
        // Health check from UI
        figma.ui.postMessage({
          type: "pong",
          success: true,
        });
        break;

      default:
        console.warn("⚠️ Unknown message type:", msg.type);
    }
  } catch (error) {
    console.error("❌ Error handling message:", error);
    figma.ui.postMessage({
      type: "error",
      message: `Plugin error: ${(error as Error).message}`,
    });
  }
};

/**
 * Creates an SVG node on the Figma canvas with the exported 3D model
 */
async function createSVGNode(
  svgContent: string,
  width: number,
  height: number,
): Promise<void> {
  console.log("🎨 Creating SVG node...", {
    width,
    height,
    contentLength: svgContent.length,
  });

  try {
    // Validate SVG content
    if (!svgContent || typeof svgContent !== "string") {
      throw new Error("Invalid SVG content provided");
    }

    if (svgContent.length === 0) {
      throw new Error("Empty SVG content");
    }

    // Clean and validate SVG
    const cleanSvg = cleanSVGContent(svgContent);
    console.log("🧹 SVG cleaned, new length:", cleanSvg.length);

    // Create SVG node from the exported content
    const svgNode = figma.createNodeFromSvg(cleanSvg);
    console.log("📐 SVG node created");

    // Execute the 'flatten' context menu action on the SVG node
    const flattenedSvgNode = figma.flatten([svgNode]);
    console.log("🗜️ SVG node flattened");

    // Position the SVG node at viewport center
    const { x, y } = figma.viewport.center;
    flattenedSvgNode.x = x - width / 2;
    flattenedSvgNode.y = y - height / 2;
    console.log("📍 SVG positioned at:", {
      x: flattenedSvgNode.x,
      y: flattenedSvgNode.y,
    });

    // Add to current page
    figma.currentPage.appendChild(flattenedSvgNode);
    console.log("➕ SVG added to page");

    // Select the new node
    figma.currentPage.selection = [flattenedSvgNode];

    // Zoom to fit the new node
    figma.viewport.scrollAndZoomIntoView([flattenedSvgNode]);
    console.log("🔍 Viewport adjusted");

    // Send success message back to UI
    figma.ui.postMessage({
      type: "svg-created",
      success: true,
      message: "3D model successfully converted to SVG and added to canvas!",
      nodeId: flattenedSvgNode.id,
    });

    console.log("✅ SVG creation completed successfully");
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("❌ Error creating SVG node:", error);

    // Send error message back to UI
    figma.ui.postMessage({
      type: "svg-created",
      success: false,
      message: `Failed to create SVG: ${errorMessage}`,
      error: errorMessage,
    });
  }
}

/**
 * Creates an image node on the Figma canvas with the exported PNG
 */
async function createImageNode(
  pngData: number[],
  width: number,
  height: number,
): Promise<void> {
  console.log("🖼️ Creating PNG image node...", {
    width,
    height,
    dataLength: pngData.length,
  });

  try {
    // Validate PNG data
    if (!pngData || !Array.isArray(pngData)) {
      throw new Error("Invalid PNG data provided");
    }

    if (pngData.length === 0) {
      throw new Error("Empty PNG data");
    }

    // Convert number array to Uint8Array
    const uint8Array = new Uint8Array(pngData);

    console.log("📦 PNG data converted, size:", uint8Array.length);

    // Create image node
    const imageHash = figma.createImage(uint8Array).hash;
    const rectangle = figma.createRectangle();

    // Set image fill
    rectangle.fills = [
      {
        type: "IMAGE",
        imageHash: imageHash,
        scaleMode: "FILL",
      },
    ];

    // Set dimensions
    rectangle.resize(width, height);
    console.log("📐 Image node created and sized");

    // Position the image node at viewport center
    const { x, y } = figma.viewport.center;
    rectangle.x = x - width / 2;
    rectangle.y = y - height / 2;
    console.log("📍 Image positioned at:", { x: rectangle.x, y: rectangle.y });

    // Name the node
    rectangle.name = "3D Model Export";

    // Add to current page
    figma.currentPage.appendChild(rectangle);
    console.log("➕ Image added to page");

    // Select the new node
    figma.currentPage.selection = [rectangle];

    // Zoom to fit the new node
    figma.viewport.scrollAndZoomIntoView([rectangle]);
    console.log("🔍 Viewport adjusted");

    // Send success message back to UI
    figma.ui.postMessage({
      type: "png-created",
      success: true,
      message: "3D model successfully converted to PNG and added to canvas!",
      nodeId: rectangle.id,
    });

    console.log("✅ PNG creation completed successfully");
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("❌ Error creating PNG node:", error);

    // Send error message back to UI
    figma.ui.postMessage({
      type: "png-created",
      success: false,
      message: `Failed to create PNG: ${errorMessage}`,
      error: errorMessage,
    });
  }
}

/**
 * Clean and validate SVG content for Figma compatibility
 */
function cleanSVGContent(svgContent: string): string {
  try {
    // Remove any XML declarations
    let cleaned = svgContent.replace(/<\?xml[^>]*\?>/g, "");

    // Remove any DOCTYPE declarations
    cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/g, "");

    // Trim whitespace
    cleaned = cleaned.trim();

    // Ensure it starts with <svg
    if (!cleaned.startsWith("<svg")) {
      throw new Error("Content does not appear to be valid SVG");
    }

    // Basic validation - ensure it has a closing </svg> tag
    if (!cleaned.includes("</svg>")) {
      throw new Error("SVG content appears to be incomplete");
    }

    // Ensure SVG has proper namespace
    if (!cleaned.includes('xmlns="http://www.w3.org/2000/svg"')) {
      cleaned = cleaned.replace(
        "<svg",
        '<svg xmlns="http://www.w3.org/2000/svg"',
      );
    }

    return cleaned;
  } catch (error) {
    console.error("❌ Error cleaning SVG:", error);
    throw new Error(`SVG validation failed: ${(error as Error).message}`);
  }
}

// Handle plugin initialization
figma.on("run", ({ command }: { command?: string }) => {
  console.log("🎯 Plugin run command:", command || "default");

  try {
    switch (command) {
      case "open":
      default:
        // Send initialization message to UI
        figma.ui.postMessage({
          type: "init",
          theme: figma.editorType,
          version: figma.apiVersion,
          fileKey: figma.fileKey || null,
        });
        console.log("📤 Init message sent to UI");
        break;
    }
  } catch (error) {
    console.error("❌ Error during plugin run:", error);
    figma.ui.postMessage({
      type: "error",
      message: `Plugin initialization error: ${(error as Error).message}`,
    });
  }
});

console.log("🏁 Plugin setup completed");
