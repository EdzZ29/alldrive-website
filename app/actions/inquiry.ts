"use server";

import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { dashboardConfigured, sendInquiryToDashboard } from "@/lib/dashboard";
import { createRateLimiter } from "@/lib/rate-limit";
import { inquiryTopics, site } from "@/lib/site";

export type InquiryResult = { ok: true } | { ok: false; error: string };

const INQUIRY_TO = process.env.BOOKING_EMAIL_TO || "alldrivebtc@gmail.com";

const isRateLimited = createRateLimiter(5);

const str = (data: FormData, key: string, max = 200) => String(data.get(key) ?? "").trim().slice(0, max);

/** Contact-form inquiry: saved to the admin dashboard, with an email to the team as backup. */
export async function submitInquiry(data: FormData): Promise<InquiryResult> {
  // Same spam guards as the booking form: a hidden honeypot field and a minimum time on the form.
  if (str(data, "website")) return { ok: true };
  const startedAt = Number(data.get("startedAt"));
  if (!startedAt || Date.now() - startedAt < 3000) {
    return { ok: false, error: "Please take a moment to finish your message, then try again." };
  }

  const name = str(data, "name", 100);
  const contact = str(data, "contact", 30);
  const email = str(data, "email", 120);
  const topic = inquiryTopics.find((t) => t === str(data, "topic", 60));
  const message = str(data, "message", 2000);
  const page = str(data, "page", 120);

  const missing = [
    !name && "name",
    contact.replace(/\D/g, "").length < 7 && "contact number",
    email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && "email address",
    !topic && "topic",
    !message && "message",
  ].filter(Boolean);
  if (missing.length || !topic) {
    return { ok: false, error: `Please check: ${missing.join(", ")}.` };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(ip)) {
    return { ok: false, error: "You've sent several messages already. Please call or text us instead." };
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!dashboardConfigured) console.error("Inquiry not saved to the dashboard: set ALLDRIVE_API_URL and ALLDRIVE_API_KEY.");
  if (!dashboardConfigured && (!user || !pass)) {
    return { ok: false, error: "Our message form is temporarily unavailable. Please text or message us instead." };
  }

  const [dashboard] = await Promise.allSettled([
    dashboardConfigured
      ? sendInquiryToDashboard({ name, contact, ...(email && { email }), topic, message, ...(page && { page }) })
      : Promise.reject(new Error("Dashboard not configured")),
  ]);
  if (dashboard.status === "fulfilled") return { ok: true };
  if (dashboardConfigured) console.error("Inquiry dashboard save failed:", dashboard.reason);

  // Backup only: email the team if the dashboard didn't get the inquiry.
  const [mail] = await Promise.allSettled([
    user && pass
      ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } }).sendMail({
          from: `"AllDrive Website" <${user}>`,
          to: INQUIRY_TO,
          ...(email && { replyTo: email }),
          subject: `New inquiry: ${topic} (${name})`,
          text: [
            `NEW INQUIRY from the ${site.legalName} website`,
            "",
            `Name: ${name}`,
            `Contact #: ${contact}`,
            `Email: ${email || "Not provided"}`,
            `Topic: ${topic}`,
            ...(page ? [`Sent from: ${page}`] : []),
            "",
            message,
          ].join("\n"),
        })
      : Promise.reject(new Error("Gmail not configured")),
  ]);
  if (mail.status === "rejected" && user && pass) console.error("Backup inquiry email failed:", mail.reason);
  if (mail.status === "rejected") {
    return { ok: false, error: "We couldn't send your message right now. Please text or message us instead." };
  }

  return { ok: true };
}
