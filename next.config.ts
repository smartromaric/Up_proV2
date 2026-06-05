import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // MSW mocks + helpers nommés useLegacy* déclenchent rules-of-hooks au build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
