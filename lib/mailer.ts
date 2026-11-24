// The one email account the website sends from: bookings and inquiries to the team, and the
// customer's "received" and "approved" emails. Server-only.
import nodemailer from "nodemailer";

export const mailUser = process.env.GMAIL_USER || "";

/** The team inbox: new bookings and inquiries arrive here (and customers' replies). */
export const teamInbox = process.env.BOOKING_EMAIL_TO || "alldrivebtc@gmail.com";

/** null when GMAIL_USER / GMAIL_APP_PASSWORD aren't set. */
export function mailer() {
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!mailUser || !pass) return null;
  // Gmail by default; SMTP_HOST switches to another provider with the same login.
  const host = process.env.SMTP_HOST;
  return host
    ? nodemailer.createTransport({ host, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === "true", auth: { user: mailUser, pass } })
    : nodemailer.createTransport({ service: "gmail", auth: { user: mailUser, pass } });
}
