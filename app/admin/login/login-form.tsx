"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { CircleAlert, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, errorText } from "../_lib/api";
import { PasswordInput } from "../_components/ui";

// Only same-site admin paths, so ?next= can't send someone elsewhere.
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin/bookings";
}

// False in the prerendered HTML, true once React is running in the browser.
const noop = () => () => {};
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

export function LoginForm() {
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(null);
    setBusy(true);
    try {
      await api("/auth/login", {
        method: "POST",
        body: { email: String(data.get("email") ?? "").trim(), password: String(data.get("password") ?? "") },
      });
      // Full navigation so the dashboard starts with the new session cookie.
      window.location.assign(nextPath());
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Wrong email or password." : errorText(err));
      setBusy(false);
    }
  };

  return (
    <Card className="w-full max-w-sm gap-5 rounded-3xl border border-line bg-white p-7 ring-0">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-brand-600 uppercase">AllDrive Admin</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage bookings and inquiries from the website.</p>
      </div>
      {/* POST, and no submitting before hydration: a native form submit must never put the password in the URL. */}
      <form method="post" onSubmit={submit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="admin-email" className="font-semibold">
            Email
          </Label>
          <Input id="admin-email" name="email" type="email" required autoComplete="username" className="h-11 rounded-xl bg-white" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="admin-password" className="font-semibold">
            Password
          </Label>
          <PasswordInput
            id="admin-password"
            name="password"
            required
            autoComplete="current-password"
            className="h-11 rounded-xl bg-white"
          />
        </div>
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}
        <Button type="submit" variant="ink" size="md" disabled={busy || !hydrated} className="w-full">
          {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Sign in
        </Button>
      </form>
    </Card>
  );
}
