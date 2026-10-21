// Web push for the admin dashboard: registers public/sw.js, subscribes this browser with the
// backend's VAPID public key, and keeps the backend's push_subscriptions table in sync.

import { api } from "./api";

const SW_URL = "/sw.js";
// Covers /admin and every page under it ("/admin/" would leave out /admin itself).
const SW_SCOPE = "/admin";

export type PushStatus =
  | "unsupported" // this browser can't do web push
  | "ios-install" // iPhone/iPad Safari: must be added to the Home Screen first
  | "unconfigured" // the backend has no VAPID keys yet
  | "denied" // the user blocked notifications for this site
  | "off"
  | "on";

export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac.
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

function pushSupported() {
  return window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** VAPID keys are URL-safe base64; pushManager.subscribe() wants the raw bytes. */
function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function sameKey(sub: PushSubscription, publicKey: string) {
  const current = sub.options.applicationServerKey;
  if (!current) return false;
  const a = new Uint8Array(current);
  const b = keyBytes(publicKey);
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

async function publicKey(): Promise<string | null> {
  try {
    return (await api<{ publicKey: string }>("/push/public-key")).publicKey;
  } catch (err) {
    // 503 = the backend has no VAPID keys configured.
    if ((err as { status?: number }).status === 503) return null;
    throw err;
  }
}

const existingRegistration = () => navigator.serviceWorker.getRegistration(SW_SCOPE);

const saveSubscription = (sub: PushSubscription) => api("/push/subscribe", { method: "POST", body: sub.toJSON() });

/**
 * Current state for this browser, without prompting. If it's already subscribed, re-sends the
 * subscription so the backend has it even if its row was removed.
 */
export async function checkPush(): Promise<PushStatus> {
  if (!pushSupported()) return isIOS() && !isStandalone() ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";

  const key = await publicKey();
  if (!key) return "unconfigured";

  const sub = await (await existingRegistration())?.pushManager.getSubscription();
  if (!sub || Notification.permission !== "granted") return "off";
  if (!sameKey(sub, key)) {
    // The server's VAPID keys changed; this subscription can't receive pushes any more.
    await sub.unsubscribe().catch(() => undefined);
    return "off";
  }
  await saveSubscription(sub);
  return "on";
}

/** Requesting permission must happen in a click handler (Safari requires a user gesture). */
async function requestPermission(): Promise<NotificationPermission> {
  // Older Safari only supports the callback form.
  return new Promise((resolve) => {
    const result = Notification.requestPermission(resolve);
    if (result) result.then(resolve, () => resolve(Notification.permission));
  });
}

/** Turns push on for this browser. Call from a click handler. */
export async function enablePush(): Promise<PushStatus> {
  if (!pushSupported()) return isIOS() && !isStandalone() ? "ios-install" : "unsupported";

  // Ask first, while the click still counts as a user gesture.
  const permission = await requestPermission();
  if (permission === "denied") return "denied";
  if (permission !== "granted") return "off"; // dismissed the prompt

  const key = await publicKey();
  if (!key) return "unconfigured";

  const registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE, updateViaCache: "none" });
  // subscribe() needs an active worker; ready resolves once it is (this page is inside the scope).
  await navigator.serviceWorker.ready;

  let sub = await registration.pushManager.getSubscription();
  if (sub && !sameKey(sub, key)) {
    await sub.unsubscribe();
    sub = null;
  }
  sub ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });

  await saveSubscription(sub);
  return "on";
}

/** Turns push off for this browser and removes it from the backend. */
export async function disablePush(): Promise<PushStatus> {
  if (!pushSupported()) return isIOS() && !isStandalone() ? "ios-install" : "unsupported";
  const sub = await (await existingRegistration())?.pushManager.getSubscription();
  if (sub) {
    const { endpoint } = sub;
    await sub.unsubscribe();
    // Best effort: if this fails, the backend drops it on the next push anyway (410 Gone).
    await api("/push/unsubscribe", { method: "POST", body: { endpoint } }).catch((err) =>
      console.error("[push] Couldn't remove the subscription from the server:", err),
    );
  }
  return Notification.permission === "denied" ? "denied" : "off";
}
