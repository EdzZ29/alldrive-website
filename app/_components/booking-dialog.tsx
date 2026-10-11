"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  Copy,
  KeyRound,
  Loader2,
  MessageSquareText,
  Pencil,
  Send,
  UserCheck,
} from "lucide-react";
import { submitBooking } from "@/app/actions/booking";
import { bookingRows, type BookingDetails } from "@/lib/booking-email";
import { cn } from "@/lib/utils";
import { driverRate, estimateTrip, findPlace, fleet, models, peso, site, zones, type VehicleId } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MessengerIcon } from "./brand";
import { DestinationSelect } from "./destination-select";

type Mode = "self" | "driver";

export type BookingDefaults = {
  vehicleId: VehicleId;
  /** A specific car model; omitted means "any car in this class". */
  modelId?: string;
  placeId?: string;
  days?: number;
  mode?: Mode;
};

// Car choice values: "sedan" = any sedan, "sedan:toyota-vios" = a specific model.
const carValue = (vehicleId: VehicleId, modelId?: string) => (modelId ? `${vehicleId}:${modelId}` : vehicleId);
const parseCar = (value: string) => {
  const [vehicleId, modelId] = value.split(":") as [VehicleId, string | undefined];
  return { vehicleId, model: models.find((m) => m.id === modelId) };
};

const inputClass = "h-11 rounded-xl bg-white px-3.5 text-base md:text-sm";

/** Current local time formatted for a datetime-local input's `min`. */
function nowForInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

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

type Step = "form" | "confirm" | "sent";

