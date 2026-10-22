// Sends website bookings and inquiries to the AllDrive admin dashboard (the all-drive-backend
// API). Import only from server code (server actions, route handlers): the shared key must
// never reach the browser (it has no NEXT_PUBLIC_ prefix, so Next won't bundle it anyway).

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

/** A dashboard reply other than 2xx. `status` lets callers tell "not found" from an outage. */
export class DashboardError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DashboardError";
  }
}

async function request<T = unknown>(path: string, body?: unknown): Promise<T> {
  if (!dashboardConfigured) throw new Error("Dashboard not configured: set ALLDRIVE_API_URL and ALLDRIVE_API_KEY");
  const res = await fetch(`${API_URL}/api/website/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", "x-website-key": API_KEY },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new DashboardError(`Dashboard ${res.status}: ${await res.text().catch(() => "")}`, res.status);
  return (await res.json().catch(() => null)) as T;
}

export const sendBookingToDashboard = (booking: DashboardBooking) => request("bookings", booking);
export const sendInquiryToDashboard = (inquiry: DashboardInquiry) => request("inquiries", inquiry);

// ---------- Track my booking ----------

/** What a customer sees about their own booking (mirrors BookingsService.track). */
export type TrackedBooking = {
  reference: string;
  customerName: string;
  status: "Pending" | "Approved" | "Declined" | "Returned" | "Completed" | "Cancelled";
  carLabel: string;
  assignedCar: string | null;
  startDate: string;
  endDate: string;
  pickupTime: string | null;
  days: number;
  driveType: string;
  destination: string;
  specificPlace: string | null;
  handover: "Pickup" | "Delivery";
  location: string | null;
  totalPrice: string | number | null;
  estimateText: string;
  paymentStatus: string;
  createdAt: string;
};

/** null when no booking matches the code and email/number. */
export async function trackBookingInDashboard(reference: string, contact: string) {
  try {
    return await request<TrackedBooking>("bookings/track", { reference, contact });
  } catch (err) {
    if (err instanceof DashboardError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

// ---------- Live chat ----------

type ChatMessageInput = { sender: "visitor" | "auto"; body: string };
type ChatMessageOut = { id: number; sender: "visitor" | "admin" | "auto"; body: string; createdAt: string };

export const startChatInDashboard = (chat: { name: string; contact: string; page?: string; messages: ChatMessageInput[] }) =>
  request<{ token: string; messages: ChatMessageOut[] }>("chats", chat);

export const addChatMessagesInDashboard = (token: string, messages: ChatMessageInput[]) =>
  request<{ messages: ChatMessageOut[] }>(`chats/${encodeURIComponent(token)}/messages`, { messages });

export const pollChatInDashboard = (token: string, after: number) =>
  request<{ status: "Open" | "Closed"; messages: ChatMessageOut[] }>(`chats/${encodeURIComponent(token)}?after=${after}`);
