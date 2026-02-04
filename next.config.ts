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
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    domains: [
      "i.pinimg.com",
      "s3-hcmc02.higiocloud.vn",
      "images.unsplash.com",
      "res.cloudinary.com",
    ],
  },
};

export default nextConfig;
