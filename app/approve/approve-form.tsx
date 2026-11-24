"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Copy, Check, Loader2, MessageSquareText, Send } from "lucide-react";
import type { ApprovalBooking } from "@/lib/approval";
import { approvedTextMessage, phoneLink, type ApprovedBooking } from "@/lib/booking-email";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/app/_components/brand";
import { sendApproval, type ApprovalResult } from "./actions";

const inputClass = "h-11 rounded-xl bg-white px-3.5 text-base md:text-sm";
const textBusiness = { name: site.legalName, phones: site.phones, whatsappNumber: site.whatsappNumber, messenger: site.messenger, address: site.address.full, directionsUrl: site.directionsUrl };

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="block text-sm leading-snug font-semibold">
        {label}
        {hint && <span className="font-normal text-muted-foreground"> {hint}</span>}
      </Label>
      {children}
    </div>
  );
}

export function ApproveForm({ token, booking: b }: { token: string; booking: ApprovalBooking }) {
  const [car, setCar] = useState(b.car);
  const [total, setTotal] = useState(b.estimate);
  const [handover, setHandover] = useState("Pick up at our office");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<ApprovalResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, startSending] = useTransition();

  const approved: ApprovedBooking = { ...b, car: car.trim() || b.car, total: total.trim() || b.estimate, handover: handover.trim() || "Pick up at our office", note: note.trim() };
  const text = approvedTextMessage(approved, textBusiness);
  const tel = phoneLink(b.contact);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startSending(async () => setResult(await sendApproval(token, data)));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the text is still on screen to select.
    }
  };

  const rows: [string, string][] = [
    ["Reference", b.reference],
    ["Customer", b.name],
    ["Contact #", b.contact],
    ["Email", b.email || "Not provided"],
    ["Pickup", b.pickup],
    ["Return", `${b.returnAt} (${b.days} day${b.days > 1 ? "s" : ""})`],
    ["Service", b.service],
    ["Destination", b.destination],
  ];

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-line bg-white p-6">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[9rem_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-semibold break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-line bg-white p-6">
        <p className="font-display text-lg font-bold">What the customer will see</p>
        <Field id="car" label="Car" hint="(add the plate or color if you like)">
          <Input id="car" name="car" value={car} onChange={(e) => setCar(e.target.value)} maxLength={160} className={inputClass} />
        </Field>
        <Field id="total" label="Total price">
          <Input id="total" name="total" value={total} onChange={(e) => setTotal(e.target.value)} maxLength={120} className={inputClass} />
        </Field>
        <Field id="handover" label="Pickup or delivery">
          <Input
            id="handover"
            name="handover"
            value={handover}
            onChange={(e) => setHandover(e.target.value)}
            maxLength={200}
            placeholder="e.g. We deliver the car to Bancasi Airport"
            className={inputClass}
          />
        </Field>
        <Field id="note" label="Note to the customer" hint="(optional)">
          <Textarea
            id="note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="e.g. Please send the 50% down payment by GCash to 0946 126 0177."
            className="rounded-xl bg-white px-3.5 py-2.5 text-base md:text-sm"
          />
        </Field>

        {b.email ? (
          <>
            {result?.ok ? (
              <p role="status" className="flex gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <CircleCheck className="mt-0.5 size-4 shrink-0" />
                <span>
                  Approval email sent to <b>{result.to}</b> ({result.sentAt}). A copy is in the team inbox. Sending again sends another email.
                </span>
              </p>
            ) : (
              result && (
                <p role="alert" className="flex gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-900">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" /> {result.error}
                </p>
              )
            )}
            <Button type="submit" variant="ink" size="xl" disabled={sending} className="w-full">
              {sending ? <Loader2 className="animate-spin" /> : <Send />} {result?.ok ? "Send again" : `Send approval email to ${b.email}`}
            </Button>
          </>
        ) : (
          <p className="flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {b.name.split(/\s+/)[0]} didn&apos;t leave an email. Send the confirmation below by text or WhatsApp.
          </p>
        )}
      </form>

      <section className="grid gap-3 rounded-3xl border border-line bg-white p-6">
        <p className="font-display text-lg font-bold">{b.email ? "Also let them know by text" : "Confirmation text"}</p>
        <pre className="rounded-2xl bg-muted/60 p-4 font-sans text-sm whitespace-pre-wrap">{text}</pre>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button asChild variant="outline" className="h-11 rounded-xl border-line font-bold">
            <a href={`sms:${tel}?&body=${encodeURIComponent(text)}`}>
              <MessageSquareText /> Text
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl border-line font-bold">
            <a href={`https://api.whatsapp.com/send?phone=${tel.replace(/\D/g, "")}&text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-4" /> WhatsApp
            </a>
          </Button>
          <Button type="button" variant="outline" onClick={copy} className="h-11 rounded-xl border-line font-bold">
            {copied ? <Check className="text-emerald-600" /> : <Copy />} {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </section>
    </div>
  );
}
