import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Strict Mode: OFF in dev (prevents double calls), ON in production
  reactStrictMode: !isDev,

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
      { protocol: 'https', hostname: 'api.directcare.com', pathname: '/**' },
      { protocol: 'https', hostname: 'api.direct-care.co.uk', pathname: '/**' },
      { protocol: 'https', hostname: 'direct-care.co.uk', pathname: '/**' },
      { protocol: 'https', hostname: 'test.astircare.co.uk', pathname: '/**' },
      { protocol: 'https', hostname: 'houszyapi.astircare.co.uk', pathname: '/**' },

      { protocol: 'https', hostname: 'testapi.knowledgemarkg.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.direct-care.co.uk', pathname: '/**' },
      { protocol: 'https', hostname: 'example.com', pathname: '/**' },
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/**' },
    ],
  },

  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  async redirects() {
    return [];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://houszyapi.astircare.co.uk/api/:path*',
      },
      {
        // Proxy banner/product images that come as relative paths from the API
        source: '/images/:path*',
        destination: 'https://houszyapi.astircare.co.uk/images/:path*',
      },
    ];
  },

  async headers() {
    return [
      {
        // Admin pages: never cache
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      {
        // Cache static images for 1 year
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
