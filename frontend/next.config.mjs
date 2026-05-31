/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, 
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  trailingSlash: false,
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CAPTURE_WS_HOST: process.env.NEXT_PUBLIC_CAPTURE_WS_HOST,
  },
};

export default nextConfig;
