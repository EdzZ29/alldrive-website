"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { api, errorText, type Paged } from "../_lib/api";

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

/** Password field with an eye button to show or hide what was typed. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-12", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted-foreground transition hover:text-ink focus-visible:text-ink focus-visible:outline-none"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
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
  Open: "green",
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

// ---------- Lists: pages and search ----------

/** Page numbers to show: the first, the last and the ones around the current page; null = a gap. */
function pageNumbers(page: number, pages: number): (number | null)[] {
  const keep = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  // A gap of one page shows that page instead of "…".
  return keep.flatMap((n, i) => {
    const prev = keep[i - 1];
    if (prev === undefined || n - prev === 1) return [n];
    return n - prev === 2 ? [prev + 1, n] : [null, n];
  });
}

/** "Showing 21–40 of 132" with previous/next and page number buttons. Hidden only when the list is empty. */
export function Pagination({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const button =
    "grid h-11 min-w-11 place-items-center rounded-xl border border-line bg-white px-2 text-sm font-semibold text-ink tabular-nums transition hover:border-ink disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-ink">{from}–{to}</span> of <span className="font-semibold text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page" className={button}>
          <ChevronLeft className="size-5" />
        </button>
        {/* Phones: "2 / 7". Wider screens: 1 2 3 … 7 */}
        <span className="min-w-16 text-center text-sm font-semibold tabular-nums sm:hidden">
          {page} / {pages}
        </span>
        {pageNumbers(page, pages).map((n, i) =>
          n == null ? (
            <span key={`gap-${i}`} aria-hidden className="hidden w-6 text-center text-muted-foreground sm:inline">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={cn(button, "hidden sm:grid", n === page && "border-ink bg-ink text-white hover:border-ink")}
            >
              {n}
            </button>
          ),
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page" className={button}>
          <ChevronRight className="size-5" />
        </button>
      </div>
    </nav>
  );
}

/** Search field that reports what was typed a moment after typing stops. */
export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (q: string) => void; placeholder: string; label: string }) {
  const [text, setText] = useState(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (text.trim() === value) return;
    const timer = window.setTimeout(() => onChangeRef.current(text.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [text, value]);
  return (
    <div className="relative mb-4">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        maxLength={100}
        className="h-11 rounded-xl bg-white pr-10 pl-10"
      />
      {text && (
        <button
          onClick={() => {
            setText("");
            onChangeRef.current("");
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/**
 * One page of a backend list (`?page=&limit=&filter=&q=`). Keeps the previous page on screen
 * while the next one loads. `reload` refetches the current page (after a change or live event).
 */
export function usePagedList<T, F extends string = string>(path: string, params: { page: number; limit?: number; filter?: F; q?: string; extra?: Record<string, string | undefined> }) {
  const [data, setData] = useState<Paged<T, F> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("limit", String(params.limit ?? 20));
  if (params.filter) search.set("filter", params.filter);
  if (params.q) search.set("q", params.q);
  for (const [k, v] of Object.entries(params.extra ?? {})) if (v) search.set(k, v);
  const url = `${path}?${search}`;

  const reload = useCallback(
    () =>
      api<Paged<T, F>>(url).then(
        (result) => {
          setData(result);
          setError(null);
        },
        (err) => setError(errorText(err, "Couldn't load the list.")),
      ),
    [url],
  );
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, reload, setData };
}

/** Client-side pages for short lists (units, admins). */
export function pageSlice<T>(items: T[], page: number, limit = 20) {
  const pages = Math.max(1, Math.ceil(items.length / limit));
  const current = Math.min(page, pages);
  return { items: items.slice((current - 1) * limit, current * limit), page: current, total: items.length, limit };
}

/** Drops ?id= from the address bar so a reload doesn't reopen the same item. */
export function clearIdFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("id")) return;
  url.searchParams.delete("id");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}
