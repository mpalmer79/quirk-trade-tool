import type { NextConfig } from 'next';

const isPages = process.env.GITHUB_PAGES === 'true';
const repo = 'quirk-trade-tool'; // your repo name

const nextConfig: NextConfig = {
  // Export a static site (works on GitHub Pages)
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // If deploying under https://<user>.github.io/<repo>, set basePath/assetPrefix
  basePath: isPages ? `/${repo}` : undefined,
  assetPrefix: isPages ? `/${repo}/` : undefined,
  experimental: { typedRoutes: true }
};

export default nextConfig;
