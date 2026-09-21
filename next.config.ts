import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // three and its ecosystem ship untranspiled ESM in places; this keeps the
  // Next build from choking on it.
  transpilePackages: ["three"],
  // The dev badge sits over the page's bottom-left copy and ends up in
  // screenshots. Production builds never show it either way.
  devIndicators: false,
};

export default nextConfig;
