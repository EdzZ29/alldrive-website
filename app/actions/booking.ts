"use server";

import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { buildBookingEmail, buildCustomerEmail, type BookingDetails, type BookingMeta, type BusinessContact } from "@/lib/booking-email";
import { buildCustomerSms, buildOwnerSms, sendSms, toPhMobile } from "@/lib/booking-sms";
import { dashboardConfigured, sendBookingToDashboard } from "@/lib/dashboard";
import { createRateLimiter } from "@/lib/rate-limit";
import { peso, places, site, zones, type VehicleId } from "@/lib/site";
import { getCatalog } from "@/lib/catalog";

export type BookingResult = { ok: true } | { ok: false; error: string };

const BOOKING_TO = process.env.BOOKING_EMAIL_TO || "alldrivebtc@gmail.com";
// Team numbers that get a text for every booking (defaults to the call numbers on the site).
const SMS_TO = (process.env.BOOKING_SMS_TO || site.phones.map((p) => p.display).join(","))
  .split(",")
  .map((n) => toPhMobile(n))
  .filter((n): n is string => n !== null);
const SMS_CONFIRM_CUSTOMER = process.env.BOOKING_SMS_CONFIRM_CUSTOMER !== "false";
// The customer's "we received your booking" email. (The "confirmed" email comes from the
// dashboard when an admin approves the booking.)
const EMAIL_CONFIRM_CUSTOMER = process.env.BOOKING_EMAIL_CONFIRM_CUSTOMER !== "false";

// Each booking sends emails and paid texts, so one visitor can only send a few in a row.
const isRateLimited = createRateLimiter(5);

const str = (data: FormData, key: string, max = 200) => String(data.get(key) ?? "").trim().slice(0, max);

/**
 * "2026-10-13T10:10" -> "Oct 13, 2026, 10:10 AM" without shifting time zones.
 * `addDays` gives the return date for an n-day rental.
 */
