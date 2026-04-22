/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,

  // Transpile Leaflet so it works with Next.js module resolution
  transpilePackages: ['leaflet', 'react-leaflet', 'leaflet.markercluster'],

  images: {
    remotePatterns: [
      // Clerk avatar CDN
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '*.clerk.com',
      },
      // Allow gravatar and common avatar providers
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
      },
    ],
  },

  // Required to run Prisma inside Next.js edge/serverless in some deploy targets
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Allow builds to succeed even with TypeScript errors in the one .ts middleware file
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
