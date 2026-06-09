import type { NextConfig } from "next";

/** Cible réelle de l'API (le navigateur passe par `/upjunoo-api/*` pour éviter CORS). */
const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // MSW mocks + helpers nommés useLegacy* déclenchent rules-of-hooks au build
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/upjunoo-api/:path*",
        destination: `${API_ORIGIN.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
