import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cuts the production image ~10x — the Dockerfile copies only
  // .next/standalone + .next/static + public (ImplementationPlan.md §11).
  output: "standalone",
};

export default nextConfig;
