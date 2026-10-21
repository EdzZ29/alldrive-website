"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Inbox, Loader2, Mail, MessageSquareText, Phone, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api, errorText, formatWhen, INQUIRY_STATUSES, phoneDigits, type Inquiry, type InquiryStatus } from "../../_lib/api";
import { useLive, useLiveEvents } from "../../_components/live";
import { Field, FilterChips, PageTitle, selectClass, SheetActions, sheetClass, StatusBadge, useAutoRefresh } from "../../_components/ui";

type Filter = "Open" | InquiryStatus | "All";
const FILTERS: Filter[] = ["Open", ...INQUIRY_STATUSES, "All"];
const matches = (f: Filter, i: Inquiry) => (f === "All" ? true : f === "Open" ? i.status !== "Closed" : i.status === f);

export function InquiriesView() {
  const router = useRouter();
  const pathname = usePathname();
  // The open inquiry lives in the URL (?id=), so notifications and links can open one.
  const openId = Number(useSearchParams().get("id")) || null;
  const { refreshSummary } = useLive();
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("Open");

  // Fetches the list. State only changes in the request's callbacks.
  const load = useCallback(
    () =>
      api<Inquiry[]>("/inquiries").then(
        (list) => {
          setInquiries(list);
          setError(null);
        },
        (err) => setError(errorText(err, "Couldn't load inquiries.")),
      ),
    [],
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, [load]);
  useAutoRefresh(load);
  // A new inquiry arrived: add it right away (or reload if it came without details).
  useLiveEvents(
    useCallback(
      (n) => {
        if (n.type !== "inquiry") return;
        if (n.inquiry) setInquiries((list) => (list && !list.some((i) => i.id === n.inquiry!.id) ? [n.inquiry!, ...list] : list));
        else void load();
      },
      [load],
    ),
  );

  const visible = useMemo(() => (inquiries ?? []).filter((i) => matches(filter, i)), [inquiries, filter]);
  const open = openId ? (inquiries?.find((i) => i.id === openId) ?? null) : null;
  const show = (id: number | null) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });

  return (
    <>
      <PageTitle
        title="Inquiries"
        description="Messages from the website contact form."
        action={
          <Button variant="outline" size="md" onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh" className="shrink-0 rounded-xl border-line">
            <RefreshCw className={cn(refreshing && "animate-spin")} /> <span className="max-sm:sr-only">Refresh</span>
          </Button>
        }
      />

      <FilterChips
        label="Filter inquiries"
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        count={inquiries ? (f) => inquiries.filter((i) => matches(f, i)).length : undefined}
      />

      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {!inquiries ? (
        !error && (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-label="Loading" />
          </div>
        )
      ) : visible.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-4 py-16 text-center">
          <Inbox className="size-7 text-muted-foreground" />
          <p className="mt-2 font-semibold">No inquiries here</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {visible.map((i) => (
            <li key={i.id}>
              <button
                onClick={() => show(i.id)}
                className="grid w-full gap-1 rounded-2xl border border-line bg-white p-4 text-left transition hover:border-brand active:bg-muted/60"
              >
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate font-bold">{i.name}</p>
                  <StatusBadge status={i.status} />
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatWhen(i.createdAt)}</span>
                </div>
                <p className="text-sm font-semibold">{i.topic}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{i.message}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && show(null)}>
        {/* No auto-focus: on phones it would pop the keyboard up over the message. */}
        <DialogContent className={cn(sheetClass, "sm:max-w-xl")} onOpenAutoFocus={(e) => e.preventDefault()}>
          {open && (
            <InquiryDetails
              key={open.id}
              inquiry={open}
              onChange={(u) => {
                setInquiries((list) => list?.map((i) => (i.id === u.id ? u : i)) ?? [u]);
                refreshSummary();
              }}
              onDeleted={() => {
                setInquiries((list) => list?.filter((i) => i.id !== open.id) ?? null);
                refreshSummary();
                show(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      {openId != null && inquiries && !open && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-600">
          That inquiry wasn&apos;t found. It may have been deleted.
        </p>
      )}
    </>
  );
}

function InquiryDetails({ inquiry, onChange, onDeleted }: { inquiry: Inquiry; onChange: (i: Inquiry) => void; onDeleted: () => void }) {
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [notes, setNotes] = useState(inquiry.notes ?? "");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const phone = phoneDigits(inquiry.contact);
  const dirty = status !== inquiry.status || notes !== (inquiry.notes ?? "");

  const save = async () => {
    setBusy("save");
    setMessage(null);
    try {
      onChange(await api<Inquiry>(`/inquiries/${inquiry.id}`, { method: "PATCH", body: { status, notes } }));
      setMessage({ ok: true, text: "Saved." });
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this inquiry? Use this for spam. It can't be undone.")) return;
    setBusy("delete");
    setMessage(null);
    try {
      await api(`/inquiries/${inquiry.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
      setBusy(null);
    }
  };

  return (
    <>
      <DialogHeader className="pr-8 text-left">
        <StatusBadge status={inquiry.status} />
        <DialogTitle className="font-display text-2xl font-extrabold tracking-tight">{inquiry.name}</DialogTitle>
        <DialogDescription>
          {inquiry.topic} · {formatWhen(inquiry.createdAt)}
          {inquiry.page && ` · sent from ${inquiry.page}`}
        </DialogDescription>
      </DialogHeader>

      <p className="rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed break-words whitespace-pre-wrap">{inquiry.message}</p>

      <div className={cn("grid gap-2", inquiry.email ? "grid-cols-3" : "grid-cols-2", "sm:flex sm:flex-wrap")}>
        <Button asChild variant="ink" size="md">
          <a href={`tel:${phone}`}>
            <Phone /> Call<span className="max-sm:hidden"> {inquiry.contact}</span>
          </a>
        </Button>
        <Button asChild variant="outline" size="md" className="rounded-xl border-line">
          <a href={`sms:${phone}`}>
            <MessageSquareText /> Text
          </a>
        </Button>
        {inquiry.email && (
          <Button asChild variant="outline" size="md" className="rounded-xl border-line">
            <a href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: ${inquiry.topic}`)}`}>
              <Mail /> Email
            </a>
          </Button>
        )}
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        {inquiry.contact}
        {inquiry.email && <span className="break-all"> · {inquiry.email}</span>}
      </p>

      <div className="grid gap-4">
        <Field id="iq-status" label="Status">
          <select id="iq-status" value={status} onChange={(e) => setStatus(e.target.value as InquiryStatus)} className={selectClass}>
            {INQUIRY_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field id="iq-notes" label="Admin notes">
          <Textarea
            id="iq-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Called back, sent rates by text"
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
        <Button variant="outline" size="md" disabled={!!busy} onClick={() => void remove()} className="rounded-xl border-line text-red-600">
          {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
        </Button>
        <Button variant="brand-light" size="md" disabled={!dirty || !!busy} onClick={() => void save()} className="max-sm:flex-1">
          {busy === "save" && <Loader2 className="animate-spin" />} Save changes
        </Button>
      </SheetActions>
    </>
  );
}
