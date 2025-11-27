import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'weviqfepjkdmhurznegf.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
