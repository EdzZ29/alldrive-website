"use server";

import { readApprovalToken } from "@/lib/approval";
import { buildApprovedEmail, type ApprovedBooking, type BusinessContact } from "@/lib/booking-email";
import { mailer, mailUser, teamInbox } from "@/lib/mailer";
import { rentalRequirements, site } from "@/lib/site";

export type ApprovalResult = { ok: true; to: string; sentAt: string } | { ok: false; error: string };

const business: BusinessContact = {
  name: site.legalName,
  phones: site.phones,
  whatsappNumber: site.whatsappNumber,
  messenger: site.messenger,
  address: site.address.full,
  directionsUrl: site.directionsUrl,
};

const str = (data: FormData, key: string, max: number) => String(data.get(key) ?? "").trim().slice(0, max);

/**
 * Emails the customer "Your booking is approved". Only works with a token from a booking email
 * this site sent (signed; see lib/approval.ts). The team inbox gets a copy as the record.
 */
export async function sendApproval(token: string, data: FormData): Promise<ApprovalResult> {
  const check = readApprovalToken(token);
  if (!check.ok) {
    return { ok: false, error: check.reason === "expired" ? "This approval link has expired." : "This approval link isn't valid." };
  }
  const b = check.booking;
  if (!b.email) return { ok: false, error: "This customer didn't leave an email. Send the text message instead." };

  const approved: ApprovedBooking = {
    reference: b.reference,
    name: b.name,
    car: str(data, "car", 160) || b.car,
    pickup: b.pickup,
    returnAt: b.returnAt,
    days: b.days,
    service: b.service,
    destination: b.destination,
    total: str(data, "total", 120) || b.estimate,
    handover: str(data, "handover", 200) || "Pick up at our office",
    note: str(data, "note", 1000),
  };

  const transporter = mailer();
  if (!transporter) return { ok: false, error: "Email isn't set up on the website (GMAIL_USER / GMAIL_APP_PASSWORD)." };
  try {
    await transporter.sendMail({
      from: `"${site.legalName}" <${mailUser}>`,
      to: b.email,
      replyTo: teamInbox,
      // The team's record that this booking was approved, and with what details.
      bcc: teamInbox,
      ...buildApprovedEmail(approved, business, rentalRequirements),
    });
  } catch (err) {
    console.error(`Approval email for ${b.reference} failed:`, err);
    return { ok: false, error: "Couldn't send the email. Please try again." };
  }
  return {
    ok: true,
    to: b.email,
    sentAt: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }),
  };
}
