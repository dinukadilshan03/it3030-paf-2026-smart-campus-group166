import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendOrigin = (
      process.env.BACKEND_INTERNAL_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
    )?.replace(/\/$/, "");

    if (!backendOrigin) {
      return [];
    }

    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/:path*`,
      },
      {
        source: "/oauth2/:path*",
        destination: `${backendOrigin}/oauth2/:path*`,
      },
      {
        source: "/login/oauth2/:path*",
        destination: `${backendOrigin}/login/oauth2/:path*`,
      },
      {
        source: "/error",
        destination: `${backendOrigin}/error`,
      },
    ];
  },
};

export default nextConfig;
