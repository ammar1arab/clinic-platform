import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  allowedDevOrigins: ["192.168.8.136", "192.168.8.116"],
};

export default nextConfig;
