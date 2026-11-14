import type { NextConfig } from "next";
import { BIKE_PHOTOS_BUCKET } from "./src/lib/bike-photos";

const nextConfig: NextConfig = {
  async rewrites() {
    // Not src/server/env.ts: it is server-only and can't be imported here.
    // Without it (a build with no env, e.g. a Vercel preview) there are no
    // photos, and BikePhoto shows its icon; the rest of the app still builds.
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      return [];
    }

    return [
      {
        // Bike photos from our own domain, see src/lib/bike-photos.ts.
        source: `/${BIKE_PHOTOS_BUCKET}/:path*`,
        destination: `${supabaseUrl}/storage/v1/object/public/${BIKE_PHOTOS_BUCKET}/:path*`,
      },
    ];
  },
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
