/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, 
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Standalone config for Vercel/Localhost. 
  // IMPORTANT: For localhost, create 'frontend/.env.local' manually.
};

export default nextConfig;