function formatLocalDateTime(value: string, addDays = 0) {
  const d = new Date(`${value}:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
}

const business: BusinessContact = {
  name: site.legalName,
  phones: site.phones,
  whatsappNumber: site.whatsappNumber,
  messenger: site.messenger,
  address: site.address.full,
  directionsUrl: site.directionsUrl,
};

/** Short, easy-to-read booking reference, e.g. "AD-1013-7K2Q" (no 0/O or 1/I mix-ups). */
function bookingReference() {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => chars[b % chars.length]).join("");
  const date = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", timeZone: "Asia/Manila" }).replace("/", "");
  return `AD-${date}-${random}`;
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
  const customerEmail = str(data, "email", 120);
  const address = str(data, "address");
  const work = str(data, "work");
  const purpose = str(data, "purpose", 500);
  const specificPlace = str(data, "place");
  const mode = str(data, "mode") === "driver" ? "driver" : "self";
  const days = Math.floor(Number(data.get("days")));
  const yearsDriving = str(data, "years", 3);
  const rawDateTime = str(data, "datetime", 20);
  const dateTime = formatLocalDateTime(rawDateTime);
  const place = places.find((p) => p.id === str(data, "placeId"));
  // Same fleet and prices the visitor saw (as edited in the admin dashboard).
  const { fleet, models, driverRate, estimateTrip } = await getCatalog();
  const [vehicleId, modelId] = str(data, "car").split(":") as [VehicleId, string | undefined];
  const vehicle = fleet.find((v) => v.id === vehicleId);
  const model = models.find((m) => m.id === modelId && m.category === vehicleId);

  const missing = [
    !name && "name",
    contact.replace(/\D/g, "").length < 7 && "contact number",
    customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) && "email address",
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

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(ip)) {
    return { ok: false, error: "You've sent several bookings already. Please call or text us to add another." };
  }

  // Recompute the estimate on the server instead of trusting the browser.
  const withDriver = mode === "driver";
  const { total } = estimateTrip(vehicle.id, place.zone, days, withDriver, model?.id);
  const estimate =
    total == null
      ? `Rate on request${withDriver ? ` (+ ${peso(driverRate)}/day driver)` : ""}`
      : `${peso(total)}${withDriver ? ` (incl. ${peso(driverRate)}/day driver)` : ""}`;

  const details: BookingDetails = {
    name,
    contact,
    email: customerEmail,
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
  const meta: BookingMeta = {
    reference: bookingReference(),
    receivedAt: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }),
    returnDateTime: formatLocalDateTime(rawDateTime, days)!,
  };

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const smsKey = process.env.SEMAPHORE_API_KEY;
  const smsSender = process.env.SEMAPHORE_SENDER_NAME || undefined;
  if (!dashboardConfigured) console.error("Booking not saved to the dashboard: set ALLDRIVE_API_URL and ALLDRIVE_API_KEY.");
  if (!smsKey) console.error("Booking SMS not sent: set SEMAPHORE_API_KEY.");
  if (!dashboardConfigured && (!user || !pass)) console.error("Backup booking email not possible: set GMAIL_USER and GMAIL_APP_PASSWORD.");
  if (!dashboardConfigured && (!user || !pass) && !smsKey) {
    return { ok: false, error: "Online booking is temporarily unavailable. Please text or message us instead." };
  }

  const transporter = user && pass ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } }) : null;

  // Bookings go to the admin dashboard (plus the team SMS, if set up). The team Gmail only gets
  // the booking as a backup when the dashboard can't be reached, so nothing is lost.
  const [dashboard, sms] = await Promise.allSettled([
    dashboardConfigured
      ? sendBookingToDashboard({
          reference: meta.reference,
          name,
          contact,
          ...(customerEmail && { email: customerEmail }),
          address,
          work,
          destination: place.name,
          zone: details.zone,
          ...(specificPlace && { specificPlace }),
          pickup: rawDateTime,
          days,
          driveType: withDriver ? "With Driver" : "Self Drive",
          ...(!withDriver && { yearsDriving: Math.floor(Number(yearsDriving)) || 0 }),
          carCategory: vehicle.id,
          ...(model && { carModel: model.id }),
          carLabel: details.car,
          purpose,
          ...(total != null && { estimatedTotal: total }),
          estimateText: estimate,
        })
      : Promise.reject(new Error("Dashboard not configured")),
    smsKey ? sendSms(smsKey, SMS_TO, buildOwnerSms(details), smsSender) : Promise.reject(new Error("SMS not configured")),
  ]);
  if (dashboard.status === "rejected" && dashboardConfigured) console.error("Booking dashboard save failed:", dashboard.reason);

  // Backup only: email the booking to the team if the dashboard didn't get it.
  const [email] = await Promise.allSettled([
    dashboard.status === "fulfilled"
      ? Promise.reject(new Error("Not needed: the dashboard has it"))
      : transporter
        ? transporter.sendMail({
            from: `"AllDrive Website" <${user}>`,
            to: BOOKING_TO,
            // "Reply" in Gmail goes straight to the customer when they left an email.
            ...(customerEmail && { replyTo: customerEmail }),
            ...buildBookingEmail(details, meta, business),
          })
        : Promise.reject(new Error("Gmail not configured")),
  ]);
  if (dashboard.status === "rejected" && email.status === "rejected") console.error("Backup booking email failed:", email.reason);
  if (sms.status === "rejected" && smsKey) console.error("Booking SMS failed:", sms.reason);
  if (dashboard.status === "rejected" && email.status === "rejected" && sms.status === "rejected") {
    return { ok: false, error: "We couldn't send your booking right now. Please text or message us instead." };
  }

  // Let the customer know it arrived. A failure here shouldn't undo a booking the team already has.
  const callNumber = site.phones[0].display;
  const customerNumber = toPhMobile(contact);
  const confirmations = await Promise.allSettled([
    smsKey && SMS_CONFIRM_CUSTOMER && customerNumber
      ? sendSms(smsKey, [customerNumber], buildCustomerSms(details, callNumber), smsSender)
      : null,
    transporter && customerEmail && EMAIL_CONFIRM_CUSTOMER
      ? transporter.sendMail({
          from: `"${site.legalName}" <${user}>`,
          to: customerEmail,
          replyTo: BOOKING_TO,
          ...buildCustomerEmail(details, meta, business),
        })
      : null,
  ]);
  confirmations.forEach((r, i) => {
    if (r.status === "rejected") console.error(`Customer confirmation ${i ? "email" : "SMS"} failed:`, r.reason);
  });

  return { ok: true };
}
