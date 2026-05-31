import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Construct path to the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, "..", ".env");

// Load the root .env file ONLY if it exists (for local development)
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CAPTURE_WS_HOST: process.env.NEXT_PUBLIC_CAPTURE_WS_HOST,
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
