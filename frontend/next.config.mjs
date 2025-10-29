const isPages = process.env.GITHUB_PAGES === 'true';
const repo = 'quirk-trade-tool';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isPages ? `/${repo}` : undefined,
  assetPrefix: isPages ? `/${repo}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? `/${repo}` : ''
  }
};

export default nextConfig;
