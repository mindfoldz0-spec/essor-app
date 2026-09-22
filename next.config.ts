import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.103.114",
    "192.168.103.*",
    "192.168.*.*",
  ],
  compiler: { styledComponents: true },
  compress: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"], dangerouslyAllowSVG: false },
};

export default nextConfig;
