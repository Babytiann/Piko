import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.6.184",
    "192.168.*",
    "localhost",
  ],
};

export default nextConfig;
