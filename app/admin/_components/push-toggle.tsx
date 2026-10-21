"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, Share, SquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { errorText } from "../_lib/api";
import { checkPush, disablePush, enablePush, type PushStatus } from "../_lib/push";

const TEXT: Record<PushStatus, { title: string; note: string }> = {
  on: { title: "Notifications are on", note: "This device alerts you for every new booking and inquiry, even when this page is closed." },
  off: { title: "Notifications are off", note: "Turn them on to get an alert on this device for every new booking and inquiry." },
  denied: {
    title: "Notifications are blocked",
    note: "Allow notifications for this site in your browser settings (the lock icon next to the address), then reload.",
  },
  unsupported: { title: "Not supported here", note: "This browser can't receive push notifications. Try Chrome, Edge, Firefox or Safari." },
  "ios-install": {
    title: "Add to Home Screen first",
    note: "On iPhone and iPad (iOS 16.4 or later), notifications only work from the Home Screen app.",
  },
  unconfigured: { title: "Not set up yet", note: "The server has no push keys yet (VAPID_* settings)." },
};

/** "Enable notifications" control for this device. */
export function PushToggle({ onChange }: { onChange?: (status: PushStatus) => void } = {}) {
  const [status, setStatusState] = useState<PushStatus | null>(null);
  // Stable, so the status check below runs once.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const setStatus = useCallback((s: PushStatus) => {
    setStatusState(s);
    onChangeRef.current?.(s);
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    checkPush()
      .then((s) => active && setStatus(s))
      .catch((err) => {
        console.error("[push] Couldn't check notification status:", err);
        if (active) {
          setStatus("off");
          setError(errorText(err, "Couldn't check notification status."));
        }
      });
    return () => {
      active = false;
    };
  }, [setStatus]);

  const run = async (action: () => Promise<PushStatus>) => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await action());
    } catch (err) {
      console.error("[push]", err);
      setError(errorText(err, "Couldn't change notifications on this device. Please try again."));
      setStatus(typeof Notification !== "undefined" && Notification.permission === "denied" ? "denied" : "off");
    } finally {
      setBusy(false);
    }
  };

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking notifications…
      </div>
    );
  }

  const Icon = status === "on" ? BellRing : status === "off" ? Bell : BellOff;
  const { title, note } = TEXT[status];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            status === "on" ? "bg-emerald-50 text-emerald-600" : status === "off" ? "bg-brand-50 text-brand-600" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-muted-foreground">{note}</p>
          {status === "ios-install" && (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs font-medium">
              In Safari tap <Share className="size-3.5" /> Share, then <SquarePlus className="size-3.5" /> Add to Home Screen. Open
              AllDrive Admin from your Home Screen and turn notifications on there.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      {status === "off" && (
        <Button variant="brand-light" size="md" disabled={busy} onClick={() => run(enablePush)} className="shrink-0">
          {busy ? <Loader2 className="animate-spin" /> : <BellRing />} Enable notifications
        </Button>
      )}
      {status === "on" && (
        <Button variant="outline" size="md" disabled={busy} onClick={() => run(disablePush)} className="shrink-0 rounded-xl border-line">
          {busy ? <Loader2 className="animate-spin" /> : <BellOff />} Turn off
        </Button>
      )}
    </div>
  );
}
