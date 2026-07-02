import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProduction ? "/undefeated" : "",
  assetPrefix: isProduction ? "/undefeated/" : "",
  trailingSlash: true,
};

export default nextConfig;
