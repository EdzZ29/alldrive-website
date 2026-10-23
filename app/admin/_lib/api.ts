// Browser-side client for the AllDrive backend, used only by the admin dashboard. Requests go to
// this site's /api, which next.config.ts forwards to the backend, so the httpOnly login cookie
// is sent automatically.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** JSON request, or a file upload when `form` is given. */
export async function api<T>(path: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? (init.form ? "POST" : "GET"),
      credentials: "same-origin",
      cache: "no-store",
      // FormData sets its own multipart Content-Type.
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.form ?? (init.body === undefined ? undefined : JSON.stringify(init.body)),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your internet connection.", 0);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Not JSON (e.g. an HTML 404 when the backend isn't connected).
  }

  if (!res.ok) {
    const payload = data as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message;
    throw new ApiError(
      message || (res.status === 404 ? "The dashboard server isn't connected yet." : `Request failed (${res.status})`),
      res.status,
    );
  }
  return data as T;
}

export const errorText = (err: unknown, fallback = "Something went wrong. Please try again.") =>
  err instanceof ApiError ? err.message : fallback;

// --- Shapes returned by the backend (all-drive-backend entities) ----------------------------

/** One page of a list, plus how many items each filter tab has. */
export type Paged<T, F extends string = string> = { items: T[]; total: number; page: number; limit: number; counts?: Record<F, number> };

export type User = { id: number; name: string; email: string; phone: string | null; role: "admin"; isActive: boolean; createdAt: string };

export type BookingStatus = "Pending" | "Approved" | "Declined" | "Returned" | "Completed" | "Cancelled";
export type PaymentStatus = "Unpaid" | "Down Payment" | "Fully Paid";
export type PaymentMethod = "GCash" | "Maya" | "Bank Transfer" | "Cash";

export type UnitStatus = "Available" | "Booked" | "Maintenance" | "Unlisted";
export const UNIT_STATUSES: UnitStatus[] = ["Available", "Booked", "Maintenance", "Unlisted"];

/** A physical car in the fleet (plate number), assigned to bookings. */
export type Vehicle = {
  id: number;
  brand: string;
  model: string;
  vehicleType: string;
  year: number;
  color: string;
  plateNumber: string;
  transmission: string;
  fuelType: string;
  seats: number;
  dailyRate: string | number;
  description: string;
  status: UnitStatus;
  image: string | null;
};

export type Summary = {
  pendingBookings: number;
  activeBookings: number;
  newInquiries: number;
  unreadNotifications: number;
  unreadChats: number;
  units: Record<UnitStatus, number>;
  completedRevenue: number;
};

export type AppNotification = {
  id: number;
  type: "booking" | "inquiry" | "chat";
  title: string;
  message: string;
  bookingId: number | null;
  inquiryId: number | null;
  chatId: number | null;
  read: boolean;
  createdAt: string;
  // Live (stream) notifications also carry the full record.
  booking?: Booking;
  inquiry?: Inquiry;
};

export type Booking = {
  id: number;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string;
  customerWork: string;
  carLabel: string;
  vehicle: Vehicle | null;
  vehicleId: number | null;
  destination: string;
  rateZone: string;
  specificPlace: string | null;
  startDate: string;
  endDate: string;
  pickupTime: string | null;
  days: number;
  driveType: "Self Drive" | "With Driver";
  yearsDriving: number | null;
  purpose: string;
  // Postgres decimals arrive as strings; null = rate on request / not set.
  estimatedTotal: string | number | null;
  estimateText: string;
  totalPrice: string | number | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  notes: string | null;
  status: BookingStatus;
  // When the "booking confirmed" email reached the customer (null = not sent).
  confirmationEmailSentAt: string | null;
  createdAt: string;
};

/** What happened with the confirmation email (returned when a booking is approved or resent). */
export type EmailResult = { sent: true; to: string } | { sent: false; reason: "no-email" | "not-configured" | "failed"; message: string };
export type BookingWithEmail = Booking & { confirmationEmail?: EmailResult };


/** A live chat from the website's chat bubble. */
export type ChatStatus = "Open" | "Closed";
export type Chat = {
  id: number;
  name: string;
  contact: string;
  page: string | null;
  status: ChatStatus;
  // Visitor messages no admin has opened yet.
  adminUnread: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
};
export type ChatMessage = {
  id: number;
  conversationId: number;
  sender: "visitor" | "admin" | "auto";
  body: string;
  // The admin who replied (admin messages only).
  authorName: string | null;
  createdAt: string;
};
export type ChatWithMessages = Chat & { messages: ChatMessage[] };
/** Live "chat" event from the notifications stream. */
export type ChatEvent = { conversation: Chat; messages: ChatMessage[] };

/** One line of the activity log. */
export type AuditEntityType = "booking" | "inquiry" | "chat" | "vehicle" | "admin" | "catalog" | "account";
export type AuditLog = {
  id: number;
  createdAt: string;
  actorType: "admin" | "website" | "system";
  actorId: number | null;
  actorName: string;
  action: string;
  entityType: AuditEntityType;
  entityId: number | null;
  entityLabel: string;
  summary: string;
  // Deleted items that are still deleted (and can be brought back).
  canRestore?: boolean;
};

/** Where to restore each kind of deleted item. */
export const RESTORE_PATH: Partial<Record<AuditEntityType, (id: number) => string>> = {
  booking: (id) => `/bookings/${id}/restore`,
  inquiry: (id) => `/inquiries/${id}/restore`,
  chat: (id) => `/chats/${id}/restore`,
  vehicle: (id) => `/vehicles/${id}/restore`,
  admin: (id) => `/users/${id}/restore`,
};

export type InquiryStatus = "New" | "Contacted" | "Closed";

export type Inquiry = {
  id: number;
  name: string;
  contact: string;
  email: string | null;
  topic: string;
  message: string;
  page: string | null;
  status: InquiryStatus;
  notes: string | null;
  createdAt: string;
};

// Status changes the backend allows from each booking status.
export const BOOKING_NEXT: Record<BookingStatus, BookingStatus[]> = {
  Pending: ["Approved", "Declined", "Cancelled"],
  Approved: ["Returned", "Completed", "Cancelled"],
  Returned: ["Completed"],
  Declined: [],
  Completed: [],
  Cancelled: [],
};

export const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Down Payment", "Fully Paid"];
export const PAYMENT_METHODS: PaymentMethod[] = ["GCash", "Maya", "Bank Transfer", "Cash"];
export const INQUIRY_STATUSES: InquiryStatus[] = ["New", "Contacted", "Closed"];

// --- Formatting -----------------------------------------------------------------------------

/** "2026-10-25" -> "Oct 25, 2026" without time zone shifts. */
export function formatDay(date: string) {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "UTC" });
}

/** "14:30" -> "2:30 PM". */
export function formatTime(time: string | null) {
  const m = time && /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time ?? "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

export function formatWhen(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
}

export const priceText = (value: string | number | null) =>
  value == null || value === "" ? "On request" : `₱${Number(value).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;

/** "0917 123 4567" -> "09171234567" for tel: and sms: links. */
export const phoneDigits = (value: string) => value.replace(/[^\d+]/g, "");

/** The ?id= a push notification links to, read on the client. */
export function idFromUrl() {
  if (typeof window === "undefined") return null;
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}
