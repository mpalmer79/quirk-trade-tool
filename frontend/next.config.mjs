/** @type {import('next').NextConfig} */

const isPages = process.env.GITHUB_PAGES === 'true';
const repo = 'quirk-trade-tool';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  ...(isPages && {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
    basePath: `/${repo}`,
    assetPrefix: `/${repo}/`,
  }),
};

export default nextConfig;
