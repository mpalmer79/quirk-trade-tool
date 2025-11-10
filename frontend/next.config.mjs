/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep builds resilient, lint runs separately
  eslint: { ignoreDuringBuilds: true },

  // Static export for Netlify (produces frontend/out)
  output: 'export',

  // Netlify should be root — no basePath
  basePath: '',

  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
