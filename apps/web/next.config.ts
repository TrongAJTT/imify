import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@imify/core", "@imify/engine", "@imify/features", "@imify/stores", "@imify/ui"]
}

export default nextConfig
