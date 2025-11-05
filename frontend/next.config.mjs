/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't fail `next build` on ESLint/Prettier nits (you still have a separate lint job)
  eslint: { ignoreDuringBuilds: true },

  // Existing settings for GitHub Pages/static export
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/quirk-trade-tool' : '',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
