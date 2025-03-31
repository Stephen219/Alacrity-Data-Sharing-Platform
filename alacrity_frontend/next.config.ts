import type { NextConfig } from "next";
// import { Minio_URL } from "@/config";

const nextConfig: NextConfig = {
  images: {
    domains: ['picsum.photos','10.72.98.50' ],

  },
  reactStrictMode: true,
  /* config options here */
};

export default nextConfig;
