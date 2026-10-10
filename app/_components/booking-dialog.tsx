"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarCheck, Check, Copy, KeyRound, MessageSquareText, UserCheck } from "lucide-react";
import { estimateTrip, fleet, peso, routes, site, type RouteId, type VehicleId } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MessengerIcon } from "./brand";

type Mode = "self" | "driver";

export type BookingDefaults = {
  vehicleId: VehicleId;
  routeId: RouteId;
  days: number;
  mode: Mode;
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

function BookingForm({ defaults }: { defaults: BookingDefaults }) {
  const [mode, setMode] = useState<Mode>(defaults.mode);
  const [vehicleId, setVehicleId] = useState<VehicleId>(defaults.vehicleId);
  const [routeId, setRouteId] = useState<RouteId>(defaults.routeId);
  const [days, setDays] = useState(defaults.days);
  const [minDate] = useState(nowForInput);
  const [copied, setCopied] = useState(false);

  const withDriver = mode === "driver";
  const { vehicle, total, driverRate } = estimateTrip(vehicleId, routeId, Math.max(1, days || 1), withDriver);
  const route = routes.find((r) => r.id === routeId)!;

  const buildMessage = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) ?? "").trim() || "N/A";
    const when = String(data.get("datetime") ?? "");
    const whenText = when
      ? new Date(when).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })
      : "N/A";
    const place = String(data.get("place") ?? "").trim();

    return [
      `Hi ${site.name}! I'd like to book a car.`,
      "",
      `Name: ${get("name")}`,
      `Contact #: ${get("contact")}`,
      `Address: ${get("address")}`,
      `Work Place / Business: ${get("work")}`,
      `Destination: ${route.long}${place ? ` (${place})` : ""}`,
      `Date & Time of Rental: ${whenText}`,
      `Preferred Car: ${vehicle.name} (${vehicle.seats})`,
      `# of Day(s) Rental: ${days}`,
      `Service: ${withDriver ? "With driver" : "Self-drive"}`,
      `Length of Years in Driving: ${withDriver ? "N/A (with driver)" : get("years")}`,
      `Purpose: ${get("purpose")}`,
      "",
      `Estimated total: ${peso(total)}${withDriver && !driverRate ? " + driver fee (quoted on request)" : ""}`,
    ].join("\n");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const message = buildMessage(e.currentTarget);
    const action = submitter?.value ?? "smart";

    if (action === "messenger") {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
      } catch {
        // Clipboard can be blocked; Messenger still opens so they can type it.
      }
      window.open(site.messenger, "_blank", "noopener,noreferrer");
      return;
    }

    const phone = site.phones.find((p) => p.network.toLowerCase() === action) ?? site.phones[0];
    window.location.assign(`sms:${phone.href}?&body=${encodeURIComponent(message)}`);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
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
          <Input id="bk-name" name="name" required autoComplete="name" placeholder="Juan Dela Cruz" className={inputClass} />
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
            placeholder="09XX XXX XXXX"
            className={inputClass}
          />
        </Field>
        <Field id="bk-address" label="Address">
          <Input id="bk-address" name="address" required autoComplete="street-address" placeholder="Barangay, City" className={inputClass} />
        </Field>
        <Field id="bk-work" label="Work Place / Business">
          <Input id="bk-work" name="work" required autoComplete="organization" placeholder="Company or business name" className={inputClass} />
        </Field>

        <Field id="bk-route" label="Destination">
          <Select value={routeId} onValueChange={(v) => setRouteId(v as RouteId)}>
            <SelectTrigger id="bk-route" className={`${inputClass} h-11! w-full`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {routes.map((r) => (
                <SelectItem key={r.id} value={r.id} className="py-2">
                  {r.long}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="bk-place" label="Specific place" hint=" (optional)">
          <Input id="bk-place" name="place" placeholder="e.g. Cabadbaran, Tinuy-an Falls" className={inputClass} />
        </Field>

        <Field id="bk-datetime" label="Date & Time of Rental">
          <Input id="bk-datetime" name="datetime" type="datetime-local" required min={minDate} className={inputClass} />
        </Field>
        <Field id="bk-car" label="Preferred Car">
          <Select value={vehicleId} onValueChange={(v) => setVehicleId(v as VehicleId)}>
            <SelectTrigger id="bk-car" className={`${inputClass} h-11! w-full`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {fleet.map((v) => (
                <SelectItem key={v.id} value={v.id} className="py-2">
                  {v.name} · {v.seats}
                </SelectItem>
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
              rows={2}
              placeholder="e.g. Family outing, business trip, wedding, airport pickup"
              className="min-h-20 rounded-xl bg-white px-3.5 py-2.5 text-base md:text-sm"
            />
          </Field>
        </div>
      </div>

      {/* Estimate */}
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-ink px-5 py-4 text-white">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Estimated total</p>
          <p className="mt-0.5 text-xs text-white/50">
            {vehicle.short} · {route.label} · {days || 1} day{days > 1 ? "s" : ""}
            {withDriver ? " · with driver" : ""}
          </p>
        </div>
        <p className="font-display text-3xl font-extrabold text-brand tabular-nums">{peso(total)}</p>
      </div>

      <Separator />

      {/* Send */}
      <div className="grid gap-2">
        <p className="text-sm font-semibold">Send your booking details via</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {site.phones.map((p, i) => (
            <Button
              key={p.href}
              type="submit"
              name="action"
              value={p.network.toLowerCase()}
              variant={i === 0 ? "brand" : "ink"}
              size="xl"
              className="h-auto flex-col gap-0 py-2.5 hover:translate-y-0"
            >
              <span className="flex items-center gap-2">
                <MessageSquareText /> Text {p.network}
              </span>
              <span className="text-xs font-medium opacity-70 tabular-nums">{p.display}</span>
            </Button>
          ))}
          <Button
            type="submit"
            name="action"
            value="messenger"
            variant="outline"
            size="xl"
            className="h-auto flex-col gap-0 rounded-2xl border-line py-2.5 font-bold"
          >
            <span className="flex items-center gap-2">
              {copied ? <Check className="text-emerald-600" /> : <MessengerIcon className="text-brand-600" />}
              Messenger
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Copy className="size-3" /> {copied ? "Copied, just paste" : "Copies your details"}
            </span>
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          We&apos;ll confirm availability and the final rate as soon as we can. Open 24 hours.
        </p>
      </div>
    </form>
  );
}

export function BookingDialog({ defaults, children }: { defaults: BookingDefaults; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[92svh] gap-5 overflow-y-auto rounded-3xl p-5 sm:max-w-2xl sm:p-7">
        <DialogHeader className="text-left">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <CalendarCheck className="size-6" />
          </span>
          <DialogTitle className="mt-2 font-display text-2xl font-extrabold tracking-tight">Book your ride</DialogTitle>
          <DialogDescription>
            Fill in your details and send them to us. We&apos;ll get back to you as soon as we can.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so it always starts from the estimator's current picks. */}
        <BookingForm defaults={defaults} />
      </DialogContent>
    </Dialog>
  );
}
