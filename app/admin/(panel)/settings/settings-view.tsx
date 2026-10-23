"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Trash2, UserPlus, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errorText, type User } from "../../_lib/api";
import { useAdmin } from "../../_components/admin-shell";
import { playChime, setSoundPref, useSoundPref } from "../../_components/live";
import { PushToggle } from "../../_components/push-toggle";
import { Field, PageTitle, pageSlice, Pagination, PasswordInput } from "../../_components/ui";
import { useRestoredEvents, useUndo } from "../../_components/undo";

type Message = { ok: boolean; text: string } | null;
const inputClass = "h-11 rounded-xl bg-white";

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <h2 className="font-bold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Note({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <p role={message.ok ? "status" : "alert"} className={cn("text-sm font-semibold", message.ok ? "text-emerald-700" : "text-red-600")}>
      {message.text}
    </p>
  );
}

export function SettingsView() {
  return (
    <>
      <PageTitle title="Settings" description="Your account, notifications and admin access." />
      <div className="grid gap-4">
        <Section title="Notifications" description="How this device tells you about new bookings and inquiries.">
          <div className="grid gap-4">
            <PushToggle />
            <SoundSetting />
          </div>
        </Section>
        <ProfileSection />
        <PasswordSection />
        <AdminsSection />
      </div>
    </>
  );
}

function SoundSetting() {
  const on = useSoundPref();
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
          <Volume2 className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold">Sound while the dashboard is open</p>
          <p className="text-xs text-muted-foreground">A short chime with the pop-up for each new booking or inquiry.</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="md" onClick={playChime} className="rounded-xl border-line">
          Test
        </Button>
        <Button variant={on ? "ink" : "outline"} size="md" role="switch" aria-checked={on} onClick={() => setSoundPref(!on)} className={cn(!on && "rounded-xl border-line")}>
          {on ? "On" : "Off"}
        </Button>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user, setUser } = useAdmin();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const dirty = name.trim() !== user.name || phone.trim() !== (user.phone ?? "");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setMessage({ ok: false, text: "Enter your name." });
    setBusy(true);
    setMessage(null);
    try {
      setUser(await api<User>("/auth/me", { method: "PATCH", body: { name: name.trim(), phone: phone.trim() } }));
      setMessage({ ok: true, text: "Saved." });
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Your profile" description={user.email}>
      <form method="post" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field id="p-name" label="Name">
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" className={inputClass} />
        </Field>
        <Field id="p-phone" label="Phone">
          <Input id="p-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" className={inputClass} />
        </Field>
        <div className="flex items-center justify-end gap-3 sm:col-span-2">
          <Note message={message} />
          <Button type="submit" variant="brand-light" size="md" disabled={!dirty || busy}>
            {busy && <Loader2 className="animate-spin" />} Save
          </Button>
        </div>
      </form>
    </Section>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setMessage({ ok: false, text: "Use at least 8 characters for the new password." });
    if (next !== confirm) return setMessage({ ok: false, text: "The new passwords don't match." });
    setBusy(true);
    setMessage(null);
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: current, newPassword: next } });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage({ ok: true, text: "Password changed. You were signed out on other devices." });
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Password" description="Changing it signs you out everywhere else.">
      <form method="post" onSubmit={save} className="grid gap-3 sm:grid-cols-3">
        <Field id="pw-current" label="Current password">
          <PasswordInput id="pw-current" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className={inputClass} />
        </Field>
        <Field id="pw-new" label="New password">
          <PasswordInput id="pw-new" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required className={inputClass} />
        </Field>
        <Field id="pw-confirm" label="Repeat new password">
          <PasswordInput id="pw-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required className={inputClass} />
        </Field>
        <div className="flex items-center justify-end gap-3 sm:col-span-3">
          <Note message={message} />
          <Button type="submit" variant="brand-light" size="md" disabled={busy || !current || !next}>
            {busy && <Loader2 className="animate-spin" />} Change password
          </Button>
        </div>
      </form>
    </Section>
  );
}

function AdminsSection() {
  const { user } = useAdmin();
  const [admins, setAdmins] = useState<User[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState<number | "add" | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [page, setPage] = useState(1);
  const offerUndo = useUndo();

  const load = useCallback(() => api<User[]>("/users").then(setAdmins, (err) => setMessage({ ok: false, text: errorText(err) })), []);
  useEffect(() => {
    void load();
  }, [load]);
  useRestoredEvents(load);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) return setMessage({ ok: false, text: "Use at least 8 characters for their password." });
    setBusy("add");
    setMessage(null);
    try {
      await api("/auth/admins", { method: "POST", body: { name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password } });
      setForm({ name: "", email: "", password: "" });
      setMessage({ ok: true, text: "Admin added. Share the password with them privately; they can change it in Settings." });
      void load();
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (a: User) => {
    if (a.isActive && !window.confirm(`Turn off ${a.name}'s access? They're signed out right away.`)) return;
    setBusy(a.id);
    setMessage(null);
    try {
      await api(`/users/${a.id}/active`, { method: "PATCH", body: { isActive: !a.isActive } });
      void load();
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  };

  // Deleted admins can't sign in; the account is kept so it can be restored.
  const remove = async (a: User) => {
    if (!window.confirm(`Delete ${a.name}'s admin account? They're signed out right away. You can undo this right after, or restore it later from the Activity log.`)) return;
    setBusy(a.id);
    setMessage(null);
    try {
      await api(`/users/${a.id}`, { method: "DELETE" });
      void load();
      offerUndo(`${a.name}'s admin account deleted`, () => api(`/users/${a.id}/restore`, { method: "POST" }));
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  };

  const shown = pageSlice(admins ?? [], page, 10);
  return (
    <Section title="Admin accounts" description="Everyone who can sign in to this dashboard.">
      {!admins ? (
        <Loader2 className="mx-auto my-6 size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        <ul className="grid gap-2">
          {shown.items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {a.name} {a.id === user.id && <span className="font-normal text-muted-foreground">(you)</span>}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
              </span>
              {a.id !== user.id && (
                <Button variant="outline" size="md" disabled={busy === a.id} onClick={() => void toggle(a)} className={cn("shrink-0 rounded-xl border-line", a.isActive && "text-red-600")}>
                  {busy === a.id && <Loader2 className="animate-spin" />} {a.isActive ? "Turn off" : "Turn on"}
                </Button>
              )}
              {!a.isActive && <span className="shrink-0 text-xs font-semibold text-muted-foreground">Off</span>}
              {a.id !== user.id && (
                <Button variant="ghost" size="icon-lg" disabled={busy === a.id} onClick={() => void remove(a)} aria-label={`Delete ${a.name}`} className="shrink-0 rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600">
                  <Trash2 />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {admins && <Pagination page={shown.page} limit={shown.limit} total={shown.total} onPage={setPage} />}

      <form method="post" onSubmit={add} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
        <Field id="a-name" label="Name">
          <Input id="a-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={100} className={inputClass} />
        </Field>
        <Field id="a-email" label="Email">
          <Input id="a-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="off" className={inputClass} />
        </Field>
        <Field id="a-password" label="Password">
          <PasswordInput id="a-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
        <div className="flex items-center justify-end gap-3 sm:col-span-3">
          <Note message={message} />
          <Button type="submit" variant="ink" size="md" disabled={busy === "add"}>
            {busy === "add" ? <Loader2 className="animate-spin" /> : <UserPlus />} Add admin
          </Button>
        </div>
      </form>
    </Section>
  );
}
