"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Car, ExternalLink, History, LayoutDashboard, Loader2, LogOut, Menu, MessagesSquare, MessageSquareText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { api, ApiError, errorText, type User } from "../_lib/api";
import { disablePush } from "../_lib/push";
import { LiveProvider, NotificationBell, useLive } from "./live";
import { UndoProvider } from "./undo";

type AdminContextValue = { user: User; setUser: (u: User) => void };
const AdminContext = createContext<AdminContextValue | null>(null);
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminShell>");
  return ctx;
}

type NavItem = { href: string; label: string; Icon: typeof CalendarCheck; badge?: "bookings" | "inquiries" | "chats" };
const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", Icon: CalendarCheck, badge: "bookings" },
  { href: "/admin/messages", label: "Messages", Icon: MessagesSquare, badge: "chats" },
  { href: "/admin/inquiries", label: "Inquiries", Icon: MessageSquareText, badge: "inquiries" },
  { href: "/admin/fleet", label: "Fleet & prices", Icon: Car },
  { href: "/admin/activity", label: "Activity log", Icon: History },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

/** Signed-in frame for every admin page: session check, sidebar, notifications. */
export function AdminShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<User>("/auth/me")
      .then((u) => active && setUser(u))
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          const here = window.location.pathname + window.location.search;
          window.location.replace(`/admin/login?next=${encodeURIComponent(here)}`);
        } else {
          setError(errorText(err));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // A notification tapped while an admin tab was open but not yet controlled by the service
  // worker: the worker asks this page to open the booking (see public/sw.js).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent<{ type?: string; url?: string }>) => {
      if (e.data?.type !== "alldrive:open" || !e.data.url) return;
      const url = new URL(e.data.url, window.location.origin);
      if (url.origin === window.location.origin && url.pathname.startsWith("/admin")) window.location.assign(url.href);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  if (!user) {
    return (
      <div className="grid min-h-svh place-items-center px-4 text-sm text-muted-foreground">
        {error ? (
          <p role="alert" className="max-w-sm text-center font-semibold text-red-600">
            {error}
          </p>
        ) : (
          <Loader2 className="size-6 animate-spin" aria-label="Loading" />
        )}
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ user, setUser }}>
      <LiveProvider>
        <UndoProvider>
          <Frame user={user}>{children}</Frame>
        </UndoProvider>
      </LiveProvider>
    </AdminContext.Provider>
  );
}

function Frame({ user, children }: { user: User; children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = NAV.find((n) => isActive(pathname, n.href));

  return (
    <div className="lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white lg:flex">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      {/* Phone/tablet drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          // Don't put focus on a button (e.g. Sign out) just because the menu opened.
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-[84%] max-w-xs gap-0 p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContent user={user} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <header className="sticky top-0 z-20 border-b border-line bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex h-16 items-center gap-2 px-3 sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="grid size-11 place-items-center rounded-xl text-ink hover:bg-muted lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <p className="truncate font-display text-lg font-extrabold tracking-tight lg:hidden">{current?.label ?? "Admin"}</p>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

function SidebarContent({ user, pathname, onNavigate }: { user: User; pathname: string; onNavigate?: () => void }) {
  const { summary } = useLive();
  const [signingOut, setSigningOut] = useState(false);
  const counts = { bookings: summary?.pendingBookings ?? 0, inquiries: summary?.newInquiries ?? 0, chats: summary?.unreadChats ?? 0 };

  const signOut = async () => {
    setSigningOut(true);
    // Stop customer details arriving on this device once nobody is signed in on it.
    await disablePush().catch((err) => console.error("[push] Couldn't turn off notifications on sign-out:", err));
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.replace("/admin/login");
  };

  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="flex h-16 shrink-0 items-center px-5 font-display text-xl font-extrabold tracking-tight">
        All<span className="text-brand-600">Drive</span>
        <span className="ml-1.5 rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">Admin</span>
      </Link>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="grid gap-1">
          {NAV.map(({ href, label, Icon, badge }) => {
            const active = isActive(pathname, href);
            const count = badge ? counts[badge] : 0;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                    active ? "bg-ink text-white" : "text-muted-foreground hover:bg-muted hover:text-ink",
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1">{label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold",
                        active ? "bg-brand text-ink" : "bg-red-500 text-white",
                      )}
                      aria-label={`${count} new`}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid gap-1 border-t border-line p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-ink"
        >
          <ExternalLink className="size-[18px]" /> View website
        </a>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
            {user.name.trim().charAt(0).toUpperCase() || "A"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
          <button
            onClick={() => void signOut()}
            disabled={signingOut}
            aria-label="Sign out"
            title="Sign out"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
