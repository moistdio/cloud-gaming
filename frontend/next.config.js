/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:7200',
    PORT: process.env.PORT || '7100'
  }
}

module.exports = nextConfig 