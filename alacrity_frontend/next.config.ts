import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['picsum.photos'], // Add picsum.photos to allowed domains
  },
  /* config options here */
};

export default nextConfig;
