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
  experimental: {
    instantInsights: {
      // Dev check "can navigation to this page be instant?" only for pages
      // that ask for it with `export const instant`. By default it checks every
      // page by rendering it on the server, but our pages appear only in the
      // browser, after the user is loaded (CurrentUserProvider), so it
      // reported every page as "dropped". Prefetching is not affected.
      validationLevel: "manual-warning",
    },
  },
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
