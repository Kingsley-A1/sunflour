import type { NextConfig } from "next";

function getRemoteImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const publicImageOrigins = [process.env.R2_PUBLIC_BASE_URL].filter(
    (value): value is string => Boolean(value),
  );

  return publicImageOrigins.flatMap((origin) => {
    try {
      const url = new URL(origin);
      const pathname =
        url.pathname === "/"
          ? "/**"
          : `${url.pathname.replace(/\/$/, "")}/**`;

      return [
        {
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
          port: url.port,
          pathname,
        },
      ];
    } catch {
      return [];
    }
  });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: getRemoteImagePatterns(),
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-site",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
