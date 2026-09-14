import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // -------------------------------------------------------------------------
  // Image Optimization
  // -------------------------------------------------------------------------
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ynvcktbpbvappvcynpfe.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'goldengaropaba.com.br',
      },
      {
        protocol: 'https',
        hostname: 'www.goldengaropaba.com.br',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Security Headers (Enterprise Grade)
  // -------------------------------------------------------------------------
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },

  // -------------------------------------------------------------------------
  // Redirects: www to non-www (canonical)
  // -------------------------------------------------------------------------
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.goldengaropaba.com.br',
          },
        ],
        destination: 'https://goldengaropaba.com.br/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
