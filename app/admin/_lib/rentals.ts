// Where approved bookings stand by date: pickup day, out on rent, return day. Dates are plain
// "YYYY-MM-DD" calendar days in Philippine time (a booking's endDate is its return day).
import { formatTime, type Booking } from "./api";
import type { Tone } from "../_components/ui";

/** Today in the Philippines, e.g. "2026-10-24". */
export const todayPH = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

/** "2026-10-30" + 3 -> "2026-11-02". */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-10-26" -> "Oct 26". */
export const shortDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });

export type RentalKind = "overdue" | "due-today" | "pickup-today" | "on-rent" | "reserved";

// Most urgent first: what a unit's badge shows when it has more than one booking.
const URGENCY: RentalKind[] = ["overdue", "due-today", "pickup-today", "on-rent", "reserved"];

export function rentalKind(b: Pick<Booking, "startDate" | "endDate">, today: string): RentalKind {
  if (b.endDate < today) return "overdue";
  if (b.endDate === today) return "due-today";
  if (b.startDate === today) return "pickup-today";
  return b.startDate < today ? "on-rent" : "reserved";
}

/** A unit's state today from its approved bookings (sorted by pickup), or null when it has none. */
export function unitRental(bookings: Booking[], today: string) {
  let best: { kind: RentalKind; booking: Booking } | null = null;
  for (const booking of bookings) {
    const kind = rentalKind(booking, today);
    if (!best || URGENCY.indexOf(kind) < URGENCY.indexOf(best.kind)) best = { kind, booking };
  }
  return best;
}

export function rentalLabel(kind: RentalKind, b: Booking): { text: string; tone: Tone } {
  const at = b.pickupTime ? ` ${formatTime(b.pickupTime)}` : "";
  switch (kind) {
    case "overdue":
      return { text: `Overdue · was due ${shortDay(b.endDate)}`, tone: "red" };
    case "due-today":
      return { text: `Due back today${at}`, tone: "amber" };
    case "pickup-today":
      return { text: `Pickup today${at}`, tone: "green" };
    case "on-rent":
      return { text: `On rent · back ${shortDay(b.endDate)}`, tone: "blue" };
    case "reserved":
      return { text: `Reserved · pickup ${shortDay(b.startDate)}`, tone: "violet" };
  }
}
