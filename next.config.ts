import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production and serverless
  compress: true,
  poweredByHeader: false,
  
  // Optimize builds and reduce memory usage
  experimental: {
    // Reduce memory usage during builds
    workerThreads: false,
    cpus: 1,
  },
  
  // Optimize webpack for production
  webpack: (config, { isServer }) => {
    // Reduce bundle size and memory usage
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Optimize source maps for production
    if (process.env.NODE_ENV === 'production') {
      config.devtool = false;
    }
    
    return config;
  },
  
  // CORS configuration for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://remarcablejobs.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media-exp1.licdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.greenhouse.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.lever.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ashbyhq.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.workable.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
