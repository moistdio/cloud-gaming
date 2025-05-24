/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:7200'
  }
}

// Update port configuration
if (process.env.NODE_ENV === 'production') {
  nextConfig.server = {
    port: 7100,
    host: '0.0.0.0'
  }
}

module.exports = nextConfig 