import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@imify/core", "@imify/engine", "@imify/features", "@imify/stores", "@imify/ui"],
  webpack: (config) => {
    const webReactKonva = require.resolve("react-konva", { paths: [__dirname] })
    const webReactKonvaCore = require.resolve("react-konva/lib/ReactKonvaCore.js", { paths: [__dirname] })

    config.resolve.alias = {
      ...config.resolve.alias,
      "react-konva$": webReactKonva,
      "react-konva/lib/ReactKonvaCore.js": webReactKonvaCore,
      "react-konva/es/ReactKonvaCore.js": webReactKonvaCore,
    }

    return config
  },
}

export default nextConfig
