import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/admin",
  assetPrefix: "/admin",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/admin",
        basePath: false,
        permanent: false,
      },
      {
        source: "/login",
        destination: "/admin/login",
        basePath: false,
        permanent: false,
      }
    ];
  },
};

export default nextConfig;
