import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack root to this project so stray project files in the OS
  // home directory (e.g. a stray node_modules/package-lock.json) are never
  // picked up during module resolution.
  turbopack: {
    root: process.cwd(),
  },
  // Allow the dev server to serve dev-only assets (fonts, HMR websocket) to
  // this machine's LAN IP so the site works when opened from other devices.
  allowedDevOrigins: ["192.168.1.3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;