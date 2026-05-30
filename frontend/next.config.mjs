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
    // Only expose NEXT_PUBLIC_* values to the browser.
    // CLERK_SECRET_KEY is intentionally NOT listed — Clerk SDK reads it
    // from process.env on the server side automatically.
    // CAPTURE_SHARED_SECRET is moved to a server-side API route (/api/ws-token)
    // so the HMAC secret never reaches the client bundle.
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CAPTURE_WS_HOST: process.env.NEXT_PUBLIC_CAPTURE_WS_HOST,
  },
  webpack: (config) => {
    // Add any necessary webpack configs here
    return config;
  },
};

export default nextConfig;
