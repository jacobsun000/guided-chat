import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["arch", "chat.jacobsun.xyz"],
  turbopack: {},
  webpack(config, { dev }) {
    if (!dev) {
      return config;
    }

    // The raw CSV archives are about 20 GB; watching them can exhaust memory.
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /(^|[\\/])(\.git|\.next|node_modules|datasets)([\\/]|$)/,
    };

    return config;
  },
};

export default nextConfig;
