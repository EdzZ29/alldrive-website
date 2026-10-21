"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { Bell, CalendarCheck, CheckCheck, MessageSquareText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, formatWhen, type AppNotification, type Summary } from "../_lib/api";

/** Fired on window for every new notification, so open lists can update in place. */
export const LIVE_EVENT = "alldrive:live";
const POLL_MS = 30_000;
const TOAST_MS = 8_000;

// ---------- Sound preference (per browser) ----------

const SOUND_KEY = "alldrive-admin-sound";
const SOUND_EVENT = "alldrive:sound-pref";
const readSound = () => {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
};
const subscribeSound = (cb: () => void) => {
  window.addEventListener(SOUND_EVENT, cb);
  return () => window.removeEventListener(SOUND_EVENT, cb);
};
export const useSoundPref = () => useSyncExternalStore(subscribeSound, readSound, () => true);
export function setSoundPref(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // Storage blocked (private mode): the setting just won't stick.
  }
  window.dispatchEvent(new Event(SOUND_EVENT));
}

/** Short two-note chime, made in the browser (no sound file). */
export function playChime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.16;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    window.setTimeout(() => void ctx.close(), 1000);
  } catch {
    // Audio blocked until the page has been interacted with; the toast still shows.
  }
}

// ---------- Live notifications ----------

type Toast = AppNotification & { key: number };

type LiveValue = {
  notifications: AppNotification[];
  unread: number;
  connected: boolean;
  summary: Summary | null;
  refreshSummary: () => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
};

const LiveContext = createContext<LiveValue | null>(null);
export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used inside <LiveProvider>");
  return ctx;
}

/** Where a notification leads in the dashboard. */
export const notificationHref = (n: AppNotification) =>
  n.type === "inquiry" ? `/admin/inquiries${n.inquiryId ? `?id=${n.inquiryId}` : ""}` : `/admin/bookings${n.bookingId ? `?id=${n.bookingId}` : ""}`;

/**
 * Keeps the dashboard live: loads recent notifications, listens to the backend's stream, and
 * polls as a backup (some hosts and proxies cut long-lived connections). Every new booking or
 * inquiry shows a toast, plays a chime (if on) and updates the counts.
 */
export function LiveProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Highest notification id already seen; anything above it is new. null = not loaded yet.
  const seenId = useRef<number | null>(null);
  const sound = useSoundPref();
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  const refreshSummary = useCallback(() => {
    api<Summary>("/dashboard/summary").then(setSummary, (err) => console.error("[live] summary:", err));
  }, []);

  const announce = useCallback(
    (fresh: AppNotification[]) => {
      if (fresh.length === 0) return;
      setNotifications((list) => {
        const ids = new Set(list.map((n) => n.id));
        return [...fresh.filter((n) => !ids.has(n.id)), ...list].sort((a, b) => b.id - a.id).slice(0, 50);
      });
      setToasts((list) => [...fresh.map((n) => ({ ...n, key: n.id })), ...list].slice(0, 4));
      fresh.forEach((n) => window.dispatchEvent(new CustomEvent<AppNotification>(LIVE_EVENT, { detail: n })));
      if (soundRef.current) playChime();
      refreshSummary();
    },
    [refreshSummary],
  );

  // New = id above the highest seen. The first load only sets the baseline (no toasts).
  const takeNew = useCallback((items: AppNotification[]) => {
    const max = items.reduce((m, n) => Math.max(m, n.id), seenId.current ?? 0);
    const fresh = seenId.current == null ? [] : items.filter((n) => n.id > seenId.current!);
    seenId.current = max;
    return fresh;
  }, []);

  useEffect(() => {
    let active = true;
    const load = () =>
      api<AppNotification[]>("/notifications").then(
        (items) => {
          if (!active) return;
          const first = seenId.current == null;
          const fresh = takeNew(items);
          if (first) setNotifications(items);
          else announce(fresh);
        },
        (err) => console.error("[live] notifications:", err),
      );
    void load();
    refreshSummary();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);

    const stream = new EventSource("/api/notifications/stream");
    stream.onopen = () => setConnected(true);
    stream.onerror = () => setConnected(false); // EventSource reconnects by itself
    stream.addEventListener("notification", (e) => {
      try {
        const n = JSON.parse((e as MessageEvent<string>).data) as AppNotification;
        // Before the first load finishes, that load will include it.
        if (seenId.current != null) announce(takeNew([n]));
      } catch {
        // Ignore malformed frames.
      }
    });

    return () => {
      active = false;
      window.clearInterval(timer);
      stream.close();
    };
  }, [announce, refreshSummary, takeNew]);

  const markRead = useCallback(
    (id: number) => {
      setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
      api(`/notifications/${id}/read`, { method: "PATCH" }).then(refreshSummary, () => undefined);
    },
    [refreshSummary],
  );
  const markAllRead = useCallback(() => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    api("/notifications/read-all", { method: "PATCH" }).then(refreshSummary, () => undefined);
  }, [refreshSummary]);

  const dismiss = useCallback((key: number) => setToasts((list) => list.filter((t) => t.key !== key)), []);

  const unread = notifications.filter((n) => !n.read).length;
  const value = useMemo(
    () => ({ notifications, unread, connected, summary, refreshSummary, markRead, markAllRead }),
    [notifications, unread, connected, summary, refreshSummary, markRead, markAllRead],
  );

  return (
    <LiveContext.Provider value={value}>
      {children}
      <Toasts toasts={toasts} onDismiss={dismiss} onOpen={markRead} />
    </LiveContext.Provider>
  );
}

