"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, Car, Loader2, Mail, MapPin, MessageSquareText, Phone, RefreshCw, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  api,
  ApiError,
  BOOKING_NEXT,
  errorText,
  formatDay,
  formatTime,
  formatWhen,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  phoneDigits,
  priceText,
  type Booking,
  type BookingStatus,
  type BookingWithEmail,
  type EmailResult,
  type PaymentMethod,
  type PaymentStatus,
  type Vehicle,
} from "../../_lib/api";
import { useLive, useLiveEvents } from "../../_components/live";
import { useRestoredEvents, useUndo } from "../../_components/undo";
import {
  Detail,
  Field,
  FilterChips,
  PageTitle,
  Pagination,
  SearchBox,
  selectClass,
  SheetActions,
  sheetClass,
  StatusBadge,
  useAutoRefresh,
  usePagedList,
} from "../../_components/ui";

const FILTER_NAMES = ["Pending", "Active", "History", "All"] as const;
type Filter = (typeof FILTER_NAMES)[number];

export function BookingsView() {
  const router = useRouter();
  const pathname = usePathname();
  // The open booking lives in the URL (?id=), so notifications and links can open one.
  const openId = Number(useSearchParams().get("id")) || null;
  const { refreshSummary } = useLive();
  const offerUndo = useUndo();
  const [filter, setFilter] = useState<Filter>("Pending");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const { data, error, reload, setData } = usePagedList<Booking, Filter>("/bookings", { page, filter, q });

  // A booking opened from a notification may be on another page: load it on its own.
  const [fetched, setFetched] = useState<Booking | null>(null);
  const [missing, setMissing] = useState<number | null>(null);
  const inList = openId ? (data?.items.find((b) => b.id === openId) ?? null) : null;
  useEffect(() => {
    if (!openId || inList) return;
    api<Booking>(`/bookings/${openId}`).then(setFetched, (err) => {
      if (err instanceof ApiError && err.status === 404) setMissing(openId);
    });
  }, [openId, inList]);
  const open = inList ?? (fetched?.id === openId ? fetched : null);

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };
  useAutoRefresh(reload);
  // A new booking arrived, or something was restored: reload this page (and the counts).
  useLiveEvents(useCallback((n) => n.type === "booking" && void reload(), [reload]));
  useRestoredEvents(
    useCallback(() => {
      void reload();
      refreshSummary();
    }, [reload, refreshSummary]),
  );

  const show = (id: number | null) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });
  const replace = (updated: Booking) => {
    setData((d) => d && { ...d, items: d.items.map((b) => (b.id === updated.id ? updated : b)) });
    setFetched((b) => (b?.id === updated.id ? updated : b));
    refreshSummary(); // pending/active counts in the sidebar
  };
  const deleted = (booking: Booking) => {
    show(null);
    // The last one on a later page: go back a page.
    if (data && data.items.length === 1 && page > 1) setPage(page - 1);
    else void reload();
    refreshSummary();
    offerUndo(`Booking ${booking.reference} deleted`, () => api(`/bookings/${booking.id}/restore`, { method: "POST" }));
  };

  const items = data?.items ?? [];
  return (
    <>
      <PageTitle
        title="Bookings"
        description="Requests from the website. Call or text to confirm, then update them here."
        action={
          <Button variant="outline" size="md" onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh" className="shrink-0 rounded-xl border-line">
            <RefreshCw className={cn(refreshing && "animate-spin")} /> <span className="max-sm:sr-only">Refresh</span>
          </Button>
        }
      />

      <SearchBox
        value={q}
        onChange={(text) => {
          setQ(text);
          setPage(1);
        }}
        placeholder="Search name, booking code, phone, email or car"
        label="Search bookings"
      />
      <FilterChips
        label="Filter bookings"
        options={FILTER_NAMES}
        value={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        count={data?.counts ? (f) => data.counts![f] : undefined}
      />

      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {!data ? (
        !error && (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-label="Loading" />
          </div>
        )
      ) : items.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-4 py-16 text-center">
          <CalendarCheck className="size-7 text-muted-foreground" />
          <p className="mt-2 font-semibold">{q ? `No bookings match "${q}"` : `No ${filter === "All" ? "" : filter.toLowerCase() + " "}bookings`}</p>
          {filter === "Pending" && !q && <p className="text-sm text-muted-foreground">New website bookings show up here instantly.</p>}
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((b) => (
            <li key={b.id}>
              <button
                onClick={() => show(b.id)}
                className="grid w-full gap-2 rounded-2xl border border-line bg-white p-4 text-left transition hover:border-brand active:bg-muted/60 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 truncate font-bold">{b.customerName}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm">
                    <Car className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {b.carLabel}
                      {b.vehicle && (
                        <span className="text-muted-foreground">
                          {" "}
                          → {b.vehicle.brand} {b.vehicle.model}
                        </span>
                      )}
                    </span>
                  </p>
                  <p className="mt-0.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-px size-3.5 shrink-0" />
                    <span>
                      {formatDay(b.startDate)}
                      {b.pickupTime && `, ${formatTime(b.pickupTime)}`} · {b.days} day{b.days > 1 ? "s" : ""} · {b.driveType} · {b.destination}
                    </span>
                  </p>
                </div>
                <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
                  <p className="font-display text-lg font-extrabold">{priceText(b.totalPrice)}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{b.reference}</span> · {formatWhen(b.createdAt)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />}

      <Dialog open={!!open} onOpenChange={(o) => !o && show(null)}>
        {/* No auto-focus: on phones it would pop the keyboard up over the details. */}
        <DialogContent className={sheetClass} onOpenAutoFocus={(e) => e.preventDefault()}>
          {open && <BookingDetails key={open.id} booking={open} onChange={replace} onDeleted={deleted} />}
        </DialogContent>
      </Dialog>
      {openId != null && missing === openId && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-600">
          That booking wasn&apos;t found. It may have been deleted.
        </p>
      )}
    </>
  );
}

const STATUS_ACTIONS: Partial<Record<BookingStatus, { label: string; confirm?: string; variant: "ink" | "outline" | "destructive" }>> = {
  Approved: { label: "Approve & email customer", variant: "ink" },
  Returned: { label: "Mark returned", variant: "outline" },
  Completed: { label: "Complete", variant: "ink" },
  Declined: { label: "Decline", variant: "destructive", confirm: "Decline this booking? Let the customer know by call or text." },
  Cancelled: { label: "Cancel booking", variant: "outline", confirm: "Cancel this booking? The assigned car becomes available again." },
};

/** What to tell the admin after a status change (and the automatic approval email). */
function statusMessage(status: BookingStatus | null, email: EmailResult | undefined) {
  const parts = status ? [`Booking ${status.toLowerCase()}.`] : [];
  if (email) parts.push(email.sent ? `Approval email sent to ${email.to}.` : `Email not sent: ${email.message}`);
  // No email address is expected sometimes; a real failure means the admin should call instead.
  return { ok: !email || email.sent || email.reason === "no-email", text: parts.join(" ") };
}

/**
 * The approval email, from the dashboard server, or from the website when the server can't send
 * email (its host may block it): the website gets the same email from the server and sends it.
 */
async function deliverApproval(id: number, first: BookingWithEmail): Promise<BookingWithEmail> {
  const email = first.confirmationEmail;
  if (!email || email.sent || email.reason === "no-email") return first;
  try {
    const sent = await api<BookingWithEmail>("/send-confirmation", { method: "POST", body: { id } });
    return { ...first, ...sent, confirmationEmail: sent.confirmationEmail ?? { sent: true, to: first.customerEmail ?? "" } };
  } catch (err) {
    return { ...first, confirmationEmail: { sent: false, reason: "failed", message: errorText(err, "Couldn't send the email.") } };
  }
}

function BookingDetails({ booking, onChange, onDeleted }: { booking: Booking; onChange: (b: Booking) => void; onDeleted: (b: Booking) => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [vehicleId, setVehicleId] = useState(booking.vehicleId ? String(booking.vehicleId) : "");
  const [price, setPrice] = useState(booking.totalPrice == null ? "" : String(Number(booking.totalPrice)));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(booking.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState(booking.paymentMethod ?? "");
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [email, setEmail] = useState(booking.customerEmail ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<Vehicle[]>("/vehicles")
      .then(setVehicles)
      .catch((err) => {
        console.error("[admin] Couldn't load vehicles:", err);
        setVehicles([]);
      });
  }, []);

  const phone = phoneDigits(booking.customerPhone);
  const dirty =
    vehicleId !== (booking.vehicleId ? String(booking.vehicleId) : "") ||
    price !== (booking.totalPrice == null ? "" : String(Number(booking.totalPrice))) ||
    paymentStatus !== booking.paymentStatus ||
    paymentMethod !== (booking.paymentMethod ?? "") ||
    notes !== (booking.notes ?? "") ||
    email.trim() !== (booking.customerEmail ?? "");

  const save = async () => {
    if (price && !(Number(price) >= 0)) return setMessage({ ok: false, text: "Enter a valid price, or leave it blank." });
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setMessage({ ok: false, text: "Enter a valid email, or leave it blank." });
    setBusy("save");
    setMessage(null);
    try {
      const updated = await api<Booking>(`/bookings/${booking.id}`, {
        method: "PATCH",
        body: {
          vehicleId: vehicleId ? Number(vehicleId) : null,
          totalPrice: price ? Number(price) : null,
          paymentStatus,
          paymentMethod: (paymentMethod || null) as PaymentMethod | null,
          notes,
          customerEmail: email.trim(),
        },
      });
      onChange(updated);
      setMessage({ ok: true, text: "Saved." });
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (status: BookingStatus) => {
    const action = STATUS_ACTIONS[status];
    if (action?.confirm && !window.confirm(action.confirm)) return;
    setBusy(status);
    setMessage(null);
    try {
      let updated = await api<BookingWithEmail>(`/bookings/${booking.id}/status`, { method: "PATCH", body: { status } });
      if (status === "Approved") updated = await deliverApproval(booking.id, updated);
      onChange(updated);
      setMessage(statusMessage(status, updated.confirmationEmail));
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    setBusy("email");
    setMessage(null);
    try {
      const first = await api<BookingWithEmail>(`/bookings/${booking.id}/confirmation-email`, { method: "POST" });
      const updated = await deliverApproval(booking.id, first);
      onChange(updated);
      setMessage(statusMessage(null, updated.confirmationEmail));
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete booking ${booking.reference}? You can undo this right after, or restore it later from the Activity log.`)) return;
    setBusy("delete");
    setMessage(null);
    try {
      await api(`/bookings/${booking.id}`, { method: "DELETE" });
      onDeleted(booking);
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
      setBusy(null);
    }
  };

  return (
    <>
      <DialogHeader className="pr-8 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
        <DialogTitle className="font-display text-2xl font-extrabold tracking-tight">{booking.customerName}</DialogTitle>
        <DialogDescription>
          {booking.reference} · received {formatWhen(booking.createdAt)}
        </DialogDescription>
      </DialogHeader>

      <div className={cn("grid gap-2", booking.customerEmail ? "grid-cols-3" : "grid-cols-2", "sm:flex sm:flex-wrap")}>
        <Button asChild variant="ink" size="md">
          <a href={`tel:${phone}`}>
            <Phone /> Call<span className="max-sm:hidden"> {booking.customerPhone}</span>
          </a>
        </Button>
        <Button asChild variant="outline" size="md" className="rounded-xl border-line">
          <a href={`sms:${phone}`}>
            <MessageSquareText /> Text
          </a>
        </Button>
        {booking.customerEmail && (
          <Button asChild variant="outline" size="md" className="rounded-xl border-line">
            <a href={`mailto:${booking.customerEmail}?subject=${encodeURIComponent(`Your AllDrive booking ${booking.reference}`)}`}>
              <Mail /> Email
            </a>
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-2xl bg-muted/60 p-4 sm:grid-cols-3">
        <Detail label="Car requested">{booking.carLabel}</Detail>
        <Detail label="Pickup">
          {formatDay(booking.startDate)}
          {booking.pickupTime && `, ${formatTime(booking.pickupTime)}`}
        </Detail>
        <Detail label="Return">{formatDay(booking.endDate)}</Detail>
        <Detail label="Days">{String(booking.days)}</Detail>
        <Detail label="Service">{booking.driveType}</Detail>
        {booking.driveType === "Self Drive" && (
          <Detail label="Years driving">{booking.yearsDriving != null ? String(booking.yearsDriving) : null}</Detail>
        )}
        <Detail label="Destination">
          {booking.destination}
          {booking.specificPlace && ` (${booking.specificPlace})`}
        </Detail>
        <Detail label="Rate zone">{booking.rateZone}</Detail>
        <Detail label="Website estimate">{booking.estimateText || priceText(booking.estimatedTotal)}</Detail>
        <Detail label="Phone">{booking.customerPhone}</Detail>
        <Detail label="Address">{booking.customerAddress}</Detail>
        <Detail label="Work / business">{booking.customerWork}</Detail>
        <Detail label="Purpose" className="col-span-2 sm:col-span-3">
          {booking.purpose}
        </Detail>
      </dl>

      {/* The approval email goes out automatically when the booking is approved. */}
      <section className="grid gap-3 rounded-2xl border border-line p-4">
        <Field id="bk-email" label="Customer email">
          <Input
            id="bk-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            placeholder="Not given (add one they told you by phone)"
            className="h-11 rounded-xl bg-white"
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            {booking.confirmationEmailSentAt ? (
              <span>
                Approval email sent <span className="font-semibold">{formatWhen(booking.confirmationEmailSentAt)}</span>
              </span>
            ) : booking.status === "Approved" ? (
              <span className="text-muted-foreground">Approval email not sent yet</span>
            ) : (
              <span className="text-muted-foreground">Approving emails the customer &quot;Your booking is approved&quot; with the details</span>
            )}
          </p>
          {booking.status === "Approved" && (
            <Button
              variant="outline"
              size="md"
              disabled={!!busy || !booking.customerEmail || email.trim() !== (booking.customerEmail ?? "")}
              title={email.trim() !== (booking.customerEmail ?? "") ? "Save the new email first" : !booking.customerEmail ? "Add the customer's email first" : undefined}
              onClick={() => void resend()}
              className="rounded-xl border-line"
            >
              {busy === "email" ? <Loader2 className="animate-spin" /> : <Send />}
              {booking.confirmationEmailSentAt ? "Resend approval email" : "Send approval email"}
            </Button>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="bk-vehicle" label="Assigned car">
          <select id="bk-vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={!vehicles} className={selectClass}>
            <option value="">Not assigned yet</option>
            {(vehicles ?? []).map((v) => (
              <option key={v.id} value={v.id} disabled={v.status === "Maintenance" && String(v.id) !== vehicleId}>
                {v.brand} {v.model} · {v.plateNumber}
                {v.status !== "Available" ? ` (${v.status})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field id="bk-price" label="Final price (₱)">
          <Input
            id="bk-price"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="On request"
            className="h-11 rounded-xl bg-white"
          />
        </Field>
        <Field id="bk-pay-status" label="Payment">
          <select id="bk-pay-status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} className={selectClass}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field id="bk-pay-method" label="Payment method">
          <select id="bk-pay-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectClass}>
            <option value="">Not set</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field id="bk-notes" label="Admin notes" className="sm:col-span-2">
          <Textarea
            id="bk-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Confirmed by phone, ₱1,500 down via GCash"
            className="rounded-xl bg-white"
          />
        </Field>
      </div>

      <SheetActions>
        {message && (
          <p role="status" className={cn("w-full text-sm font-semibold", message.ok ? "text-emerald-700" : "text-red-600")}>
            {message.text}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {BOOKING_NEXT[booking.status].map((s) => {
            const action = STATUS_ACTIONS[s];
            return (
              <Button key={s} variant={action?.variant ?? "outline"} size="md" disabled={!!busy} onClick={() => void setStatus(s)}>
                {busy === s && <Loader2 className="animate-spin" />} {action?.label ?? s}
              </Button>
            );
          })}
          <Button variant="ghost" size="md" disabled={!!busy} onClick={() => void remove()} className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700">
            {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
          </Button>
        </div>
        <Button variant="brand-light" size="md" disabled={!dirty || !!busy} onClick={() => void save()} className="max-sm:flex-1">
          {busy === "save" && <Loader2 className="animate-spin" />} Save changes
        </Button>
      </SheetActions>
    </>
  );
}
