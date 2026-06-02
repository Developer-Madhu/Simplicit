import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // web-tree-sitter's Emscripten glue references Node built-ins (fs, path)
    // behind a Node-only guard. They never run in the browser, but webpack
    // still tries to resolve them when bundling the client. Stub them out.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        "fs/promises": false,
      };
    }
    return config;
  },
};

export default nextConfig;
