import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    viewTransition: true,
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  images: {
    domains: ["cdn.databuddy.cc", "localhost"],
  },
  output: "standalone",
};

export default nextConfig;
