"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Phone, SendHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { site, whatsappLink } from "@/lib/site";
import { CHAT_MAX_LENGTH, chatGreeting, quickAnswer, quickTopics, type ChatSender, type QuickTopicId } from "@/lib/chat";
import { useCatalog } from "./catalog-provider";
import { LinkifiedText } from "./linkified-text";
import { MessengerIcon, WhatsAppIcon } from "./brand";

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

type Shown = { key: string; sender: ChatSender; body: string };

/**
 * Chat bubble at the bottom right of every public page: instant answers to common questions,
 * and typed messages go to our WhatsApp (or Messenger) with the text already filled in.
 */
export function ChatWidget() {
  const pathname = usePathname();
  if (pathname.startsWith("/approve") || pathname === "/maintenance") return null;
  return <ChatWindow page={pathname} />;
}

function ChatWindow({ page }: { page: string }) {
  const catalog = useCatalog();
  const [open, setOpen] = useState(false);
  const [shownAnswers, setShownAnswers] = useState<Shown[]>([]);
  const [draft, setDraft] = useState("");
  const openedThisVisit = useVisitFlag(OPENED_KEY);
  const teaserDone = useVisitFlag(TEASER_KEY);
  const [teaserDue, setTeaserDue] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, shownAnswers.length]);

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
  const showTeaser = landing && teaserDue && !teaserDone && !open;

  // Wiggle until the visitor opens the chat this visit.
  const attention = !open && !openedThisVisit;

  const toggle = () => {
    if (!open) {
      setFlag(OPENED_KEY);
      setFlag(TEASER_KEY);
    }
    setOpen((o) => !o);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Typed messages open WhatsApp with the text ready to send.
  const send = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
    setDraft("");
  };

  const ask = (id: QuickTopicId) => {
    const topic = quickTopics.find((t) => t.id === id)!;
    setShownAnswers((list) => [
      ...list,
      { key: `q${list.length}`, sender: "visitor", body: topic.label },
      { key: `a${list.length}`, sender: "auto", body: quickAnswer(id, catalog) },
    ]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) send(e);
  };

  const shown: Shown[] = [{ key: "greeting", sender: "auto", body: chatGreeting }, ...shownAnswers];

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
              <p className="text-xs text-white/60">{site.hours} · replies on WhatsApp</p>
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
          </div>

          <div className="border-t border-line bg-white px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2" aria-label="Quick questions">
              {quickTopics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => ask(t.id)}
                  className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ink"
                >
                  {t.label}
                </button>
              ))}
            </div>
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
                disabled={!draft.trim()}
                aria-label="Send on WhatsApp"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-ink transition hover:bg-ink hover:text-white disabled:opacity-50"
              >
                <SendHorizontal className="size-5" />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <WhatsAppIcon className="size-3.5" /> Sends on WhatsApp
              </span>
              <a href={site.messenger} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-ink">
                <MessengerIcon className="size-3.5" /> Or use Messenger
              </a>
            </div>
          </div>
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
              <span className="mt-1 block text-sm text-muted-foreground">Get instant answers here, or message us. We&apos;re open 24 hours and happy to help.</span>
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
        aria-label={open ? "Close chat" : "Chat with us"}
        aria-expanded={open}
        className={cn(
          "fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full bg-brand text-ink shadow-[0_12px_32px_-8px_rgba(7,12,22,0.55)] transition hover:-translate-y-0.5 sm:right-5 sm:bottom-5",
          open && "max-sm:hidden",
        )}
      >
        {attention && <span aria-hidden className="absolute inset-0 rounded-full bg-brand opacity-70 motion-safe:animate-ping-slow" />}
        {open ? <X className="size-6" /> : <MessageCircle className={cn("relative size-6", attention && "motion-safe:animate-nudge")} />}
      </button>
    </div>
  );
}

function Bubble({ sender, body }: { sender: ChatSender; body: string }) {
  const mine = sender === "visitor";
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      {!mine && <span className="mb-0.5 px-1 text-[11px] font-semibold text-muted-foreground">Automatic reply</span>}
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
