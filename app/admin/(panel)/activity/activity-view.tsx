"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Car, Globe, History, KeyRound, Loader2, MessageSquareText, MessagesSquare, RefreshCw, RotateCcw, Tag, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api, errorText, formatWhen, RESTORE_PATH, type AuditEntityType, type AuditLog } from "../../_lib/api";
import { useLive } from "../../_components/live";
import { RESTORED_EVENT, useRestoredEvents } from "../../_components/undo";
import { FilterChips, PageTitle, Pagination, SearchBox, useAutoRefresh, usePagedList } from "../../_components/ui";

const FILTERS = ["All", "Bookings", "Inquiries", "Chats", "Units", "Admins", "Prices", "Sign-ins"] as const;
type Filter = (typeof FILTERS)[number];
const ENTITY_OF: Record<Filter, AuditEntityType | undefined> = {
  All: undefined,
  Bookings: "booking",
  Inquiries: "inquiry",
  Chats: "chat",
  Units: "vehicle",
  Admins: "admin",
  Prices: "catalog",
  "Sign-ins": "account",
};

const ICON: Record<AuditEntityType, typeof History> = {
  booking: CalendarCheck,
  inquiry: MessageSquareText,
  chat: MessagesSquare,
  vehicle: Car,
  admin: UserCog,
  catalog: Tag,
  account: KeyRound,
};

/** Where an entry's item opens in the dashboard (while it isn't deleted). */
function linkOf(entry: AuditLog) {
  if (!entry.entityId || entry.canRestore) return null;
  switch (entry.entityType) {
    case "booking":
      return `/admin/bookings?id=${entry.entityId}`;
    case "inquiry":
      return `/admin/inquiries?id=${entry.entityId}`;
    case "chat":
      return `/admin/messages?id=${entry.entityId}`;
    case "vehicle":
    case "catalog":
      return "/admin/fleet";
    case "admin":
      return "/admin/settings";
    default:
      return null;
  }
}

export function ActivityView() {
  const { refreshSummary } = useLive();
  const [filter, setFilter] = useState<Filter>("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const { data, error, reload } = usePagedList<AuditLog>("/audit-logs", { page, q, limit: 30, extra: { entityType: ENTITY_OF[filter] } });

  useAutoRefresh(reload);
  useRestoredEvents(useCallback(() => void reload(), [reload]));
  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const restore = async (entry: AuditLog) => {
    const path = entry.entityId ? RESTORE_PATH[entry.entityType]?.(entry.entityId) : undefined;
    if (!path) return;
    setBusyId(entry.id);
    setMessage(null);
    try {
      await api(path, { method: "POST" });
      setMessage({ ok: true, text: `Restored: ${entry.entityLabel || "item"}.` });
      window.dispatchEvent(new Event(RESTORED_EVENT));
      refreshSummary();
    } catch (err) {
      setMessage({ ok: false, text: errorText(err, "Couldn't restore it.") });
    } finally {
      setBusyId(null);
    }
  };

  const items = data?.items ?? [];
  return (
    <>
      <PageTitle
        title="Activity log"
        description="Who did what, and when: every change in the dashboard, plus bookings, inquiries and chats from the website."
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
        placeholder="Search who, what, or a booking code"
        label="Search the activity log"
      />
      <FilterChips
        label="Filter activity"
        options={FILTERS}
        value={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
      />

      {(error || message) && (
        <p
          role={error || !message?.ok ? "alert" : "status"}
          className={cn(
            "mb-4 rounded-2xl border p-4 text-sm font-semibold",
            error || !message?.ok ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {error ?? message?.text}
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
          <History className="size-7 text-muted-foreground" />
          <p className="mt-2 font-semibold">{q ? `Nothing matches "${q}"` : "No activity yet"}</p>
        </div>
      ) : (
        <ol className="grid gap-2">
          {items.map((entry) => {
            const Icon = entry.actorType === "website" ? Globe : ICON[entry.entityType] ?? History;
            const href = linkOf(entry);
            const body = (
              <>
                <span className="block text-sm font-semibold break-words">{entry.summary}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {entry.actorType === "website" ? `${entry.actorName} (website)` : entry.actorName} · {formatWhen(entry.createdAt)}
                </span>
              </>
            );
            return (
              <li key={entry.id} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3.5">
                <span
                  className={cn(
                    "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                    entry.action.endsWith(".deleted") ? "bg-red-50 text-red-600" : entry.actorType === "website" ? "bg-brand-50 text-brand-700" : "bg-muted text-ink",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {href ? (
                  <Link href={href} className="min-w-0 flex-1 hover:underline">
                    {body}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1">{body}</span>
                )}
                {entry.canRestore && (
                  <Button variant="outline" size="md" disabled={busyId === entry.id} onClick={() => void restore(entry)} className="shrink-0 rounded-xl border-line">
                    {busyId === entry.id ? <Loader2 className="animate-spin" /> : <RotateCcw />} Restore
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {data && <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />}
    </>
  );
}
