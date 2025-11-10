/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep builds resilient, lint runs separately
  eslint: { ignoreDuringBuilds: true },

  // ✅ REMOVED: output: 'export' - Not needed for Netlify!
  // Netlify has native Next.js support via @netlify/plugin-nextjs

  images: {
    // Netlify Image CDN handles optimization automatically
    formats: ['image/avif', 'image/webp'],
  },

  // Better development experience
  reactStrictMode: true,

  // Optional: If you need trailing slashes for your routes
  // trailingSlash: true,
};

export default nextConfig;
