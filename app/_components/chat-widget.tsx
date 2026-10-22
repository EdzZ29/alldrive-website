"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { Loader2, MessageCircle, Phone, SendHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { site, whatsappLink } from "@/lib/site";
import { CHAT_MAX_LENGTH, chatGreeting, quickAnswer, quickTopics, type ChatMessage, type QuickTopicId } from "@/lib/chat";
import { Input } from "@/components/ui/input";
import { useCatalog } from "./catalog-provider";
import { LinkifiedText } from "./linkified-text";
import { WhatsAppIcon } from "./brand";

// ---------- The visitor's chat, remembered in this browser ----------

type Session = { token: string; name: string; contact: string; seen: number };
const SESSION_KEY = "alldrive-chat";
let cached: Session | null | undefined;
const listeners = new Set<() => void>();

function readSession(): Session | null {
  if (cached !== undefined) return cached;
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Session | null;
    cached = s && typeof s.token === "string" ? { ...s, seen: Number(s.seen) || 0 } : null;
  } catch {
    cached = null;
  }
  return cached;
}
function writeSession(s: Session | null) {
  cached = s;
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked (private mode): the chat lasts until the page is closed.
  }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const useSession = () => useSyncExternalStore(subscribe, readSession, () => null);

// ---------- Once-per-visit flags (sessionStorage: a new visit starts fresh) ----------

// The visitor opened the chat this visit (the bubble stops wiggling).
const OPENED_KEY = "alldrive-chat-opened";
// The "message us here" card was shown this visit.
const TEASER_KEY = "alldrive-chat-teaser";
const flags = new Map<string, boolean>();
const flagListeners = new Set<() => void>();
function readFlag(key: string) {
  if (!flags.has(key)) {
    let value = false;
    try {
      value = sessionStorage.getItem(key) === "1";
    } catch {
      // Storage blocked: the flag lasts until the page is closed.
    }
    flags.set(key, value);
  }
  return flags.get(key)!;
}
function setFlag(key: string) {
  flags.set(key, true);
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // See readFlag.
  }
  flagListeners.forEach((l) => l());
}
const subscribeFlags = (l: () => void) => {
  flagListeners.add(l);
  return () => flagListeners.delete(l);
};
// The server render assumes "already done": no animation or card until the browser knows.
const useVisitFlag = (key: string) => useSyncExternalStore(subscribeFlags, () => readFlag(key), () => true);

// The card appears a moment after the landing page loads, and goes away by itself.
const TEASER_DELAY_MS = 2500;
const TEASER_SHOW_MS = 15000;

// Polling: quick while the window is open, slower in the background (for the unread badge).
const OPEN_POLL_MS = 3000;
const CLOSED_POLL_MS = 15000;

type Shown = { key: string; sender: ChatMessage["sender"]; body: string };

async function chatApi<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/live-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw Object.assign(new Error(data.error || "We couldn't send that. Please try again."), { status: res.status });
  return data;
}

/** Live chat bubble at the bottom right of every public page. */
export function ChatWidget() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname === "/maintenance") return null;
  return <ChatWindow page={pathname} />;
}

