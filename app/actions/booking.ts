"use server";

import nodemailer from "nodemailer";
import { buildBookingEmail, type BookingDetails } from "@/lib/booking-email";
import { driverRate, estimateTrip, fleet, models, peso, places, zones, type VehicleId } from "@/lib/site";

export type BookingResult = { ok: true } | { ok: false; error: string };

const BOOKING_TO = process.env.BOOKING_EMAIL_TO || "alldrivebtc@gmail.com";

const str = (data: FormData, key: string, max = 200) => String(data.get(key) ?? "").trim().slice(0, max);

/** "2026-10-13T10:10" -> "Oct 13, 2026, 10:10 AM" without shifting time zones. */
function formatLocalDateTime(value: string) {
  const d = new Date(`${value}:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
}

export async function submitBooking(data: FormData): Promise<BookingResult> {
  // Spam guards: a hidden field real people never fill, and a minimum time on the form.
  if (str(data, "website")) return { ok: true };
  const startedAt = Number(data.get("startedAt"));
  if (!startedAt || Date.now() - startedAt < 3000) {
    return { ok: false, error: "Please take a moment to review your details, then try again." };
  }

  const name = str(data, "name", 100);
  const contact = str(data, "contact", 30);
  const address = str(data, "address");
  const work = str(data, "work");
  const purpose = str(data, "purpose", 500);
  const specificPlace = str(data, "place");
  const mode = str(data, "mode") === "driver" ? "driver" : "self";
  const days = Math.floor(Number(data.get("days")));
  const yearsDriving = str(data, "years", 3);
  const dateTime = formatLocalDateTime(str(data, "datetime", 20));
  const place = places.find((p) => p.id === str(data, "placeId"));
  const [vehicleId, modelId] = str(data, "car").split(":") as [VehicleId, string | undefined];
  const vehicle = fleet.find((v) => v.id === vehicleId);
  const model = models.find((m) => m.id === modelId && m.category === vehicleId);

  const missing = [
    !name && "name",
    contact.replace(/\D/g, "").length < 7 && "contact number",
    !address && "address",
    !work && "work place / business",
    !place && "destination",
    !dateTime && "date & time",
    !vehicle && "preferred car",
    !(days >= 1 && days <= 60) && "number of days",
    mode === "self" && !yearsDriving && "years of driving",
    !purpose && "purpose",
  ].filter(Boolean);
  if (missing.length || !place || !vehicle || !dateTime) {
    return { ok: false, error: `Please check: ${missing.join(", ")}.` };
  }

  // Recompute the estimate on the server instead of trusting the browser.
  const withDriver = mode === "driver";
  const { total } = estimateTrip(vehicle.id, place.zone, days, withDriver);
  const estimate =
    total == null
      ? `Rate on request${withDriver ? ` (+ ${peso(driverRate)}/day driver)` : ""}`
      : `${peso(total)}${withDriver ? ` (incl. ${peso(driverRate)}/day driver)` : ""}`;

  const details: BookingDetails = {
    name,
    contact,
    address,
    work,
    destination: place.name,
    zone: zones.find((z) => z.id === place.zone)!.label,
    specificPlace,
    dateTime,
    car: model ? `${model.name} (${vehicle.short})` : `Any ${vehicle.name} (${vehicle.seats})`,
    days,
    service: withDriver ? "With driver" : "Self-drive",
    yearsDriving: withDriver ? "N/A (with driver)" : yearsDriving,
    purpose,
    estimate,
  };

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.error("Booking email not sent: set GMAIL_USER and GMAIL_APP_PASSWORD.");
    return { ok: false, error: "Online booking is temporarily unavailable. Please text or message us instead." };
  }

  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    const { subject, text, html } = buildBookingEmail(details);
    await transporter.sendMail({ from: `"AllDrive Website" <${user}>`, to: BOOKING_TO, subject, text, html });
    return { ok: true };
  } catch (err) {
    console.error("Booking email failed:", err);
    return { ok: false, error: "We couldn't send your booking right now. Please text or message us instead." };
  }
}
