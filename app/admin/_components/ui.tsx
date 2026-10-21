"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Native select styled like the site's inputs (simple and reliable on phones). 16px text on
 * phones, or iOS zooms in when it's tapped. */
export const selectClass =
  "h-11 w-full rounded-xl border border-input bg-white px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm";

/** Page title with an action (e.g. refresh) that stays on the same row on phones. */
export function PageTitle({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:items-end">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

/** Filter chips: one swipeable row on phones, wrapping on wider screens. */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  count,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  count?: (option: T) => number;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => (
        <button
          key={option}
          role="tab"
          aria-selected={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition",
            value === option ? "bg-ink text-white" : "bg-white text-muted-foreground ring-1 ring-line hover:text-ink",
          )}
        >
          {option}
          {count && <span className="ml-1.5 opacity-60">{count(option)}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Details dialog layout: a bottom sheet on phones (full width, up to almost full height), a
 * centered dialog on larger screens.
 */
export const sheetClass =
  "max-h-[92svh] gap-5 overflow-y-auto overscroll-contain rounded-3xl p-5 sm:max-w-2xl sm:p-7 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-0";

/** Save/status buttons pinned to the bottom of the dialog, so they're always within reach. */
export function SheetActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 flex flex-wrap items-center justify-between gap-2 border-t border-line bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:px-0 sm:pb-0">
      {children}
    </div>
  );
}

export function Field({ id, label, children, className }: { id: string; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Detail({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold break-words">{children || "N/A"}</dd>
    </div>
  );
}

const TONES = {
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  gray: "bg-muted text-muted-foreground ring-line",
} as const;

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  Pending: "amber",
  Approved: "blue",
  Returned: "violet",
  Completed: "green",
  Declined: "red",
  Cancelled: "gray",
  New: "amber",
  Contacted: "blue",
  Closed: "gray",
  Unpaid: "gray",
  "Down Payment": "amber",
  "Fully Paid": "green",
  Available: "green",
  Booked: "blue",
  Maintenance: "amber",
  Unlisted: "gray",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset", TONES[STATUS_TONE[status] ?? "gray"])}>
      {status}
    </span>
  );
}

/** Calls `refresh` every `ms` while the tab is visible, and right away when it becomes visible. */
export function useAutoRefresh(refresh: () => void, ms = 30_000) {
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && refresh();
    const timer = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh, ms]);
}

/** Drops ?id= from the address bar so a reload doesn't reopen the same item. */
export function clearIdFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("id")) return;
  url.searchParams.delete("id");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}
