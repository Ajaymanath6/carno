import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; img-src 'self' data: blob:; script-src 'none'; frame-src 'none'; sandbox;",
  },
};

export default nextConfig;
