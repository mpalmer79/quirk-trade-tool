/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  
  // Keep static export for Netlify stability
  output: 'export',
  
  // Empty basePath for Netlify root domain
  basePath: '',
  
  images: { unoptimized: true },
  
  // Helps with routing on Netlify
  trailingSlash: true,
};

export default nextConfig;
