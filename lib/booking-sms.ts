// Booking text messages, sent through Semaphore (https://semaphore.co), a Philippine SMS gateway.
// Kept free of app imports so it can be tested on its own.

import type { BookingDetails } from "@/lib/booking-email";

const SEMAPHORE_URL = "https://api.semaphore.co/api/v4/messages";

/**
 * "0917 123 4567", "+63 917 123 4567", "9171234567" -> "09171234567".
 * Returns null for anything that isn't a PH mobile number.
 */
export function toPhMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("63") ? `0${digits.slice(2)}` : digits.startsWith("9") ? `0${digits}` : digits;
  return /^09\d{9}$/.test(local) ? local : null;
}

// "₱" isn't in the basic SMS alphabet; one such character makes every text cost twice as many credits.
const smsSafe = (s: string) => s.replace(/₱\s*/g, "PHP ");

/** Alert for the AllDrive team. Short on purpose; the full details are in the booking email. */
export function buildOwnerSms(d: BookingDetails) {
  return smsSafe(
    [
      "NEW ALLDRIVE BOOKING",
      `${d.name} - ${d.contact}`,
      `${d.car}, ${d.days} day${d.days > 1 ? "s" : ""}, ${d.service}`,
      `Pickup: ${d.dateTime}`,
      `To: ${d.specificPlace ? `${d.destination} (${d.specificPlace})` : d.destination}`,
      `Est: ${d.estimate}`,
    ].join("\n"),
  );
}

/** Confirmation for the customer that their booking request arrived. */
export function buildCustomerSms(d: BookingDetails, callNumber: string) {
  const firstName = d.name.split(/\s+/)[0];
  return smsSafe(
    `AllDrive: Hi ${firstName}, we received your booking for ${d.car} on ${d.dateTime}. ` +
      `We'll contact you soon to confirm. Call ${callNumber}.`,
  );
}

/** Sends one message to one or more numbers. Throws if Semaphore rejects it. */
export async function sendSms(apiKey: string, numbers: string[], message: string, senderName?: string) {
  const body = new URLSearchParams({ apikey: apiKey, number: numbers.join(","), message });
  if (senderName) body.set("sendername", senderName);

  const res = await fetch(SEMAPHORE_URL, { method: "POST", body, signal: AbortSignal.timeout(10_000) });
  const result: unknown = await res.json().catch(() => null);
  // Success is a list of queued messages; errors come back as an object or string.
  if (!res.ok || !Array.isArray(result)) {
    throw new Error(`Semaphore ${res.status}: ${JSON.stringify(result)}`);
  }
}