function ChatWindow({ page }: { page: string }) {
  const session = useSession();
  const catalog = useCatalog();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Quick answers shown before the chat starts (not saved).
  const [local, setLocal] = useState<Shown[]>([]);
  const [closed, setClosed] = useState(false);
  const [draft, setDraft] = useState("");
  // The first message waits here while the visitor enters their name and number.
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedThisVisit = useVisitFlag(OPENED_KEY);
  const teaserDone = useVisitFlag(TEASER_KEY);
  const [teaserDue, setTeaserDue] = useState(false);
  const startedAt = useRef(0);
  const lastId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const addMessages = useCallback((fresh: ChatMessage[]) => {
    if (!fresh.length) return;
    setMessages((list) => {
      const ids = new Set(list.map((m) => m.id));
      const merged = [...list, ...fresh.filter((m) => !ids.has(m.id))].sort((a, b) => a.id - b.id);
      lastId.current = merged.length ? merged[merged.length - 1].id : 0;
      return merged;
    });
  }, []);

  const reset = useCallback(() => {
    writeSession(null);
    setMessages([]);
    lastId.current = 0;
  }, []);

  // Check for replies.
  const token = session?.token;
  useEffect(() => {
    if (!token) return;
    let stopped = false;
    let timer = 0;
    const poll = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(`/api/live-chat?after=${lastId.current}`, { headers: { "x-chat-token": token }, cache: "no-store" });
          if (res.status === 404) return reset();
          if (res.ok) {
            const data = (await res.json()) as { status: "Open" | "Closed"; messages: ChatMessage[] };
            if (!stopped) {
              addMessages(data.messages);
              setClosed(data.status === "Closed");
            }
          }
        } catch {
          // Offline for a moment; the next check catches up.
        }
      }
      if (!stopped) timer = window.setTimeout(poll, open ? OPEN_POLL_MS : CLOSED_POLL_MS);
    };
    void poll();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [token, open, addMessages, reset]);

  // Replies the visitor hasn't seen: a badge on the bubble.
  const newest = messages.length ? messages[messages.length - 1].id : 0;
  const unread = session ? messages.filter((m) => m.sender !== "visitor" && m.id > session.seen).length : 0;
  useEffect(() => {
    if (open && session && newest > session.seen) writeSession({ ...session, seen: newest });
  }, [open, session, newest]);

  // Keep the latest message in view.
  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, messages.length, local.length, pending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Landing page: "message us here" card, once per visit.
  const landing = page === "/";
  useEffect(() => {
    if (!landing || teaserDone || open) return;
    const show = window.setTimeout(() => setTeaserDue(true), TEASER_DELAY_MS);
    const hide = window.setTimeout(() => setFlag(TEASER_KEY), TEASER_DELAY_MS + TEASER_SHOW_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [landing, teaserDone, open]);
  const showTeaser = landing && teaserDue && !teaserDone && !open && unread === 0;

  // Wiggle until the visitor opens the chat this visit, and whenever a reply is waiting.
  const attention = !open && (!openedThisVisit || unread > 0);

  const toggle = () => {
    if (!startedAt.current) startedAt.current = Date.now();
    if (!open) {
      setFlag(OPENED_KEY);
      setFlag(TEASER_KEY);
    }
    setOpen((o) => !o);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      if ((err as { status?: number }).status === 404) {
        reset();
        setError("That chat has ended. Please send your message again.");
      } else {
        setError(err instanceof Error ? err.message : "We couldn't send that. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  // From the form (Send button) or the Enter key.
  const send = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    if (!session) {
      // First message: ask for a name and number so the team can follow up.
      setPending(text);
      setDraft("");
      return;
    }
    void run(async () => {
      const data = await chatApi<{ messages: ChatMessage[] }>({ action: "send", token: session.token, message: text });
      addMessages(data.messages);
      setDraft("");
    });
  };

  const ask = (id: QuickTopicId) => {
    const topic = quickTopics.find((t) => t.id === id)!;
    if (!session) {
      // Answer right away; nothing to send yet.
      setLocal((list) => [
        ...list,
        { key: `q${list.length}`, sender: "visitor", body: topic.label },
        { key: `a${list.length}`, sender: "auto", body: quickAnswer(id, catalog) },
      ]);
      return;
    }
    void run(async () => {
      const data = await chatApi<{ messages: ChatMessage[] }>({ action: "quick", token: session.token, topic: id });
      addMessages(data.messages);
    });
  };

  const start = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pending || busy) return;
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const contact = String(form.get("contact") ?? "").trim();
    void run(async () => {
      const data = await chatApi<{ token: string | null; messages: ChatMessage[] }>({
        action: "start",
        name,
        contact,
        message: pending,
        page,
        website: form.get("website"),
        startedAt: startedAt.current,
      });
      if (!data.token) return; // Caught by the spam check.
      lastId.current = 0;
      setMessages([]);
      addMessages(data.messages);
      writeSession({ token: data.token, name, contact, seen: data.messages.at(-1)?.id ?? 0 });
      setPending(null);
      setClosed(false);
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) send(e);
  };

  const shown: Shown[] = [
    { key: "greeting", sender: "auto", body: chatGreeting },
    ...local,
    ...messages.map((m) => ({ key: String(m.id), sender: m.sender, body: m.body })),
    ...(pending ? [{ key: "pending", sender: "visitor" as const, body: pending }] : []),
  ];

  return (
    <div data-chat-widget>
      {open && (
        <section
          role="dialog"
          aria-label={`Chat with ${site.name}`}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-white shadow-2xl sm:inset-auto sm:right-5 sm:bottom-24 sm:h-[min(620px,calc(100svh-8rem))] sm:w-[380px] sm:rounded-3xl sm:border sm:border-line"
        >
          <header className="flex items-center gap-3 bg-ink px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white">
            <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-brand text-ink">
              <MessageCircle className="size-5" />
              <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-ink bg-emerald-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold">{site.legalName}</p>
              <p className="text-xs text-white/60">{site.hours} · we reply here</p>
            </div>
            <a href={`tel:${site.phoneHref}`} aria-label={`Call ${site.phones[0].display}`} className="grid size-10 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
              <Phone className="size-4" />
            </a>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="grid size-10 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
              <X className="size-5" />
            </button>
          </header>

          <div ref={listRef} aria-live="polite" className="flex-1 space-y-2 overflow-y-auto overscroll-contain bg-muted/40 px-3 py-4">
            {shown.map((m) => (
              <Bubble key={m.key} sender={m.sender} body={m.body} />
            ))}

            {pending && (
              <form method="post" onSubmit={start} className="ml-auto grid max-w-[88%] gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm">
                <p className="text-sm font-semibold">So we can reply, please tell us:</p>
                <Input name="name" required maxLength={100} autoComplete="name" placeholder="Your name" aria-label="Your name" className="h-10 rounded-xl bg-white" />
                <Input
                  name="contact"
                  required
                  type="tel"
                  inputMode="tel"
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="Mobile number, e.g. 0917 123 4567"
                  aria-label="Mobile number"
                  className="h-10 rounded-xl bg-white"
                />
                {/* Honeypot: hidden from people, filled in by spam bots. */}
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(pending);
                      setPending(null);
                    }}
                    className="h-10 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Back
                  </button>
                  <button type="submit" disabled={busy} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-bold text-white disabled:opacity-60">
                    {busy && <Loader2 className="size-4 animate-spin" />} Send message
                  </button>
                </div>
              </form>
            )}

            {closed && session && (
              <p className="px-2 text-center text-xs text-muted-foreground">Our team closed this chat. Send a message to continue it.</p>
            )}
          </div>

          {!pending && (
            <div className="border-t border-line bg-white px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2" aria-label="Quick questions">
                {quickTopics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => ask(t.id)}
                    disabled={busy}
                    className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ink disabled:opacity-60"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {error && (
                <p role="alert" className="pb-2 text-xs font-semibold text-red-600">
                  {error}
                </p>
              )}
              <form onSubmit={send} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  maxLength={CHAT_MAX_LENGTH}
                  placeholder="Type your message…"
                  aria-label="Message"
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-white px-3.5 py-2.5 text-base outline-none field-sizing-content focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  aria-label="Send"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-ink transition hover:bg-ink hover:text-white disabled:opacity-50"
                >
                  {busy ? <Loader2 className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
                </button>
              </form>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-ink"
              >
                <WhatsAppIcon className="size-3.5" /> Prefer WhatsApp? Chat with us there
              </a>
            </div>
          )}
        </section>
      )}

      {showTeaser && (
        <div
          role="status"
          className="fixed right-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)] z-40 w-[min(17.5rem,calc(100vw-2rem))] animate-pop-in sm:right-5 sm:bottom-24"
        >
          <div className="relative rounded-2xl bg-white shadow-[0_18px_40px_-12px_rgba(7,12,22,0.45)] ring-1 ring-line">
            <button onClick={toggle} className="block w-full p-4 pr-10 text-left">
              <span className="block text-sm font-bold text-ink">Hi there! 👋 Got a question about renting?</span>
              <span className="mt-1 block text-sm text-muted-foreground">Message us right here. We&apos;re open 24 hours and happy to help.</span>
              <span className="mt-2 block text-sm font-bold text-brand-700">Chat with us →</span>
            </button>
            <button
              onClick={() => setFlag(TEASER_KEY)}
              aria-label="Dismiss"
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
            <span aria-hidden className="absolute right-6 -bottom-1.5 size-3 rotate-45 border-r border-b border-line bg-white" />
          </div>
        </div>
      )}

      <button
        onClick={toggle}
        aria-label={open ? "Close chat" : `Chat with us${unread ? ` (${unread} new)` : ""}`}
        aria-expanded={open}
        className={cn(
          "fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full bg-brand text-ink shadow-[0_12px_32px_-8px_rgba(7,12,22,0.55)] transition hover:-translate-y-0.5 sm:right-5 sm:bottom-5",
          open && "max-sm:hidden",
        )}
      >
        {attention && <span aria-hidden className="absolute inset-0 rounded-full bg-brand opacity-70 motion-safe:animate-ping-slow" />}
        {open ? <X className="size-6" /> : <MessageCircle className={cn("relative size-6", attention && "motion-safe:animate-nudge")} />}
        {!open && unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}

function Bubble({ sender, body }: { sender: ChatMessage["sender"]; body: string }) {
  const mine = sender === "visitor";
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      {!mine && (
        <span className="mb-0.5 px-1 text-[11px] font-semibold text-muted-foreground">
          {sender === "auto" ? "Automatic reply" : `${site.name} team`}
        </span>
      )}
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-line",
          mine ? "rounded-br-md bg-ink text-white" : "rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-line",
        )}
      >
        <LinkifiedText text={body} />
      </p>
    </div>
  );
}
