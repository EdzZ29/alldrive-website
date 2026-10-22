import { NextResponse, type NextRequest } from "next/server";

// Maintenance mode: visitors see /maintenance (with a 503 so search engines keep the old pages)
// while the site is being set up. The admin dashboard and its API stay reachable.
//
// MAINTENANCE_MODE=on turns it on (then redeploy); unset or off = the normal site.
// MAINTENANCE_BYPASS_KEY: open any page once with ?preview=<key> to see the real site in that
// browser (?preview=off to see the maintenance page again).

const PREVIEW_COOKIE = "alldrive_preview";
// Paths that always work: the dashboard, the backend API it uses, and uploaded photos.
const ALWAYS_OPEN = /^\/(admin|api|uploads)(\/|$)/;

function maintenanceOn() {
  const setting = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return setting === "on" || setting === "true" || setting === "1";
}

// The cookie holds a hash of the key, never the key itself.
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (!maintenanceOn()) {
    // Nothing to see here when the site is up.
    return pathname === "/maintenance" ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (ALWAYS_OPEN.test(pathname) || pathname === "/maintenance") return NextResponse.next();

  const key = process.env.MAINTENANCE_BYPASS_KEY?.trim();
  const preview = searchParams.get("preview");
  if (key && preview !== null) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("preview");
    const res = NextResponse.redirect(clean);
    if (preview === key) {
      res.cookies.set(PREVIEW_COOKIE, await sha256(key), {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }
    if (preview === "off") {
      res.cookies.delete(PREVIEW_COOKIE);
      return res;
    }
  }
  if (key && request.cookies.get(PREVIEW_COOKIE)?.value === (await sha256(key))) return NextResponse.next();

  const headers = { "Retry-After": "3600", "Cache-Control": "no-store" };
  const maintenancePage = new URL("/maintenance", request.url);

  // Search engines must get a 503 ("down for a while") so they keep the real pages indexed. A
  // rewrite can't change the status, so page loads fetch the (static) maintenance page and
  // resend it as a 503. In-app navigations (RSC requests) just get the rewrite.
  if ((request.method === "GET" || request.method === "HEAD") && !request.headers.has("rsc")) {
    try {
      const page = await fetch(maintenancePage, { headers: { accept: "text/html" }, cache: "no-store" });
      if (page.ok) {
        const body = request.method === "HEAD" ? null : await page.text();
        return new NextResponse(body, {
          status: 503,
          headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
        });
      }
    } catch {
      // Fall through to the rewrite.
    }
  }
  return NextResponse.rewrite(maintenancePage, { headers });
}

export const config = {
  // Every page, but not Next.js assets or public files (images, icons, robots.txt, sw.js...).
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
