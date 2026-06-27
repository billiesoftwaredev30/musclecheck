import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://muscle-api.cloudnext.cloud/api/:path*",
      },
    ];
  },
};

export default nextConfig;
