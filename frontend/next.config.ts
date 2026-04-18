import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendOrigin = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");

    if (!backendOrigin) {
      return [];
    }

    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
