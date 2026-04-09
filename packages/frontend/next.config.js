/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },   // MinIO dev
      { protocol: 'https', hostname: '*.cloudfront.net' },          // CDN prod
    ],
  },
};

module.exports = nextConfig;
