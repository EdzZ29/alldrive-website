"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition, type FormEvent, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Loader2, Send } from "lucide-react";
import { submitInquiry } from "@/app/actions/inquiry";
import { inquiryTopics } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const inputClass = "h-11 rounded-xl bg-white px-3.5 text-base md:text-sm";

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="block text-sm leading-snug font-semibold">
        {label}
        {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}

// False in the prerendered HTML, true once React is running in the browser.
const noop = () => () => {};
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/** "Send us a message" form. Goes straight to the AllDrive team's dashboard. */
export function InquiryForm({ page }: { page: string }) {
  const hydrated = useHydrated();
  const [topic, setTopic] = useState<string>(inquiryTopics[0]);
  // When the visitor started typing, for the minimum-time spam check. Set after mount: reading
  // the clock during render would be frozen into the prerendered page.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("startedAt", String(startedAt.current));
    setError(null);
    startSending(async () => {
      const result = await submitInquiry(data);
      if (!result.ok) return setError(result.error);
      setSentTo(String(data.get("contact")));
      form.reset();
      setTopic(inquiryTopics[0]);
    });
  };

  if (sentTo) {
    return (
      <Card className="gap-4 rounded-[1.75rem] border border-line bg-white p-7 ring-0">
        <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CircleCheck className="size-6" />
        </span>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Message sent!</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Thank you. Our team will get back to you at <span className="font-bold text-ink">{sentTo}</span> as soon as we can.
          We&apos;re open 24 hours.
        </p>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="w-fit rounded-xl border-line font-bold"
          onClick={() => {
            setSentTo(null);
            startedAt.current = Date.now();
          }}
        >
          Send another message
        </Button>
      </Card>
    );
  }

  return (
    <Card className="gap-5 rounded-[1.75rem] border border-line bg-white p-7 ring-0">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Send us a message</h2>
        <p className="mt-1 text-sm text-muted-foreground">Questions about rates, availability or a trip? We&apos;ll call or text you back.</p>
      </div>

      {/* POST, and no submitting before hydration: a native submit must never put details in the URL. */}
      <form method="post" onSubmit={send} className="grid gap-4">
        <input type="hidden" name="topic" value={topic} />
        <input type="hidden" name="page" value={page} />
        {/* Honeypot: hidden from people, often filled by spam bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="iq-name" label="Name">
            <Input id="iq-name" name="name" required maxLength={100} autoComplete="name" placeholder="Juan Dela Cruz" className={inputClass} />
          </Field>
          <Field id="iq-contact" label="Contact #">
            <Input
              id="iq-contact"
              name="contact"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              minLength={7}
              maxLength={30}
              placeholder="09XX XXX XXXX"
              className={inputClass}
            />
          </Field>
          <Field id="iq-email" label="Email" hint=" (optional)">
            <Input
              id="iq-email"
              name="email"
              type="email"
              inputMode="email"
              maxLength={120}
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass}
            />
          </Field>
          <Field id="iq-topic" label="Topic">
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger id="iq-topic" className={`${inputClass} h-11! w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {inquiryTopics.map((t) => (
                  <SelectItem key={t} value={t} className="py-2">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field id="iq-message" label="Message">
          <Textarea
            id="iq-message"
            name="message"
            required
            maxLength={2000}
            rows={4}
            placeholder="e.g. Do you have an Innova available on Dec 24 for 3 days with a driver?"
            className="min-h-28 rounded-xl bg-white px-3.5 py-2.5 text-base md:text-sm"
          />
        </Field>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" variant="brand-light" size="xl" disabled={sending || !hydrated} className="w-full sm:w-fit">
          {sending ? <Loader2 className="animate-spin" /> : <Send />}
          {sending ? "Sending…" : "Send message"}
        </Button>
      </form>
    </Card>
  );
}
