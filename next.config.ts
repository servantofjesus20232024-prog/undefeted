import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProduction ? "/undefeted" : "",
  assetPrefix: isProduction ? "/undefeted/" : "",
  trailingSlash: true,
};

export default nextConfig;
