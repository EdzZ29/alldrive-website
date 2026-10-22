"use client";

import { useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarCheck, CircleAlert, CircleCheck, CircleX, Clock, Loader2, Phone, Search, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { site, whatsappLink } from "@/lib/site";
import type { TrackedBooking } from "@/lib/dashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackBooking } from "../actions/track";
import { WhatsAppIcon } from "../_components/brand";

const noop = () => () => {};
// No submitting before hydration: a native submit would put the details in the URL.
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/** "2026-10-25" -> "Sat, Oct 25, 2026" (no time zone shifts). */
function day(date: string) {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** "14:30" -> "2:30 PM". */
function time(value: string | null) {
  const m = value && /^(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

const price = (b: TrackedBooking) =>
  b.totalPrice != null && b.totalPrice !== ""
    ? `₱${Number(b.totalPrice).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`
    : b.estimateText || "To be confirmed";

const STATUS: Record<TrackedBooking["status"], { title: string; note: (b: TrackedBooking) => string; tone: string; Icon: typeof Clock }> = {
  Pending: {
    title: "Waiting for confirmation",
    note: () => "We received your booking. Our team will call or text you to confirm the car and the final rate.",
    tone: "bg-amber-50 text-amber-800 ring-amber-200",
    Icon: Clock,
  },
  Approved: {
    title: "Booking confirmed",
    note: (b) => `Your car is reserved. See you on ${day(b.startDate)}${b.pickupTime ? ` at ${time(b.pickupTime)}` : ""}!`,
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    Icon: CircleCheck,
  },
  Returned: {
    title: "Car returned",
    note: () => "Thanks for renting with us! We're wrapping up your booking.",
    tone: "bg-sky-50 text-sky-800 ring-sky-200",
    Icon: Undo2,
  },
  Completed: {
    title: "Completed",
    note: () => `Thank you for renting with ${site.legalName}!`,
    tone: "bg-sky-50 text-sky-800 ring-sky-200",
    Icon: CalendarCheck,
  },
  Declined: {
    title: "Not confirmed",
    note: () => "We couldn't confirm this booking. Please call or text us and we'll help you find another car or date.",
    tone: "bg-red-50 text-red-800 ring-red-200",
    Icon: CircleX,
  },
  Cancelled: {
    title: "Cancelled",
    note: () => "This booking was cancelled. Need a car? Book again or contact us.",
    tone: "bg-muted text-ink ring-line",
    Icon: CircleX,
  },
};

export function TrackForm() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const [booking, setBooking] = useState<TrackedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await trackBooking(data);
      if (result.ok) setBooking(result.booking);
      else setError(result.error);
    });
  };

  if (booking) return <Result booking={booking} onBack={() => setBooking(null)} />;

  return (
    <Card className="gap-5 rounded-[1.75rem] border border-line bg-white p-7 ring-0">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Find your booking</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your booking code is in the email or text we sent when you booked, e.g. <span className="font-semibold text-ink">AD-1020-3E6B</span>.
        </p>
      </div>
      <form method="post" onSubmit={submit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="track-ref" className="font-semibold">
            Booking code
          </Label>
          <Input
            id="track-ref"
            name="reference"
            required
            maxLength={30}
            defaultValue={params.get("ref") ?? ""}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="AD-1020-3E6B"
            className="h-12 rounded-xl bg-white font-semibold tracking-wide uppercase placeholder:font-normal placeholder:normal-case"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="track-contact" className="font-semibold">
            Email or mobile number <span className="font-normal text-muted-foreground">(the one you booked with)</span>
          </Label>
          <Input id="track-contact" name="contact" required maxLength={120} autoComplete="email" placeholder="you@example.com or 0917 123 4567" className="h-12 rounded-xl bg-white" />
        </div>
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}
        <Button type="submit" variant="brand-light" size="xl" disabled={pending || !hydrated} className="w-full sm:w-fit">
          {pending ? <Loader2 className="animate-spin" /> : <Search />} Track my booking
        </Button>
      </form>
    </Card>
  );
}

function Result({ booking: b, onBack }: { booking: TrackedBooking; onBack: () => void }) {
  const s = STATUS[b.status];
  const rows: [string, string][] = [
    ["Car", b.assignedCar ? `${b.assignedCar} (${b.carLabel})` : b.carLabel],
    ["Pickup", `${day(b.startDate)}${b.pickupTime ? `, ${time(b.pickupTime)}` : ""}`],
    ["Return", day(b.endDate)],
    ["Duration", `${b.days} day${b.days > 1 ? "s" : ""}`],
    ["Service", b.driveType],
    ["Destination", b.specificPlace ? `${b.destination} (${b.specificPlace})` : b.destination],
    ["Handover", b.handover === "Delivery" ? `Delivery${b.location ? ` to ${b.location}` : ""}` : `Pick up${b.location ? ` at ${b.location}` : " at our office"}`],
    ["Total", price(b)],
    ["Payment", b.paymentStatus],
  ];

  return (
    <Card className="gap-5 rounded-[1.75rem] border border-line bg-white p-7 ring-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Booking <span className="font-bold text-ink">{b.reference}</span> · {b.customerName}
        </p>
      </div>
      <div className={cn("flex items-start gap-3 rounded-2xl p-4 ring-1", s.tone)}>
        <s.Icon className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight">{s.title}</h2>
          <p className="mt-1 text-sm">{s.note(b)}</p>
        </div>
      </div>
      <dl className="divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[7rem_1fr] gap-3 py-2.5 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="ink" size="md">
          <a href={`tel:${site.phoneHref}`}>
            <Phone /> Call {site.phones[0].display}
          </a>
        </Button>
        <Button asChild variant="outline" size="md" className="rounded-xl border-line">
          <a href={whatsappLink(`Hi AllDrive! About my booking ${b.reference}:`)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-4!" /> WhatsApp us
          </a>
        </Button>
        <Button variant="outline" size="md" onClick={onBack} className="rounded-xl border-line sm:ml-auto">
          Track another booking
        </Button>
      </div>
    </Card>
  );
}
