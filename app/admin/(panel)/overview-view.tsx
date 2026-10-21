"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Car, Hourglass, MessageSquareText, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, formatDay, formatWhen, priceText, type Booking, type Inquiry } from "../_lib/api";
import { checkPush } from "../_lib/push";
import { useAdmin } from "../_components/admin-shell";
import { useLive, useLiveEvents } from "../_components/live";
import { PushToggle } from "../_components/push-toggle";
import { StatusBadge } from "../_components/ui";

function Stat({ label, value, hint, href, Icon, tone }: { label: string; value: string | number; hint: string; href: string; Icon: typeof Car; tone: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-line bg-white p-4 transition hover:border-brand sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground sm:text-sm">{label}</p>
        <span className={cn("grid size-8 place-items-center rounded-lg", tone)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

export function OverviewView() {
  const { user } = useAdmin();
  const { summary } = useLive();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [pushOn, setPushOn] = useState(true);

  const load = useCallback(
    () =>
      Promise.all([api<Booking[]>("/bookings"), api<Inquiry[]>("/inquiries")]).then(
        ([b, i]) => {
          setBookings(b);
          setInquiries(i);
        },
        (err) => console.error("[overview]", err),
      ),
    [],
  );
  useEffect(() => {
    void load();
    // Only nudge about notifications on devices where they could be turned on.
    checkPush().then((s) => setPushOn(s !== "off"), () => setPushOn(true));
  }, [load]);
  useLiveEvents(useCallback(() => void load(), [load]));

  const pending = (bookings ?? []).filter((b) => b.status === "Pending").slice(0, 5);
  const fresh = (inquiries ?? []).filter((i) => i.status === "New").slice(0, 5);
  const units = summary?.units;
  const unitTotal = units ? Object.values(units).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Hi, {user.name.split(/\s+/)[0]}</h1>
        <p className="text-sm text-muted-foreground">What&apos;s happening with bookings and inquiries.</p>
      </div>

      {!pushOn && (
        <section aria-label="Notifications" className="mb-5 rounded-2xl border border-brand/30 bg-brand-50 p-4">
          <PushToggle onChange={(s) => setPushOn(s !== "off")} />
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="To confirm" value={summary?.pendingBookings ?? "…"} hint="Pending bookings" href="/admin/bookings" Icon={Hourglass} tone="bg-amber-50 text-amber-700" />
        <Stat label="New inquiries" value={summary?.newInquiries ?? "…"} hint="Waiting for a reply" href="/admin/inquiries" Icon={MessageSquareText} tone="bg-red-50 text-red-600" />
        <Stat label="Active rentals" value={summary?.activeBookings ?? "…"} hint="Approved or out" href="/admin/bookings" Icon={CalendarCheck} tone="bg-brand-50 text-brand-700" />
        <Stat
          label="Cars available"
          value={units ? `${units.Available}/${unitTotal}` : "…"}
          hint={units ? `${units.Booked} booked · ${units.Maintenance} in maintenance` : "Fleet units"}
          href="/admin/fleet?tab=units"
          Icon={Car}
          tone="bg-emerald-50 text-emerald-700"
        />
      </div>
      {summary && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wallet className="size-3.5" /> Completed bookings total {priceText(summary.completedRevenue)}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Bookings to confirm" href="/admin/bookings" empty={bookings && pending.length === 0 ? "No bookings waiting." : null}>
          {pending.map((b) => (
            <li key={b.id}>
              <Link href={`/admin/bookings?id=${b.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/60">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{b.customerName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {b.carLabel} · {formatDay(b.startDate)} · {b.days} day{b.days > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold">{priceText(b.totalPrice)}</span>
              </Link>
            </li>
          ))}
        </Panel>
        <Panel title="New inquiries" href="/admin/inquiries" empty={inquiries && fresh.length === 0 ? "No new inquiries." : null}>
          {fresh.map((i) => (
            <li key={i.id}>
              <Link href={`/admin/inquiries?id=${i.id}`} className="block px-4 py-3 hover:bg-muted/60">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold">{i.name}</span>
                  <StatusBadge status={i.status} />
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {i.topic} · {formatWhen(i.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, href, empty, children }: { title: string; href: string; empty: string | null; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold">{title}</h2>
        <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {empty ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p> : <ul className="divide-y divide-line">{children}</ul>}
    </section>
  );
}