function BookingForm({ defaults }: { defaults: BookingDefaults }) {
  const [step, setStep] = useState<Step>("form");
  const [mode, setMode] = useState<Mode>(defaults.mode ?? "self");
  const [car, setCar] = useState(carValue(defaults.vehicleId, defaults.modelId));
  const [placeId, setPlaceId] = useState(defaults.placeId ?? "butuan-city");
  const [days, setDays] = useState(defaults.days ?? 1);
  const [minDate] = useState(nowForInput);
  const [startedAt] = useState(() => Date.now());
  const [snapshot, setSnapshot] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, startSending] = useTransition();

  const withDriver = mode === "driver";
  const { vehicleId, model } = parseCar(car);
  const destination = findPlace(placeId);
  const zone = zones.find((z) => z.id === destination.zone)!;
  const { vehicle, total } = estimateTrip(vehicleId, destination.zone, Math.max(1, days || 1), withDriver);
  const carName = model ? `${model.name} (${vehicle.short})` : `Any ${vehicle.name} (${vehicle.seats})`;
  const estimateText =
    total == null
      ? `Rate on request${withDriver ? ` (+ ${peso(driverRate)}/day driver)` : ""}`
      : `${peso(total)}${withDriver ? ` (incl. ${peso(driverRate)}/day driver)` : ""}`;

  /** The details exactly as they'll be sent, built from the reviewed form snapshot. */
  const detailsFrom = (data: FormData): BookingDetails => {
    const get = (key: string) => String(data.get(key) ?? "").trim();
    const when = get("datetime");
    return {
      name: get("name"),
      contact: get("contact"),
      address: get("address"),
      work: get("work"),
      destination: destination.name,
      zone: zone.label,
      specificPlace: get("place"),
      dateTime: when ? new Date(when).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "",
      car: carName,
      days,
      service: withDriver ? "With driver" : "Self-drive",
      yearsDriving: withDriver ? "N/A (with driver)" : get("years"),
      purpose: get("purpose"),
      estimate: estimateText,
    };
  };

  const textMessage = (d: BookingDetails) =>
    [`Hi ${site.name}! I'd like to book a car.`, "", ...bookingRows(d).map(([k, v]) => `${k}: ${v}`)].join("\n");

  const review = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSnapshot(new FormData(e.currentTarget));
    setError(null);
    setStep("confirm");
  };

  const confirm = () => {
    if (!snapshot) return;
    startSending(async () => {
      const result = await submitBooking(snapshot);
      if (result.ok) setStep("sent");
      else setError(result.error);
    });
  };

  const sendVia = async (channel: "smart" | "globe" | "messenger") => {
    if (!snapshot) return;
    const message = textMessage(detailsFrom(snapshot));
    if (channel === "messenger") {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
      } catch {
        // Clipboard can be blocked; Messenger still opens so they can type it.
      }
      window.open(site.messenger, "_blank", "noopener,noreferrer");
      return;
    }
    const phone = site.phones.find((p) => p.network.toLowerCase() === channel) ?? site.phones[0];
    window.location.assign(`sms:${phone.href}?&body=${encodeURIComponent(message)}`);
  };

  const altChannels = (
    <div className="grid gap-2 sm:grid-cols-3">
      {site.phones.map((p) => (
        <Button
          key={p.href}
          type="button"
          variant="outline"
          onClick={() => sendVia(p.network.toLowerCase() as "smart" | "globe")}
          className="h-auto flex-col gap-0 rounded-xl border-line py-2 font-bold"
        >
          <span className="flex items-center gap-1.5">
            <MessageSquareText className="text-brand-600" /> Text {p.network}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{p.display}</span>
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => sendVia("messenger")}
        className="h-auto flex-col gap-0 rounded-xl border-line py-2 font-bold"
      >
        <span className="flex items-center gap-1.5">
          {copied ? <Check className="text-emerald-600" /> : <MessengerIcon className="text-brand-600" />} Messenger
        </span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <Copy className="size-3" /> {copied ? "Copied, just paste" : "Copies your details"}
        </span>
      </Button>
    </div>
  );

  const header = {
    form: { Icon: CalendarCheck, title: "Book your ride", text: "Fill in your details, then review and confirm your booking." },
    confirm: { Icon: ClipboardCheck, title: "Confirm Booking", text: "Please check your details before sending." },
    sent: { Icon: CircleCheck, title: "Booking sent!", text: "Thank you. We received your booking request." },
  }[step];

  return (
    <>
      <DialogHeader className="text-left">
        <span
          className={cn(
            "grid size-12 place-items-center rounded-2xl",
            step === "sent" ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-600",
          )}
        >
          <header.Icon className="size-6" />
        </span>
        <DialogTitle className="mt-2 font-display text-2xl font-extrabold tracking-tight">{header.title}</DialogTitle>
        <DialogDescription>{header.text}</DialogDescription>
      </DialogHeader>

      {/* Step 1: form. Kept mounted (just hidden) so "Edit details" keeps everything typed. */}
      <form onSubmit={review} className={cn("grid gap-5", step !== "form" && "hidden")}>
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="car" value={car} />
        <input type="hidden" name="placeId" value={placeId} />
        <input type="hidden" name="startedAt" value={startedAt} />
        {/* Honeypot: hidden from people, often filled by spam bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />

        {/* Service */}
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as Mode)}
          aria-label="Service"
          spacing={1}
          className="grid w-full grid-cols-2 rounded-2xl bg-muted p-1.5"
        >
          {[
            { value: "self", label: "Self-drive", Icon: KeyRound },
            { value: "driver", label: "With driver", Icon: UserCheck },
          ].map(({ value, label, Icon }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="h-11 rounded-xl text-sm font-bold text-muted-foreground hover:bg-white/60 data-[state=on]:bg-ink data-[state=on]:text-white"
            >
              <Icon /> {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="bk-name" label="Name">
            <Input id="bk-name" name="name" required maxLength={100} autoComplete="name" placeholder="Juan Dela Cruz" className={inputClass} />
          </Field>
          <Field id="bk-contact" label="Contact #">
            <Input
              id="bk-contact"
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
          <Field id="bk-address" label="Address">
            <Input id="bk-address" name="address" required maxLength={200} autoComplete="street-address" placeholder="Barangay, City" className={inputClass} />
          </Field>
          <Field id="bk-work" label="Work Place / Business">
            <Input id="bk-work" name="work" required maxLength={200} autoComplete="organization" placeholder="Company or business name" className={inputClass} />
          </Field>

          <Field id="bk-route" label="Destination">
            <DestinationSelect id="bk-route" value={placeId} onValueChange={setPlaceId} className={`${inputClass} h-11!`} />
          </Field>
          <Field id="bk-place" label="Specific place" hint=" (optional)">
            <Input id="bk-place" name="place" maxLength={200} placeholder="e.g. Cabadbaran, Tinuy-an Falls" className={inputClass} />
          </Field>

          <Field id="bk-datetime" label="Date & Time of Rental">
            <Input id="bk-datetime" name="datetime" type="datetime-local" required min={minDate} className={inputClass} />
          </Field>
          <Field id="bk-car" label="Preferred Car">
            <Select value={car} onValueChange={setCar}>
              <SelectTrigger id="bk-car" className={`${inputClass} h-11! w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-80">
                {fleet.map((v, i) => (
                  <SelectGroup key={v.id}>
                    {i > 0 && <SelectSeparator />}
                    <SelectLabel className="text-[11px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                      {v.name} · {v.seats}
                    </SelectLabel>
                    <SelectItem value={v.id} className="py-2">
                      Any {v.short.toLowerCase()}
                    </SelectItem>
                    {models
                      .filter((m) => m.category === v.id)
                      .map((m) => (
                        <SelectItem key={m.id} value={carValue(v.id, m.id)} className="py-2">
                          {m.name}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field id="bk-days" label="# of Day(s) Rental">
            <Input
              id="bk-days"
              name="days"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field id="bk-years" label="Length of Years in Driving" hint={withDriver ? " (not needed with driver)" : undefined}>
            <Input
              id="bk-years"
              name="years"
              type="number"
              inputMode="numeric"
              min={0}
              max={70}
              required={!withDriver}
              disabled={withDriver}
              placeholder={withDriver ? "Our driver will handle it" : "e.g. 5"}
              className={inputClass}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field id="bk-purpose" label="Purpose">
              <Textarea
                id="bk-purpose"
                name="purpose"
                required
                maxLength={500}
                rows={2}
                placeholder="e.g. Family outing, business trip, wedding, airport pickup"
                className="min-h-20 rounded-xl bg-white px-3.5 py-2.5 text-base md:text-sm"
              />
            </Field>
          </div>
        </div>

        <EstimateBox label={`${model?.name ?? vehicle.short} · ${zone.label} · ${days || 1} day${days > 1 ? "s" : ""}${withDriver ? ` · driver ${peso(driverRate)}/day` : ""}`} total={total} />

        <Button type="submit" variant="brand" size="xl" className="group h-14 w-full hover:translate-y-0">
          <ClipboardCheck /> Review booking
          <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </form>

      {/* Step 2: confirm */}
      {step === "confirm" && snapshot && (
        <div className="grid gap-5">
          <dl className="grid overflow-hidden rounded-2xl border border-line">
            {bookingRows(detailsFrom(snapshot))
              .filter(([k]) => k !== "Estimated total")
              .map(([k, v]) => (
                <div key={k} className="grid gap-0.5 border-b border-line px-4 py-2.5 last:border-0 odd:bg-muted/60 sm:grid-cols-[11rem_1fr] sm:gap-3">
                  <dt className="text-xs font-medium text-muted-foreground sm:text-sm">{k}</dt>
                  <dd className="text-sm font-semibold break-words">{v || "N/A"}</dd>
                </div>
              ))}
          </dl>

          <EstimateBox label={`${carName} · ${days} day${days > 1 ? "s" : ""}`} total={total} />

          {error && (
            <div role="alert" className="grid gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="flex items-start gap-2 text-sm font-semibold text-red-700">
                <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
              {altChannels}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
            <Button type="button" variant="outline" size="xl" disabled={sending} onClick={() => setStep("form")} className="rounded-2xl border-line font-bold">
              <Pencil /> Edit details
            </Button>
            <Button type="button" variant="brand" size="xl" disabled={sending} onClick={confirm} className="hover:translate-y-0">
              {sending ? <Loader2 className="animate-spin" /> : <Send />}
              {sending ? "Sending your booking…" : "Confirm Booking"}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Your booking is sent to our team. We&apos;ll confirm availability and the final rate as soon as we can.
          </p>
        </div>
      )}

      {/* Step 3: sent */}
      {step === "sent" && snapshot && (
        <div className="grid gap-5">
          <div className="rounded-2xl bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-900">
            We&apos;ll contact you at <span className="font-bold">{String(snapshot.get("contact"))}</span> to confirm your{" "}
            <span className="font-bold">{carName}</span> for <span className="font-bold">{destination.name}</span>. We&apos;re open 24 hours.
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-semibold">Need a faster reply? Send it to us directly too:</p>
            {altChannels}
          </div>
          <DialogClose asChild>
            <Button type="button" variant="ink" size="xl" className="w-full">
              Done
            </Button>
          </DialogClose>
        </div>
      )}
    </>
  );
}

function EstimateBox({ label, total }: { label: string; total: number | null }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-ink px-5 py-4 text-white">
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Estimated total</p>
        <p className="mt-0.5 text-xs text-white/50">{label}</p>
      </div>
      <p className="shrink-0 font-display text-3xl font-extrabold text-brand tabular-nums">
        {total == null ? <span className="text-xl">On request</span> : peso(total)}
      </p>
    </div>
  );
}

export function BookingDialog({ defaults, children }: { defaults: BookingDefaults; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[92svh] gap-5 overflow-y-auto rounded-3xl p-5 sm:max-w-2xl sm:p-7">
        {/* Mounted only while open, so it always starts from the current picks. */}
        <BookingForm defaults={defaults} />
      </DialogContent>
    </Dialog>
  );
}
