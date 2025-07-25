// Type declarations for Figma plugin environment
declare const figma: PluginAPI;
declare const __html__: string;

// Additional type definitions
interface PluginMessage {
  type: string;
  success?: boolean;
  message?: string;
  theme?: string;
  version?: string;
  fileKey?: string | null;
  nodeId?: string;
  error?: string;
  svgContent?: string;
  width?: number;
  height?: number;
}

// Window message event interface
interface MessageEvent<T = any> {
  data: {
    pluginMessage?: T;
  };
}
