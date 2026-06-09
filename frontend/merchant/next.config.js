const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  turbopack: {
    resolveAlias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  webpack: (config) => {
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../shared/src');
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  },
};
module.exports = nextConfig;
