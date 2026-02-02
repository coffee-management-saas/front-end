import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    domains: ["i.pinimg.com", "s3-hcmc02.higiocloud.vn", "images.unsplash.com"],
  },
};

export default nextConfig;
