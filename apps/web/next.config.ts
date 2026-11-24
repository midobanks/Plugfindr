import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@plugfindr/adapters', '@plugfindr/domain'],
};

export default config;
