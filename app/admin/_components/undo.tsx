"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { errorText } from "../_lib/api";

/** Fired on window after something is restored, so open lists can reload. */
export const RESTORED_EVENT = "alldrive:restored";
const SHOW_MS = 10_000;

type Item = { key: number; text: string; restore: () => Promise<unknown>; state: "idle" | "busy" | "done" | "error"; error?: string };
type Offer = (text: string, restore: () => Promise<unknown>) => void;

const UndoContext = createContext<Offer>(() => {});

/** After deleting something: `offerUndo("Booking AD-… deleted", () => api(... restore))`. */
export const useUndo = () => useContext(UndoContext);

/** Admin pages: run `onRestored` after anything is restored (e.g. reload the list). */
export function useRestoredEvents(onRestored: () => void) {
  useEffect(() => {
    window.addEventListener(RESTORED_EVENT, onRestored);
    return () => window.removeEventListener(RESTORED_EVENT, onRestored);
  }, [onRestored]);
}

/** Bar at the bottom of the dashboard: "… deleted. Undo", for 10 seconds. */
export function UndoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const nextKey = useRef(1);

  const dismiss = useCallback((key: number) => setItems((list) => list.filter((i) => i.key !== key)), []);
  const offer = useCallback<Offer>((text, restore) => {
    const key = nextKey.current++;
    setItems((list) => [...list.slice(-2), { key, text, restore, state: "idle" }]);
  }, []);

  const undo = async (item: Item) => {
    setItems((list) => list.map((i) => (i.key === item.key ? { ...i, state: "busy" } : i)));
    try {
      await item.restore();
      window.dispatchEvent(new Event(RESTORED_EVENT));
      setItems((list) => list.map((i) => (i.key === item.key ? { ...i, state: "done", text: "Restored." } : i)));
      window.setTimeout(() => dismiss(item.key), 2500);
    } catch (err) {
      setItems((list) => list.map((i) => (i.key === item.key ? { ...i, state: "error", error: errorText(err, "Couldn't restore it.") } : i)));
    }
  };

  return (
    <UndoContext.Provider value={offer}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[61] grid justify-items-center gap-2">
        {items.map((item) => (
          <UndoBar key={item.key} item={item} onUndo={() => void undo(item)} onDismiss={() => dismiss(item.key)} />
        ))}
      </div>
    </UndoContext.Provider>
  );
}

function UndoBar({ item, onUndo, onDismiss }: { item: Item; onUndo: () => void; onDismiss: () => void }) {
  // Goes away by itself unless the admin is restoring it right now.
  useEffect(() => {
    if (item.state !== "idle") return;
    const timer = window.setTimeout(onDismiss, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [item.state, onDismiss]);

  return (
    <div role="status" className="pointer-events-auto flex w-full max-w-md animate-in items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-2xl fade-in slide-in-from-bottom-2">
      {item.state === "done" ? <RotateCcw className="size-4 shrink-0 text-brand" /> : <Trash2 className="size-4 shrink-0 text-white/60" />}
      <p className="min-w-0 flex-1">
        <span className="font-semibold">{item.text}</span>
        {item.state === "error" && <span className="block text-xs text-red-300">{item.error}</span>}
      </p>
      {item.state !== "done" && (
        <button
          onClick={onUndo}
          disabled={item.state === "busy"}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 font-bold text-brand hover:bg-white/20 disabled:opacity-60"
        >
          {item.state === "busy" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Undo
        </button>
      )}
      <button onClick={onDismiss} aria-label="Dismiss" className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white">
        <X className="size-4" />
      </button>
    </div>
  );
}