function Toasts({ toasts, onDismiss, onOpen }: { toasts: Toast[]; onDismiss: (key: number) => void; onOpen: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] grid gap-2 sm:inset-x-auto sm:top-auto sm:right-5 sm:bottom-5 sm:w-96"
    >
      {toasts.map((t) => (
        <ToastCard key={t.key} toast={t} onDismiss={onDismiss} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss, onOpen }: { toast: Toast; onDismiss: (key: number) => void; onOpen: (id: number) => void }) {
  // Both callbacks are stable, so the timer runs once per toast.
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.key), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast.key, onDismiss]);
  const Icon = toast.type === "inquiry" ? MessageSquareText : CalendarCheck;

  return (
    <div role="status" className="pointer-events-auto flex animate-in items-start gap-3 rounded-2xl bg-ink p-4 text-white shadow-2xl fade-in slide-in-from-bottom-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-ink">
        <Icon className="size-4" />
      </span>
      <Link
        href={notificationHref(toast)}
        onClick={() => {
          onOpen(toast.id);
          onDismiss(toast.key);
        }}
        className="min-w-0 flex-1"
      >
        <p className="text-sm font-bold">{toast.title}</p>
        <p className="line-clamp-2 text-xs text-white/70">{toast.message}</p>
        <p className="mt-1 text-xs font-semibold text-brand">Open →</p>
      </Link>
      <button onClick={() => onDismiss(toast.key)} aria-label="Dismiss" className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white">
        <X className="size-4" />
      </button>
    </div>
  );
}

/** Bell with unread count and the latest notifications. */
export function NotificationBell() {
  const { notifications, unread, connected, markRead, markAllRead } = useLive();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        className="relative grid size-11 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-ink"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-bold">Notifications</p>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-amber-500")} />
                {connected ? "Live" : "Checking every 30 seconds"}
              </p>
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[min(70svh,420px)] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((n) => {
                const Icon = n.type === "inquiry" ? MessageSquareText : CalendarCheck;
                return (
                  <Link
                    key={n.id}
                    href={notificationHref(n)}
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                      setOpen(false);
                    }}
                    className={cn("flex gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-muted/60", !n.read && "bg-brand-50/60")}
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-brand-700">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{n.title}</span>
                        {!n.read && <span className="size-2 shrink-0 rounded-full bg-brand-600" />}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                      <span className="text-[11px] text-muted-foreground">{formatWhen(n.createdAt)}</span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Admin pages: run `onNew` for every new notification (e.g. to add a booking to the list). */
export function useLiveEvents(onNew: (n: AppNotification) => void) {
  useEffect(() => {
    const handler = (e: Event) => onNew((e as CustomEvent<AppNotification>).detail);
    window.addEventListener(LIVE_EVENT, handler);
    return () => window.removeEventListener(LIVE_EVENT, handler);
  }, [onNew]);
}
