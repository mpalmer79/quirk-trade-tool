const isPages = process.env.GITHUB_PAGES === 'true';
const repo = 'quirk-trade-tool';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isPages ? `/${repo}` : undefined,
  assetPrefix: isPages ? `/${repo}/` : undefined
};

export default nextConfig;
