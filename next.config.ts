import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  /* config options here */
  images: {
    domains: ["randomuser.me", "iwimnudodmiijqhnkrcr.supabase.co"],
  },
};

export default nextConfig;
