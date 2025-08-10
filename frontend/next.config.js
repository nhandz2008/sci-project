/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Configure API base URL for production
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  // Configure allowed image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sci-demoo.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/competition_images/**',
      },
      // Allow local images
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
