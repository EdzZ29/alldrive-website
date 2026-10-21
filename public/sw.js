// AllDrive admin push notifications.
//
// Registered only from the admin dashboard, with scope /admin, so it never controls the public
// website. It has no fetch handler: it doesn't cache or intercept any requests. It only shows
// the notifications the backend sends (see all-drive-backend/src/modules/push) and opens the
// right admin page when one is tapped.

const FALLBACK_URL = "/admin/bookings";

self.addEventListener("install", () => {
  // Use a new version of this file right away instead of waiting for tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of admin tabs that were open before this worker existed.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || "AllDrive Admin";
  const options = {
    body: data.body || "",
    icon: "/icon.png",
    data: { url: data.url || FALLBACK_URL },
  };
  if (data.tag) {
    // Same tag replaces an older notification; renotify still buzzes for the update.
    options.tag = data.tag;
    options.renotify = true;
  }

  // Always show something: browsers penalize pushes that don't display a notification.
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(openAdminPage(adminUrl(event.notification.data && event.notification.data.url)));
});

// Only ever opens pages inside this site's admin area.
function adminUrl(url) {
  try {
    const target = new URL(url || FALLBACK_URL, self.location.origin);
    if (target.origin === self.location.origin && target.pathname.startsWith("/admin")) return target.href;
  } catch {
    // Fall through to the default page.
  }
  return new URL(FALLBACK_URL, self.location.origin).href;
}

async function openAdminPage(url) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const adminTab = windows.find((client) => new URL(client.url).pathname.startsWith("/admin"));

  if (adminTab) {
    await adminTab.focus();
    try {
      // Works for tabs this worker controls.
      await adminTab.navigate(url);
    } catch {
      // Otherwise ask the page to go there (handled in the admin shell).
      adminTab.postMessage({ type: "alldrive:open", url });
    }
    return;
  }
  await self.clients.openWindow(url);
}
