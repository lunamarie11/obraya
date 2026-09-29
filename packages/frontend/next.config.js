/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imagen mínima para Docker/ECS (ver ADR-015): copia solo lo necesario
  // para `node server.js`, sin necesitar node_modules completo en runtime.
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },   // MinIO dev
      { protocol: 'https', hostname: '*.cloudfront.net' },          // CDN prod
    ],
  },
};

module.exports = nextConfig;
