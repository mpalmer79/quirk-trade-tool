/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep builds resilient, lint runs separately
  eslint: { ignoreDuringBuilds: true },

  // Static export for Netlify - this fixes the Telemetry error
  output: 'export',

  // No basePath needed for Netlify root domain
  basePath: '',

  // Unoptimized images for static export
  images: { unoptimized: true },

  // Helps with routing on Netlify
  trailingSlash: true,
};

export default nextConfig;
