import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: { styledComponents: true },
  compress: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"], dangerouslyAllowSVG: false },
};

export default nextConfig;
