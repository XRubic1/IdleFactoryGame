/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true
  },
  basePath: '/IdleFactoryGame',
  assetPrefix: '/IdleFactoryGame/',
  trailingSlash: true
}

module.exports = nextConfig