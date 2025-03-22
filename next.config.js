/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
    domains: [],
  },
  transpilePackages: ['@hello-pangea/dnd'],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: 'asset/resource',
    });
    config.externals = [...config.externals, 'canvas', 'jsdom'];
    return config;
  },
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig 