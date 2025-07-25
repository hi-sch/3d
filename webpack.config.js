const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const fs = require('fs');

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const isDevelopment = argv.mode === "development";

  return {
    mode: argv.mode || "development",
    // Figma's 'eval' works differently than normal eval
    devtool: isProduction ? "source-map" : "inline-source-map",

    entry: {
      plugin: "./src/plugin.ts",
      ui: "./src/ui.ts",
    },

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      sourceMapFilename: "[name].js.map",
      clean: true,
      // Ensure proper path for Figma's sandboxed environment
      publicPath: "./",
      // Figma plugin compatibility
      environment: {
        arrowFunction: false,
        bigIntLiteral: false,
        const: false,
        destructuring: false,
        dynamicImport: false,
        forOf: false,
        module: false,
      },
      // Use IIFE to ensure script isolation
      library: {
        type: "var",
        name: "[name]"
      },
    },

    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      fallback: {
        process: false,
        http: false,
        https: false,
        buffer: require.resolve("buffer/"),
        path: false,
        fs: false,
        crypto: false,
        stream: false,
        util: false,
      },
    },

    module: {
      rules: [
        // TypeScript compilation
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
                compilerOptions: {
                  target: "es2018",
                  module: "es2015",
                },
              },
            },
          ],
          exclude: /node_modules/,
        },
        // JavaScript compilation - aggressive optimization like tokens-studio
        {
          test: /\.c?js$/,
          // Don't exclude node_modules in production for aggressive optimization
          exclude: isProduction ? undefined : /node_modules\/(?!(three)\/)/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      targets: {
                        browsers: ["last 2 versions"],
                      },
                      modules: false,
                    },
                  ],
                ],
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        // Handle web fonts like tokens-studio
        {
          test: /\.(woff|woff2)$/,
          type: "asset/inline",
          generator: {
            dataUrl: {
              mimetype: "font/woff2",
            },
          },
        },
        {
          test: /\.(png|jpe?g|gif|webp)$/i,
          type: "asset/inline",
        },
        {
          test: /\.svg$/,
          type: "asset/inline",
        },
      ],
    },

    plugins: [
      // Provide global process polyfill like tokens-studio
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),

      new HtmlWebpackPlugin({
        template: "./src/ui.html",
        filename: "ui.html",
        chunks: ["ui"],
        // Auto-inject scripts
        inject: true,
        cache: isProduction,
        minify: isProduction
          ? {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            }
          : false,
      }),

      // Inline all chunks with "ui" name
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),

      // Define environment variables
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(argv.mode || "development"),
      }),

      // Custom plugin to create ui.html with inlined JavaScript
      // This is an alternative approach if InlineChunkHtmlPlugin doesn't work
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('InlineUIScript', (compilation) => {
            try {
              // Read the generated files
              const uiJsPath = path.resolve(__dirname, 'dist/ui.js');
              const uiHtmlPath = path.resolve(__dirname, 'dist/ui.html');

              if (fs.existsSync(uiJsPath) && fs.existsSync(uiHtmlPath)) {
                const jsContent = fs.readFileSync(uiJsPath, 'utf8');
                let htmlContent = fs.readFileSync(uiHtmlPath, 'utf8');

                // Replace the script tag with an inline script
                htmlContent = htmlContent.replace(
                  /<script.*?src=".*?ui\.js".*?><\/script>/,
                  `<script>${jsContent}</script>`
                );

                // Write the modified HTML back
                fs.writeFileSync(uiHtmlPath, htmlContent);

                // Optionally delete the ui.js file since it's now inlined
                fs.unlinkSync(uiJsPath);
              }
            } catch (error) {
              console.error('Error inlining UI script:', error);
            }
          });
        }
      }
    ],

    optimization: {
      nodeEnv: isProduction ? "production" : "development",
      minimize: isProduction,
      usedExports: true,
      concatenateModules: true,
      splitChunks: false, // Don't split chunks for Figma plugins
      runtimeChunk: false,
      sideEffects: false,
    },

    performance: {
      hints: isProduction ? "warning" : false,
      maxEntrypointSize: 2 * 1024 * 1024, // 2MB for Three.js
      maxAssetSize: 2 * 1024 * 1024,
    },

    cache: {
      type: "filesystem",
      buildDependencies: {
        config: [__filename],
      },
    },

    // Figma plugin specific settings
    node: {
      global: false,
      __filename: false,
      __dirname: false,
    },
  };
};
