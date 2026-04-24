import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow cache-bust query strings on raster brand assets (omit `search` = any query allowed).
    localPatterns: [{ pathname: "/brand/**" }],
  },
};

export default nextConfig;
