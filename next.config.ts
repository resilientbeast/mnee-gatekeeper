import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile packages that have ESM issues
  transpilePackages: [
    "@reown/appkit",
    "@reown/appkit-adapter-wagmi",
    "@solana/kit",
    "@solana-program/system",
    "@solana-program/token",
    "@coinbase/cdp-sdk",
    "@base-org/account",
    "@wagmi/connectors",
  ],

  // Webpack configuration for missing dependencies
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js core modules not available in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
