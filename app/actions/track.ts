"use server";

import { headers } from "next/headers";
import { dashboardConfigured, trackBookingInDashboard, type TrackedBooking } from "@/lib/dashboard";
import { createRateLimiter } from "@/lib/rate-limit";

export type TrackResult = { ok: true; booking: TrackedBooking } | { ok: false; error: string };

// Enough for typos, too few to guess booking codes.
const isRateLimited = createRateLimiter(15);

/** "Track my booking": the booking code plus the email or mobile number used to book. */
export async function trackBooking(data: FormData): Promise<TrackResult> {
  const reference = String(data.get("reference") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 30);
  const contact = String(data.get("contact") ?? "")
    .trim()
    .slice(0, 120);
  if (reference.length < 4 || contact.length < 3) {
    return { ok: false, error: "Please enter your booking code and the email or mobile number you booked with." };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(ip)) {
    return { ok: false, error: "Too many tries. Please wait a few minutes, or call or text us." };
  }
  if (!dashboardConfigured) {
    return { ok: false, error: "Booking tracking is unavailable right now. Please call or text us." };
  }

  try {
    const booking = await trackBookingInDashboard(reference, contact);
    return booking
      ? { ok: true, booking }
      : {
          ok: false,
          error: "We couldn't find a booking with that code and email or number. Check the code in your booking email or text.",
        };
  } catch (err) {
    console.error("Track booking failed:", err);
    return { ok: false, error: "We couldn't check your booking right now. Please try again, or call or text us." };
  }
}
