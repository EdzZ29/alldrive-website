"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Inbox, Loader2, MessageSquareText, MessagesSquare, Phone, RefreshCw, SendHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LinkifiedText } from "@/app/_components/linkified-text";
import { api, errorText, formatWhen, phoneDigits, type Chat, type ChatEvent, type ChatMessage, type ChatStatus, type ChatWithMessages } from "../../_lib/api";
import { useChatEvents, useLive } from "../../_components/live";
import { useRestoredEvents, useUndo } from "../../_components/undo";
import { FilterChips, PageTitle, Pagination, SearchBox, StatusBadge, useAutoRefresh, usePagedList } from "../../_components/ui";

const FILTERS = ["Open", "Closed", "All"] as const;
type Filter = (typeof FILTERS)[number];
const byLatest = (a: Chat, b: Chat) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
const MAX_LENGTH = 2000;

/** Time only for today, otherwise date and time. */
function shortWhen(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? d.toLocaleTimeString("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" }) : formatWhen(value);
}

export function MessagesView() {
  const router = useRouter();
  const pathname = usePathname();
  // The open chat lives in the URL (?id=), so notifications and toasts can open one.
  const openId = Number(useSearchParams().get("id")) || null;
  const { connected, refreshSummary } = useLive();
  const offerUndo = useUndo();
  const [filter, setFilter] = useState<Filter>("Open");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const { data, error, reload, setData } = usePagedList<Chat, Filter>("/chats", { page, filter, q });

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };
  // Live events keep the list current; this is the backup when the live stream is cut.
  useAutoRefresh(reload, connected ? 30_000 : 8_000);
  useRestoredEvents(
    useCallback(() => {
      void reload();
      refreshSummary();
    }, [reload, refreshSummary]),
  );

  // Show a change at once on the first page (newest first), then reload for exact counts.
  const upsert = useCallback(
    (chat: Chat) => {
      if (page === 1 && !q && (filter === "All" || chat.status === filter)) {
        setData((d) => d && { ...d, items: [chat, ...d.items.filter((c) => c.id !== chat.id)].sort(byLatest).slice(0, d.limit) });
      } else {
        setData((d) => d && { ...d, items: d.items.map((c) => (c.id === chat.id ? chat : c)) });
      }
    },
    [page, q, filter, setData],
  );
  useChatEvents(
    useCallback(
      (e: ChatEvent) => {
        // The open chat is marked read as it arrives (see ChatThread).
        upsert(e.conversation.id === openId ? { ...e.conversation, adminUnread: 0 } : e.conversation);
        void reload();
      },
      [upsert, openId, reload],
    ),
  );

  const items = data?.items ?? [];
  const show = (id: number | null) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });

  return (
    <>
      <div className={cn(openId && "max-lg:hidden")}>
        <PageTitle
          title="Messages"
          description="Live chats from the website's chat bubble. New messages appear here by themselves."
          action={
            <Button variant="outline" size="md" onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh" className="shrink-0 rounded-xl border-line">
              <RefreshCw className={cn(refreshing && "animate-spin")} /> <span className="max-sm:sr-only">Refresh</span>
            </Button>
          }
        />
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className={cn("min-w-0", openId && "max-lg:hidden")}>
          <SearchBox
            value={q}
            onChange={(text) => {
              setQ(text);
              setPage(1);
            }}
            placeholder="Search name, number or message"
            label="Search chats"
          />
          <FilterChips
            label="Filter chats"
            options={FILTERS}
            value={filter}
            onChange={(f) => {
              setFilter(f);
              setPage(1);
            }}
            count={data?.counts ? (f) => data.counts![f] : undefined}
          />
          {!data ? (
            !error && (
              <div className="grid place-items-center py-16 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" aria-label="Loading" />
              </div>
            )
          ) : items.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-4 py-16 text-center">
              <Inbox className="size-7 text-muted-foreground" />
              <p className="mt-2 font-semibold">{q ? `No chats match "${q}"` : "No chats here"}</p>
            </div>
          ) : (
            <ul className="grid gap-2">
              {items.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => show(c.id)}
                    aria-current={c.id === openId ? "true" : undefined}
                    className={cn(
                      "grid w-full gap-0.5 rounded-2xl border bg-white p-3.5 text-left transition hover:border-brand",
                      c.id === openId ? "border-ink" : "border-line",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("min-w-0 truncate", c.adminUnread ? "font-extrabold" : "font-semibold")}>{c.name}</span>
                      {c.adminUnread > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{c.adminUnread}</span>
                      )}
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{shortWhen(c.lastMessageAt)}</span>
                    </span>
                    <span className={cn("line-clamp-2 text-sm", c.adminUnread ? "text-ink" : "text-muted-foreground")}>{c.lastMessagePreview}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />}
        </div>

        <div className={cn("min-w-0", !openId && "max-lg:hidden")}>
          {openId ? (
            <ChatThread
              key={openId}
              id={openId}
              onBack={() => show(null)}
              onChange={(chat) => {
                upsert(chat);
                refreshSummary();
              }}
              onDeleted={(chat) => {
                show(null);
                if (data && data.items.length === 1 && page > 1) setPage(page - 1);
                else void reload();
                refreshSummary();
                offerUndo(`Chat with ${chat.name} deleted`, () => api(`/chats/${chat.id}/restore`, { method: "POST" }));
              }}
            />
          ) : (
            <div className="grid h-full min-h-80 place-items-center rounded-3xl border border-dashed border-line bg-white p-8 text-center text-muted-foreground">
              <div>
                <MessagesSquare className="mx-auto size-8" />
                <p className="mt-2 font-semibold">Pick a chat to read and reply</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ChatThread({
  id,
  onBack,
  onChange,
  onDeleted,
}: {
  id: number;
  onBack: () => void;
  onChange: (chat: Chat) => void;
  onDeleted: (chat: Chat) => void;
}) {
  const { connected } = useLive();
  const [chat, setChat] = useState<ChatWithMessages | null>(null);
  const [missing, setMissing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"send" | "status" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Loading the chat also marks it read.
  const load = useCallback(
    () =>
      api<ChatWithMessages>(`/chats/${id}`).then(
        (full) => {
          setChat(full);
          setMissing(false);
          const { messages: _messages, ...summary } = full;
          void _messages;
          onChangeRef.current(summary);
        },
        (err) => {
          if ((err as { status?: number }).status === 404) setMissing(true);
          else setError(errorText(err, "Couldn't load this chat."));
        },
      ),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useAutoRefresh(load, connected ? 30_000 : 4_000);

  // New messages for this chat, live.
  useChatEvents(
    useCallback(
      (e: ChatEvent) => {
        if (e.conversation.id !== id) return;
        setChat((current) => {
          if (!current) return current;
          const ids = new Set(current.messages.map((m) => m.id));
          const messages = [...current.messages, ...e.messages.filter((m) => !ids.has(m.id))].sort((a, b) => a.id - b.id);
          return { ...current, ...e.conversation, adminUnread: 0, messages };
        });
        // A visitor wrote while this chat is on screen: mark it read.
        if (e.messages.some((m) => m.sender === "visitor") && document.visibilityState === "visible") void load();
      },
      [id, load],
    ),
  );

  const count = chat?.messages.length ?? 0;
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [count]);

  const send = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || busy || !chat) return;
    setBusy("send");
    setError(null);
    try {
      const message = await api<ChatMessage>(`/chats/${id}/messages`, { method: "POST", body: { body } });
      setDraft("");
      setChat((current) =>
        current && !current.messages.some((m) => m.id === message.id)
          ? { ...current, status: "Open", messages: [...current.messages, message] }
          : current,
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (status: ChatStatus) => {
    setBusy("status");
    setError(null);
    try {
      const updated = await api<Chat>(`/chats/${id}`, { method: "PATCH", body: { status } });
      setChat((current) => (current ? { ...current, ...updated } : current));
      onChange(updated);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this chat? You can undo this right after, or restore it later from the Activity log.")) return;
    setBusy("delete");
    try {
      await api(`/chats/${id}`, { method: "DELETE" });
      if (chat) onDeleted(chat);
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) void send(e);
  };

  if (missing) {
    return (
      <div className="rounded-3xl border border-line bg-white p-6">
        <BackButton onBack={onBack} />
        <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
          That chat wasn&apos;t found. It may have been deleted.
        </p>
      </div>
    );
  }
  if (!chat) {
    return (
      <div className="grid min-h-80 place-items-center rounded-3xl border border-line bg-white text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const phone = phoneDigits(chat.contact);
  return (
    <section aria-label={`Chat with ${chat.name}`} className="flex h-[calc(100svh-7.5rem)] min-h-[28rem] flex-col overflow-hidden rounded-3xl border border-line bg-white lg:h-[calc(100svh-10rem)]">
      <header className="flex flex-wrap items-center gap-2 border-b border-line p-3 sm:p-4">
        <BackButton onBack={onBack} className="lg:hidden" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="truncate font-display text-lg font-extrabold tracking-tight">{chat.name}</span>
            <StatusBadge status={chat.status} />
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {chat.contact} · started {formatWhen(chat.createdAt)}
            {chat.page && ` on ${chat.page}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button asChild variant="outline" size="md" className="rounded-xl border-line">
            <a href={`tel:${phone}`} aria-label={`Call ${chat.contact}`}>
              <Phone /> <span className="max-sm:sr-only">Call</span>
            </a>
          </Button>
          <Button asChild variant="outline" size="md" className="rounded-xl border-line max-sm:hidden">
            <a href={`sms:${phone}`}>
              <MessageSquareText /> Text
            </a>
          </Button>
          <Button
            variant="outline"
            size="md"
            disabled={!!busy}
            onClick={() => void setStatus(chat.status === "Open" ? "Closed" : "Open")}
            className="rounded-xl border-line"
          >
            {busy === "status" && <Loader2 className="animate-spin" />}
            {chat.status === "Open" ? "Close" : "Reopen"}
          </Button>
          <Button variant="ghost" size="icon-lg" disabled={!!busy} onClick={() => void remove()} aria-label="Delete chat" className="rounded-xl text-muted-foreground hover:text-red-600">
            <Trash2 />
          </Button>
        </div>
      </header>

      <div ref={listRef} aria-live="polite" className="flex-1 space-y-2 overflow-y-auto overscroll-contain bg-muted/40 px-3 py-4 sm:px-5">
        {chat.messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
      </div>

      <form onSubmit={(e: FormEvent) => void send(e)} className="border-t border-line p-3">
        {error && (
          <p role="alert" className="pb-2 text-xs font-semibold text-red-600">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder={`Reply to ${chat.name.split(/\s+/)[0]}…`}
            aria-label="Reply"
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-white px-3.5 py-2.5 text-base outline-none field-sizing-content focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          />
          <Button type="submit" variant="ink" size="icon-xl" disabled={busy === "send" || !draft.trim()} aria-label="Send reply" className="shrink-0 rounded-full">
            {busy === "send" ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">Enter sends, Shift + Enter for a new line. The visitor sees your reply in their chat window right away.</p>
      </form>
    </section>
  );
}

function BackButton({ onBack, className }: { onBack: () => void; className?: string }) {
  return (
    <button onClick={onBack} aria-label="Back to chats" className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-ink", className)}>
      <ArrowLeft className="size-5" />
    </button>
  );
}

function Bubble({ message: m }: { message: ChatMessage }) {
  const visitor = m.sender === "visitor";
  const label = visitor ? null : m.sender === "auto" ? "Automatic reply" : (m.authorName ?? "Admin");
  return (
    <div className={cn("flex flex-col", visitor ? "items-start" : "items-end")}>
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-line",
          visitor && "rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-line",
          m.sender === "admin" && "rounded-br-md bg-ink text-white",
          m.sender === "auto" && "rounded-br-md bg-brand-50 text-ink ring-1 ring-brand-100",
        )}
      >
        <LinkifiedText text={m.body} />
      </p>
      <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">
        {label && `${label} · `}
        {shortWhen(m.createdAt)}
      </span>
    </div>
  );
}
