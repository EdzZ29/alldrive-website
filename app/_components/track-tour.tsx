"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch, X } from "lucide-react";
import { cn } from "@/lib/utils";

// The visitor's last booking, kept in their browser so a later visit can point them to
// "Track my booking". Storage can be blocked (private mode), so every access is guarded.
const KEY = "alldrive:booking";
// Set during the visit they booked in: the tour waits for their next visit.
const THIS_VISIT = "alldrive:booked-this-visit";
const KEEP_DAYS = 90;

type Saved = { reference: string; bookedAt: number; dismissed?: boolean };

function read(): Saved | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
    return saved?.reference ? saved : null;
  } catch {
    return null;
  }
}

function write(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Not saved: the tour just won't show.
  }
}

/** Called after a booking is sent, so the next visit can point to Track my booking. */
export function rememberBooking(reference: string) {
  write({ reference, bookedAt: Date.now() });
  try {
    sessionStorage.setItem(THIS_VISIT, "1");
  } catch {
    // Without it the tour may show later in this same visit; harmless.
  }
}

// Everyone else gets a general "Already booked?" tip on the landing page, until they close it.
// It comes back after a while, for people who book later.
const TIP_CLOSED = "alldrive:track-tip-closed";
const TIP_AGAIN_DAYS = 30;
const DAY = 86_400_000;

/**
 * Whether the Track my booking callout shows, and for which booking: a returning customer's own
 * code on any page, or (reference null) the general tip on the landing page.
 */
export function useTrackTour() {
  const [tour, setTour] = useState<{ reference: string | null } | null>(null);

  useEffect(() => {
    if (window.location.pathname.startsWith("/track")) return;
    try {
      // Just booked in this visit: the sent screen already showed the code.
      if (sessionStorage.getItem(THIS_VISIT)) return;
    } catch {
      // Can't tell: carry on.
    }
    const saved = read();
    let show: { reference: string | null } | null = null;
    if (saved && !saved.dismissed && Date.now() - saved.bookedAt < KEEP_DAYS * DAY) {
      show = { reference: saved.reference };
    } else if (window.location.pathname === "/") {
      let closedAt = 0;
      try {
        closedAt = Number(localStorage.getItem(TIP_CLOSED)) || 0;
      } catch {
        // Storage blocked: show it (closing just won't be remembered).
      }
      if (Date.now() - closedAt > TIP_AGAIN_DAYS * DAY) show = { reference: null };
    }
    if (!show) return;
    // A moment after the page settles, so it doesn't flash in with everything else.
    const timer = window.setTimeout(() => setTour(show), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    if (!tour) return;
    const saved = read();
    if (tour.reference && saved) write({ ...saved, dismissed: true });
    if (!tour.reference) {
      try {
        localStorage.setItem(TIP_CLOSED, String(Date.now()));
      } catch {
        // Not remembered: it may show again next visit.
      }
    }
    setTour(null);
  };
  return { open: !!tour, reference: tour?.reference ?? null, dismiss };
}

/**
 * The callout under "Track my booking" (or the menu button on phones). `className` places it
 * and hides it at the other screen sizes; the arrow points up from its right edge.
 */
export function TrackTourCallout({
  reference,
  onDismiss,
  hint,
  className,
}: {
  reference: string | null;
  onDismiss: () => void;
  hint: string;
  className?: string;
}) {
  return (
    <div
      role="dialog"
      aria-label="Track your booking"
      className={cn("animate-pop-in absolute top-full right-0 z-10 mt-3 w-72 rounded-2xl bg-white p-4 text-ink shadow-2xl", className)}
    >
      <span aria-hidden className="absolute -top-1.5 right-5 size-3 rotate-45 rounded-[2px] bg-white" />
      <button onClick={onDismiss} aria-label="Close" className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-ink">
        <X className="size-4" />
      </button>
      <p className="flex items-center gap-2 pr-6 font-display font-bold">
        <PackageSearch className="size-5 shrink-0 text-brand-600" /> {reference ? "Welcome back!" : "Already booked with us?"}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {reference ? (
          <>
            Check the status of booking <span className="font-mono font-bold whitespace-nowrap text-ink">{reference}</span> anytime.
          </>
        ) : (
          "Check your booking's status anytime with your booking code and mobile number."
        )}{" "}
        {hint}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={reference ? `/track?ref=${encodeURIComponent(reference)}` : "/track"}
          onClick={onDismiss}
          className="grid h-10 place-items-center rounded-xl bg-ink text-sm font-bold text-white transition hover:bg-ink/90"
        >
          {reference ? "Track it now" : "Track booking"}
        </Link>
        <button onClick={onDismiss} className="h-10 rounded-xl border border-line text-sm font-bold transition hover:border-ink">
          Got it
        </button>
      </div>
    </div>
  );
}
