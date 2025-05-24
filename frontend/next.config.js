/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:7200'
  },
  // Port configuration
  server: {
    port: 7100,
    host: '0.0.0.0'
  }
}

module.exports = nextConfig 