import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["arch", "chat.jacobsun.xyz"],
  // Dockerode conditionally loads its SSH transport, which includes the
  // cpu-features native addon. Keep the Node-only dependency graph out of
  // webpack/Turbopack instead of attempting to parse the .node binary.
  serverExternalPackages: ["dockerode", "docker-modem", "ssh2", "cpu-features"],
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
