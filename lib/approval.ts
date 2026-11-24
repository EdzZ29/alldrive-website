// Booking approval without a database: the team's booking email has an "Approve booking" button
// whose link carries the booking itself, signed with a server-only secret. The /approve page
// checks the signature, so only links this site wrote can send a "Booking approved" email.
// Server-only: never import this from a client component.
import { createHmac, timingSafeEqual } from "node:crypto";
import { site } from "./site";

/** What the approval page and the "Booking approved" email need. */
export type ApprovalBooking = {
  reference: string;
  name: string;
  contact: string;
  /** Empty when the customer didn't leave one. */
  email: string;
  car: string;
  /** "Oct 13, 2026, 10:10 AM" */
  pickup: string;
  /** "Oct 15, 2026, 10:10 AM" */
  returnAt: string;
  days: number;
  service: "Self-drive" | "With driver";
  destination: string;
  estimate: string;
};

type Signed = ApprovalBooking & { exp: number };

// Links stop working this long after the booking came in.
const VALID_DAYS = 120;

// A dedicated secret, or else one derived from the Gmail app password (already set for the
// booking emails). Changing either one makes older approval links stop working.
function key() {
  const secret = process.env.BOOKING_APPROVE_SECRET || process.env.GMAIL_APP_PASSWORD;
  return secret ? createHmac("sha256", "alldrive-booking-approval").update(secret).digest() : null;
}

const sign = (body: string, k: Buffer) => createHmac("sha256", k).update(body).digest("base64url");

export const approvalConfigured = () => key() !== null;

/** The "Approve booking" link for the team email, or null when no secret is set. */
export function approvalLink(booking: ApprovalBooking) {
  const k = key();
  if (!k) return null;
  const body = Buffer.from(JSON.stringify({ ...booking, exp: Date.now() + VALID_DAYS * 86_400_000 } satisfies Signed)).toString("base64url");
  return `${site.url}/approve?t=${body}.${sign(body, k)}`;
}

export type ApprovalCheck = { ok: true; booking: ApprovalBooking } | { ok: false; reason: "invalid" | "expired" };

/** Checks a link's token. Only tokens signed by this site pass. */
export function readApprovalToken(token: string | undefined | null): ApprovalCheck {
  const k = key();
  const [body, mac, extra] = (token ?? "").split(".");
  if (!k || !body || !mac || extra !== undefined || body.length > 8000) return { ok: false, reason: "invalid" };
  const expected = Buffer.from(sign(body, k));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "invalid" };
  let data: Signed;
  try {
    data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Signed;
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!(data.exp > Date.now())) return { ok: false, reason: "expired" };
  const booking: ApprovalBooking & { exp?: number } = { ...data };
  delete booking.exp;
  return { ok: true, booking };
}
