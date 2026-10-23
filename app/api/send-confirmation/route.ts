// Sends a booking's "approved" email from the website when the dashboard server can't (its host
// may block email, or Gmail isn't set up there). The admin's browser calls this right after
// approving. Everything is checked by the backend with the admin's own sign-in cookie: it only
// hands out the email for an approved booking, and only to a signed-in admin.
import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { site } from "@/lib/site";

const API_URL = (process.env.ALLDRIVE_API_URL || "").replace(/\/+$/, "");

const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

type Composed = { to: string; replyTo: string; subject: string; html: string; text: string };

export async function POST(req: NextRequest) {
  // Only from this site's own dashboard pages.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.nextUrl.host) return fail(403, "Not allowed.");

  const { id } = ((await req.json().catch(() => ({}))) ?? {}) as { id?: unknown };
  if (!Number.isInteger(id) || (id as number) < 1) return fail(400, "Invalid booking.");
  if (!API_URL) return fail(503, "The dashboard server isn't connected.");

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return fail(503, "Email is not set up on the website (GMAIL_USER / GMAIL_APP_PASSWORD in Vercel).");

  const headers = { cookie: req.headers.get("cookie") ?? "", "Content-Type": "application/json" };
  const backend = (path: string, init?: RequestInit) =>
    fetch(`${API_URL}/api/bookings/${id}/${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(15_000) });

  // 1. The finished email, from the dashboard (checks sign-in and that it's approved).
  const composed = await backend("confirmation-email").catch(() => null);
  if (!composed) return fail(502, "Couldn't reach the dashboard server.");
  const email = (await composed.json().catch(() => null)) as (Composed & { message?: string }) | null;
  if (!composed.ok || !email?.to) return fail(composed.status || 502, email?.message || "Couldn't prepare the email.");

  // 2. Send it with the website's Gmail (or another provider via SMTP_HOST, as on the server).
  const smtpHost = process.env.SMTP_HOST;
  const transport = smtpHost
    ? nodemailer.createTransport({ host: smtpHost, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === "true", auth: { user, pass } })
    : nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  try {
    await transport.sendMail({
      from: `"${site.legalName}" <${user}>`,
      to: email.to,
      replyTo: email.replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (err) {
    console.error(`Approval email for booking ${id} failed:`, err);
    return fail(502, "Couldn't send the email. Check the address, or try again.");
  }

  // 3. Record it on the booking. The email already went out, so a failure here only affects the
  //    "emailed at" note.
  const recorded = await backend("confirmation-email/sent", { method: "POST", body: JSON.stringify({ to: email.to }) }).catch(() => null);
  const booking = recorded?.ok ? await recorded.json().catch(() => null) : null;
  return NextResponse.json(booking ?? { confirmationEmail: { sent: true, to: email.to } });
}
