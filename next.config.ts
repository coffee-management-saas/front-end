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
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
    domains: [
      "i.pinimg.com",
      "s3-hcmc02.higiocloud.vn",
      "images.unsplash.com",
      "res.cloudinary.com",
    ],
  },

  output: "standalone",
};

export default nextConfig;
