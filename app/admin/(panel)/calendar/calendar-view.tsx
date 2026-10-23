"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Car, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api, errorText, formatDay, formatTime, type Booking } from "../../_lib/api";
import { addDays, rentalKind, rentalLabel, shortDay, todayPH } from "../../_lib/rentals";
import { useLiveEvents } from "../../_components/live";
import { PageTitle, StatusBadge, ToneBadge, useAutoRefresh } from "../../_components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-10" moved by n months. */
function shiftMonth(month: string, n: number) {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

/** The 6 weeks (Sunday first) that show a month. */
function monthGrid(month: string) {
  const first = `${month}-01`;
  const start = addDays(first, -new Date(`${first}T00:00:00Z`).getUTCDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

const monthName = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-PH", { month: "long", year: "numeric", timeZone: "UTC" });

/** What happens on one day: cars going out, coming back, and already out. */
function eventsOn(day: string, bookings: Booking[]) {
  return {
    pickups: bookings.filter((b) => b.startDate === day),
    returns: bookings.filter((b) => b.endDate === day),
    out: bookings.filter((b) => b.startDate < day && day < b.endDate),
  };
}

/** The unit's plate when one is assigned, else the car the customer picked. */
const carShort = (b: Booking) => b.vehicle?.plateNumber ?? b.carLabel.replace(/\s*\(.*\)$/, "");
const firstName = (b: Booking) => b.customerName.split(/\s+/)[0];
// Returned and completed bookings stay on the calendar, dimmed.
const isDone = (b: Booking) => b.status !== "Approved";

export function CalendarView() {
  const today = todayPH();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const days = monthGrid(month);
  const url = `/bookings/calendar?from=${days[0]}&to=${days[days.length - 1]}`;
  const load = useCallback(
    () =>
      api<Booking[]>(url).then(
        (list) => {
          setBookings(list);
          setError(null);
        },
        (err) => setError(errorText(err, "Couldn't load the calendar.")),
      ),
    [url],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useAutoRefresh(load);
  useLiveEvents(useCallback((n) => n.type === "booking" && void load(), [load]));

  const goMonth = (next: string) => {
    setMonth(next);
    setSelected(next === today.slice(0, 7) ? today : `${next}-01`);
  };
  const day = eventsOn(selected, bookings ?? []);

  return (
    <>
      <PageTitle
        title="Calendar"
        description="Confirmed bookings by day: when each car goes out, and when it comes back."
        action={
          <Button variant="outline" size="md" onClick={() => goMonth(today.slice(0, 7))} className="shrink-0 rounded-xl border-line">
            Today
          </Button>
        }
      />

      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        <section className="rounded-2xl border border-line bg-white p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button variant="outline" size="md" onClick={() => goMonth(shiftMonth(month, -1))} aria-label="Previous month" className="rounded-xl border-line">
              <ChevronLeft />
            </Button>
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
              {monthName(month)}
              {!bookings && !error && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading" />}
            </h2>
            <Button variant="outline" size="md" onClick={() => goMonth(shiftMonth(month, 1))} aria-label="Next month" className="rounded-xl border-line">
              <ChevronRight />
            </Button>
          </div>

          <Legend />

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
            {WEEKDAYS.map((w) => (
              <div key={w} className="bg-muted px-1 py-1.5 text-center text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                {w}
              </div>
            ))}
            {days.map((d) => {
              const { pickups, returns, out } = eventsOn(d, bookings ?? []);
              const chips = [...pickups.map((b) => ({ b, type: "out" as const })), ...returns.map((b) => ({ b, type: "back" as const }))];
              const inMonth = d.startsWith(month);
              return (
                <button
                  key={d}
                  onClick={() => setSelected(d)}
                  aria-pressed={d === selected}
                  aria-label={`${formatDay(d)}: ${pickups.length} pickups, ${returns.length} returns, ${out.length} on rent`}
                  className={cn(
                    "flex min-h-16 flex-col items-stretch gap-1 bg-white p-1 text-left transition hover:bg-muted/60 sm:min-h-28 sm:p-1.5",
                    !inMonth && "bg-muted/40 text-muted-foreground",
                    d === selected && "ring-2 ring-brand ring-inset",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center self-start rounded-full text-xs font-bold tabular-nums sm:size-7 sm:text-sm",
                      d === today && "bg-ink text-white",
                    )}
                  >
                    {Number(d.slice(8))}
                  </span>
                  {/* Phones: dots. Wider screens: one line per pickup or return. */}
                  <span className="flex flex-wrap gap-1 sm:hidden">
                    {pickups.length > 0 && <span className="size-2 rounded-full bg-emerald-500" />}
                    {returns.length > 0 && <span className="size-2 rounded-full bg-amber-500" />}
                    {out.length > 0 && <span className="size-2 rounded-full bg-brand" />}
                  </span>
                  <span className="hidden min-w-0 gap-1 sm:grid">
                    {chips.slice(0, 3).map(({ b, type }) => (
                      <span
                        key={`${type}-${b.id}`}
                        className={cn(
                          "flex min-w-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-[11px] leading-tight font-semibold",
                          type === "out" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
                          isDone(b) && "opacity-50",
                        )}
                      >
                        {type === "out" ? <ArrowUpRight className="size-3 shrink-0" /> : <ArrowDownLeft className="size-3 shrink-0" />}
                        <span className="truncate">
                          {carShort(b)} · {firstName(b)}
                        </span>
                      </span>
                    ))}
                    {chips.length > 3 && <span className="px-1 text-[11px] font-semibold text-muted-foreground">+{chips.length - 3} more</span>}
                    {out.length > 0 && (
                      <span className="flex items-center gap-1 rounded-md bg-brand-50 px-1 py-0.5 text-[11px] leading-tight font-semibold text-brand-700">
                        <Car className="size-3 shrink-0" /> {out.length} on rent
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-live="polite" className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-display text-lg font-extrabold">
            {selected === today ? "Today" : formatDay(selected)}
            {selected === today && <span className="ml-2 text-sm font-semibold text-muted-foreground">{formatDay(selected)}</span>}
          </h2>
          {!bookings ? (
            <Loader2 className="mx-auto my-8 size-5 animate-spin text-muted-foreground" aria-label="Loading" />
          ) : day.pickups.length + day.returns.length + day.out.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted-foreground">
              No pickups, returns or cars out on this day.
            </p>
          ) : (
            <div className="mt-3 grid gap-4">
              <DayGroup title="Pickups" tone="text-emerald-700" items={day.pickups} today={today} />
              <DayGroup title="Returns" tone="text-amber-800" items={day.returns} today={today} />
              <DayGroup title="On rent" tone="text-brand-700" items={day.out} today={today} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Legend() {
  const items = [
    { label: "Pickup (goes out)", dot: "bg-emerald-500" },
    { label: "Return (comes back)", dot: "bg-amber-500" },
    { label: "On rent", dot: "bg-brand" },
  ];
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", i.dot)} /> {i.label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-muted-foreground/40" /> Dimmed: returned or completed
      </li>
    </ul>
  );
}

function DayGroup({ title, tone, items, today }: { title: string; tone: string; items: Booking[]; today: string }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className={cn("mb-1.5 text-xs font-bold tracking-[0.15em] uppercase", tone)}>
        {title} · {items.length}
      </h3>
      <ul className="grid gap-2">
        {items.map((b) => {
          const rental = b.status === "Approved" && b.vehicle ? rentalLabel(rentalKind(b, today), b) : null;
          return (
            <li key={b.id}>
              <Link
                href={`/admin/bookings?id=${b.id}`}
                className={cn("block rounded-xl border border-line p-3 transition hover:border-brand", isDone(b) && "opacity-70")}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{b.customerName}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{b.reference}</span>
                  </span>
                  {rental ? <ToneBadge tone={rental.tone}>{rental.text}</ToneBadge> : <StatusBadge status={b.status} />}
                </span>
                <span className="mt-2 block text-sm">
                  {b.vehicle ? (
                    <>
                      {b.vehicle.brand} {b.vehicle.model} <span className="font-mono font-semibold">{b.vehicle.plateNumber}</span>
                    </>
                  ) : (
                    <>
                      {b.carLabel} <span className="font-semibold text-amber-700">· no unit assigned</span>
                    </>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {shortDay(b.startDate)}
                  {b.pickupTime && ` ${formatTime(b.pickupTime)}`} → {shortDay(b.endDate)} · {b.days} day{b.days > 1 ? "s" : ""} ·{" "}
                  {b.specificPlace ? `${b.specificPlace}, ${b.destination}` : b.destination}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
