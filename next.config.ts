import type { NextConfig } from "next";

// The admin dashboard (/admin) calls the AllDrive backend through this site's own /api, so the
// backend's httpOnly login cookie is first-party. Only the routes the dashboard uses are
// forwarded, and only when ALLDRIVE_API_URL is set.
const API_URL = (process.env.ALLDRIVE_API_URL || "").replace(/\/+$/, "");
const ADMIN_API_ROUTES = ["auth", "bookings", "inquiries", "vehicles", "push", "catalog", "dashboard", "notifications", "users", "uploads"];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  rewrites: async () =>
    API_URL
      ? [
          ...ADMIN_API_ROUTES.map((route) => ({
            source: `/api/${route}/:path*`,
            destination: `${API_URL}/api/${route}/:path*`,
          })),
          // Car photos added in the dashboard when the backend stores them on its own disk.
          { source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` },
        ]
      : [],
  // Browser security headers for every page and file.
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        // Don't let other sites show this site inside a frame (clickjacking).
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
        // Don't guess file types; use the type the server sends.
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      ],
    },
    {
      // Admin push notifications worker: always fetch the latest version.
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      ],
    },
  ],
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
