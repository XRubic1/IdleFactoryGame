/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true
  },
  basePath: '/IdleFactoryGame',
  assetPrefix: '/IdleFactoryGame/',
}

module.exports = nextConfig 