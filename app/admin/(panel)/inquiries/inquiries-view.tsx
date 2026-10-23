"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Inbox, Loader2, Mail, MessageSquareText, Phone, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, errorText, formatWhen, INQUIRY_STATUSES, phoneDigits, type Inquiry, type InquiryStatus } from "../../_lib/api";
import { useLive, useLiveEvents } from "../../_components/live";
import { useRestoredEvents, useUndo } from "../../_components/undo";
import {
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

const FILTERS = ["Open", ...INQUIRY_STATUSES, "All"] as const;
type Filter = (typeof FILTERS)[number];

export function InquiriesView() {
  const router = useRouter();
  const pathname = usePathname();
  // The open inquiry lives in the URL (?id=), so notifications and links can open one.
  const openId = Number(useSearchParams().get("id")) || null;
  const { refreshSummary } = useLive();
  const offerUndo = useUndo();
  const [filter, setFilter] = useState<Filter>("Open");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const { data, error, reload, setData } = usePagedList<Inquiry, Filter>("/inquiries", { page, filter, q });

  // An inquiry opened from a notification may be on another page: load it on its own.
  const [fetched, setFetched] = useState<Inquiry | null>(null);
  const [missing, setMissing] = useState<number | null>(null);
  const inList = openId ? (data?.items.find((i) => i.id === openId) ?? null) : null;
  useEffect(() => {
    if (!openId || inList) return;
    api<Inquiry>(`/inquiries/${openId}`).then(setFetched, (err) => {
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
  useLiveEvents(useCallback((n) => n.type === "inquiry" && void reload(), [reload]));
  useRestoredEvents(
    useCallback(() => {
      void reload();
      refreshSummary();
    }, [reload, refreshSummary]),
  );

  const show = (id: number | null) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });
  const items = data?.items ?? [];

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

      <SearchBox
        value={q}
        onChange={(text) => {
          setQ(text);
          setPage(1);
        }}
        placeholder="Search name, number, email, topic or message"
        label="Search inquiries"
      />
      <FilterChips
        label="Filter inquiries"
        options={FILTERS}
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
          <Inbox className="size-7 text-muted-foreground" />
          <p className="mt-2 font-semibold">{q ? `No inquiries match "${q}"` : "No inquiries here"}</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((i) => (
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
      {data && <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />}

      <Dialog open={!!open} onOpenChange={(o) => !o && show(null)}>
        {/* No auto-focus: on phones it would pop the keyboard up over the message. */}
        <DialogContent className={cn(sheetClass, "sm:max-w-xl")} onOpenAutoFocus={(e) => e.preventDefault()}>
          {open && (
            <InquiryDetails
              key={open.id}
              inquiry={open}
              onChange={(u) => {
                setData((d) => d && { ...d, items: d.items.map((i) => (i.id === u.id ? u : i)) });
                setFetched((i) => (i?.id === u.id ? u : i));
                refreshSummary();
              }}
              onDeleted={(inquiry) => {
                show(null);
                if (data && data.items.length === 1 && page > 1) setPage(page - 1);
                else void reload();
                refreshSummary();
                offerUndo(`Inquiry from ${inquiry.name} deleted`, () => api(`/inquiries/${inquiry.id}/restore`, { method: "POST" }));
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      {openId != null && missing === openId && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-600">
          That inquiry wasn&apos;t found. It may have been deleted.
        </p>
      )}
    </>
  );
}

function InquiryDetails({ inquiry, onChange, onDeleted }: { inquiry: Inquiry; onChange: (i: Inquiry) => void; onDeleted: (i: Inquiry) => void }) {
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
    if (!window.confirm("Delete this inquiry? You can undo this right after, or restore it later from the Activity log.")) return;
    setBusy("delete");
    setMessage(null);
    try {
      await api(`/inquiries/${inquiry.id}`, { method: "DELETE" });
      onDeleted(inquiry);
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
