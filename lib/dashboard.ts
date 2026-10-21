// Sends website bookings and inquiries to the AllDrive admin dashboard (the all-drive-backend
// API). Import only from server actions: the shared key must never reach the browser (it has
// no NEXT_PUBLIC_ prefix, so Next won't bundle it for the client anyway).

const API_URL = (process.env.ALLDRIVE_API_URL || "").replace(/\/+$/, "");
const API_KEY = process.env.ALLDRIVE_API_KEY || "";

export const dashboardConfigured = Boolean(API_URL && API_KEY);

/** What the booking form sends; mirrors CreateBookingDto in all-drive-backend. */
export type DashboardBooking = {
  reference: string;
  name: string;
  contact: string;
  email?: string;
  address: string;
  work: string;
  destination: string;
  zone: string;
  specificPlace?: string;
  /** Local Philippine date & time, e.g. "2026-10-21T10:00". */
  pickup: string;
  days: number;
  driveType: "Self Drive" | "With Driver";
  yearsDriving?: number;
  carCategory: string;
  carModel?: string;
  carLabel: string;
  purpose: string;
  /** Omitted when the rate is on request. */
  estimatedTotal?: number;
  estimateText: string;
};

/** What the contact form sends; mirrors CreateInquiryDto in all-drive-backend. */
export type DashboardInquiry = {
  name: string;
  contact: string;
  email?: string;
  topic: string;
  message: string;
  page?: string;
};

async function post(path: string, body: unknown) {
  if (!dashboardConfigured) throw new Error("Dashboard not configured: set ALLDRIVE_API_URL and ALLDRIVE_API_KEY");
  const res = await fetch(`${API_URL}/api/website/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-website-key": API_KEY },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Dashboard ${res.status}: ${await res.text().catch(() => "")}`);
}

export const sendBookingToDashboard = (booking: DashboardBooking) => post("bookings", booking);
export const sendInquiryToDashboard = (inquiry: DashboardInquiry) => post("inquiries", inquiry);
