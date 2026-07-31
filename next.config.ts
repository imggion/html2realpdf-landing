import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["giovannis-macbook-pro.tail386103.ts.net"],
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
