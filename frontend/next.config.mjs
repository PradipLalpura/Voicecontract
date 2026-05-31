/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, 
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    // Force mapping of keys to ensure they are available in the client bundle
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CAPTURE_WS_HOST: process.env.NEXT_PUBLIC_CAPTURE_WS_HOST,
    NEXT_PUBLIC_CAPTURE_SHARED_SECRET: process.env.NEXT_PUBLIC_CAPTURE_SHARED_SECRET,
  },
};

export default nextConfig;
