import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["giovannis-macbook-pro.tail386103.ts.net"],
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/imggion/html2realpdf/**",
      },
    ],
  },
};

export default nextConfig;
