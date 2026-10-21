import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

// Fill the whole screen in the iPhone Home Screen app; the admin shell pads for the notch and
// home bar with env(safe-area-inset-*).
export const viewport: Viewport = { viewportFit: "cover" };

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | AllDrive Admin" },
  // Private area: keep it out of search results.
  robots: { index: false, follow: false },
  // Its own installable app ("Add to Home Screen" from here opens the dashboard), which iPhones
  // need for push notifications. Overrides the public site's manifest on /admin pages only.
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "AllDrive Admin", statusBarStyle: "default" },
};

// The root layout renders the public site's header and footer on every page. This rule hides
// them while an admin page is shown, without touching the public pages.
const hidePublicChrome = "body:has([data-admin-app]) > header, body:has([data-admin-app]) > footer { display: none !important; }";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div data-admin-app className="min-h-svh bg-muted/40">
      <style>{hidePublicChrome}</style>
      {children}
    </div>
  );
}
