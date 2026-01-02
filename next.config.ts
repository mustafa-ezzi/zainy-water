import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@prisma/client"],
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors during build
  },
};

export default nextConfig;
