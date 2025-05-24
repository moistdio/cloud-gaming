/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:7200'
  },
  experimental: {
    serverComponentsExternalPackages: []
  }
}

module.exports = {
  ...nextConfig,
  // Use environment variables for port configuration
  experimental: {
    ...nextConfig.experimental
  },
  webServer: {
    port: 7100,
    host: '0.0.0.0'
  }
} 