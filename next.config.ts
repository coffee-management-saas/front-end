import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Categories are handled by NEXT.JS - do NOT proxy these
      // /api/categories → src/app/api/categories/route.ts
      // /api/categories/:id → src/app/api/categories/[id]/route.ts

      // Products are handled by NEXT.JS (forward Authorization from cookies)
      // /api/products → src/app/api/products/route.ts
      // /api/products/:id → src/app/api/products/[id]/route.ts
      // Do NOT proxy /api/products - rewrite would not forward Authorization header

      // Proxy ONLY specific backend routes (not categories, not products)
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:8080/api/auth/:path*",
      },
      {
        source: "/api/profile/:path*",
        destination: "http://localhost:8080/api/profile/:path*",
      },
      {
        source: "/api/orders/:path*",
        destination: "http://localhost:8080/api/orders/:path*",
      },
      // Recipes are handled by NEXT.JS (forward Authorization from cookies)
      // /api/recipes → src/app/api/recipes/route.ts
      // /api/recipes/variant/:variantId → src/app/api/recipes/variant/[variantId]/route.ts
      // Variants are handled by NEXT.JS (forward Authorization from cookies)
      // /api/variants → src/app/api/variants/route.ts
      // /api/variants/:id → src/app/api/variants/[id]/route.ts
      // Sizes are handled by NEXT.JS (forward Authorization from cookies)
      // /api/sizes → src/app/api/sizes/route.ts
      // /api/sizes/:id → src/app/api/sizes/[id]/route.ts
      {
        source: "/api/stock/:path*",
        destination: "http://localhost:8080/api/stock/:path*",
      },
      // Employees are handled by NEXT.JS (forward Authorization from cookies)
      // /api/employees → src/app/api/employees/route.ts
      // Do NOT proxy /api/employees - rewrite would not forward Authorization header/cookies correctly
      // Invoices are handled by NEXT.JS (forward Authorization from cookies)
      // /api/invoices → src/app/api/invoices/route.ts
      // /api/invoices/:id → src/app/api/invoices/[id]/route.ts
      // Ingredients are handled by NEXT.JS (forward Authorization from cookies)
      // /api/ingredients → src/app/api/ingredients/route.ts
      // /api/ingredients/:id → src/app/api/ingredients/[id]/route.ts
      // Promotions are handled by NEXT.JS - do NOT proxy
      // /api/promotion → src/app/api/promotion/route.ts
      // /api/promotion/:id → src/app/api/promotion/[id]/route.ts
      {
        source: "/api/ai/:path*",
        destination: "http://localhost:8080/api/ai/:path*",
      },
      {
        source: "/api/momo/:path*",
        destination: "http://localhost:8080/api/momo/:path*",
      },
      {
        source: "/api/subscriptions/:path*",
        destination: "http://localhost:8080/api/subscriptions/:path*",
      },
    ];
  },
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
