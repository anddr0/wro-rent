import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Telegram loads the mini app over an HTTPS tunnel in development.
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
  ],
  images: {
    // Telegram avatars (users.photo_url).
    remotePatterns: [new URL("https://t.me/i/userpic/**")],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
