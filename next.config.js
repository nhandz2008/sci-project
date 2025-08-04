/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Configure API base URL for production
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig 