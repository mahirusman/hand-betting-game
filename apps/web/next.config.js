const path = require('path');

const sharedEntry = path.resolve(__dirname, '../../libs/shared/src/index.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    externalDir: true,
  },
  turbopack: {
    resolveAlias: {
      '@tile-game/shared': '../../libs/shared/src/index.ts',
    },
  },
  webpack: (config) => {
    config.resolve.alias['@tile-game/shared'] = sharedEntry;
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  },
};

module.exports = nextConfig;
