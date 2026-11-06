import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["randomuser.me", "iwimnudodmiijqhnkrcr.supabase.co"],
  },
  async rewrites() {
    return [
      {
        source: "/lumahacks",
        destination: "/forms/lumahacks",
      },
    ];
  },
};

export default nextConfig;
