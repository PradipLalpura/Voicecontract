import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Construct path to the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, "..", ".env");

// Load the root .env file explicitly
dotenv.config({ path: rootEnvPath });

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // We explicitly map these so Next.js exposes them to the browser if needed
    // (Next.js automatically exposes keys starting with NEXT_PUBLIC_)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CAPTURE_WS_HOST: process.env.NEXT_PUBLIC_CAPTURE_WS_HOST,
    NEXT_PUBLIC_CAPTURE_SHARED_SECRET: process.env.CAPTURE_SHARED_SECRET,
  },
  webpack: (config) => {
    // Add any necessary webpack configs here
    return config;
  },
};

export default nextConfig;
