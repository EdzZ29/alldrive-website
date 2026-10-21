"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  BusFront,
  CarFront,
  CarTaxiFront,
  Calculator,
  CalendarCheck,
  KeyRound,
  MessageSquareText,
  Minus,
  Phone,
  Plus,
  Truck,
  UserCheck,
} from "lucide-react";
import { discountMinDays, findPlace, peso, site, whatsappLink, zones, type VehicleId } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SectionHeading } from "./section-heading";
import { MessengerIcon, ViberIcon, WhatsAppIcon } from "./brand";
import { BookingDialog } from "./booking-dialog";
import { ViberLink } from "./viber-link";
import { DestinationSelect } from "./destination-select";
import { useCatalog } from "./catalog-provider";

const vehicleIcons: Record<VehicleId, typeof CarFront> = {
  sedan: CarTaxiFront,
  mpv: CarFront,
  suv: Truck,
  van: BusFront,
};

const fieldLabel = "text-xs font-bold tracking-[0.2em] text-white/45 uppercase";

/** Smoothly tweens the displayed number toward `value`. */
function useTween(value: number, duration = 500) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = Math.round(initial + (value - initial) * (1 - Math.pow(1 - t, 3)));
      from.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

export function Estimator() {
  const { fleet, driverRate, estimateTrip } = useCatalog();
  const [mode, setMode] = useState<"self" | "driver">("self");
  const [vehicleId, setVehicleId] = useState<VehicleId>("mpv");
  const [placeId, setPlaceId] = useState("butuan-city");
  const [days, setDays] = useState(1);

  const withDriver = mode === "driver";
  const place = findPlace(placeId);
  const zone = zones.find((z) => z.id === place.zone)!;
  const { vehicle, dailyRate, rental, driver, total } = estimateTrip(vehicleId, place.zone, days, withDriver);
  const shownTotal = useTween(total ?? 0);

  const message =
    `Hi ${site.name}! I'd like to book a ${vehicle.name} (${withDriver ? "with driver" : "self-drive"}) ` +
    `for ${place.name}, ${days} day${days > 1 ? "s" : ""}.${total == null ? "" : ` Estimated total: ${peso(total)}.`} Is it available?`;

  return (
    <section id="book" className="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
      <div aria-hidden className="grid-lines absolute inset-0" />
      {/* Animated road */}
      <svg aria-hidden className="absolute inset-x-0 bottom-10 h-6 w-full opacity-30" preserveAspectRatio="none">
        <line x1="0" y1="12" x2="100%" y2="12" stroke="#27abff" strokeWidth="3" strokeDasharray="22 18" className="animate-dash" />
      </svg>
      <div aria-hidden className="absolute bottom-[42px] left-0 animate-drive text-brand">
        <CarFront className="size-7" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHeading index="02" eyebrow="Instant estimate" title="Plan your trip. See the price." dark>
            Choose how you want to travel, your vehicle and destination. Get a ballpark total in seconds,
            then send it to us to lock in your booking.
          </SectionHeading>

          <ul className="mt-10 space-y-4">
            {[
              { Icon: Calculator, title: "Transparent pricing", body: "Rates per destination, no hidden fees." },
              { Icon: KeyRound, title: "Self-drive freedom", body: "Valid license? Take the wheel." },
              { Icon: UserCheck, title: "Or ride with a pro", body: "Our drivers know Caraga's roads inside out." },
            ].map(({ Icon, title, body }, i) => (
              <li key={title} data-reveal="left" style={{ "--d": `${200 + i * 100}ms` } as React.CSSProperties} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-brand ring-1 ring-white/10">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/55">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal="zoom" className="lg:col-span-7">
          <Card className="gap-0 rounded-[2rem] border border-white/10 bg-ink-800 p-5 text-white ring-0 sm:p-8">
            {/* Mode */}
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => v && setMode(v as "self" | "driver")}
              aria-label="How do you want to travel?"
              spacing={1}
              className="grid w-full grid-cols-2 rounded-2xl bg-ink-700 p-1.5"
            >
              {[
                { value: "self", label: "Self-drive", Icon: KeyRound },
                { value: "driver", label: "With driver", Icon: UserCheck },
              ].map(({ value, label, Icon }) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className="h-11 rounded-xl text-sm font-bold text-white/60 transition-colors duration-300 hover:bg-white/5 hover:text-white data-[state=on]:bg-brand data-[state=on]:text-ink"
                >
                  <Icon /> {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {/* Vehicle */}
            <div className="mt-7">
              <p id="vehicle-label" className={fieldLabel}>Vehicle</p>
              <ToggleGroup
                type="single"
                value={vehicleId}
                onValueChange={(v) => v && setVehicleId(v as VehicleId)}
                aria-labelledby="vehicle-label"
                className="mt-3 grid w-full grid-cols-2 sm:grid-cols-4"
              >
                {fleet.map((v) => {
                  const Icon = vehicleIcons[v.id];
                  return (
                    <ToggleGroupItem
                      key={v.id}
                      value={v.id}
                      variant="outline"
                      className="group/vehicle h-auto flex-col items-start gap-0 rounded-2xl border-white/10 p-3.5 text-left text-white hover:border-white/30 hover:bg-white/5 hover:text-white data-[state=on]:border-brand data-[state=on]:bg-brand/10"
                    >
                      <Icon className="size-6! text-white/60 transition-transform duration-300 group-hover/vehicle:-translate-y-0.5 group-data-[state=on]/vehicle:text-brand" />
                      <span className="mt-3 text-sm font-bold">{v.short}</span>
                      <span className="text-xs font-normal text-white/50">{v.seats}</span>
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto]">
              <div>
                <p id="destination-label" className={fieldLabel}>Destination</p>
                <DestinationSelect
                  dark
                  value={placeId}
                  onValueChange={setPlaceId}
                  aria-labelledby="destination-label"
                  className="mt-3 h-14! rounded-2xl border-white/10 bg-ink-700 px-4 text-base font-semibold text-white focus-visible:border-brand [&>svg]:text-brand"
                />
              </div>

              <div>
                <p className={fieldLabel}>Days</p>
                <div className="mt-3 flex h-14 items-center rounded-2xl border border-white/10 bg-ink-700 p-1.5">
                  <Button
                    variant="ghost"
                    size="icon-xl"
                    aria-label="Fewer days"
                    onClick={() => setDays((d) => Math.max(1, d - 1))}
                    disabled={days === 1}
                    className="text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Minus />
                  </Button>
                  <output aria-live="polite" className="w-14 text-center font-display text-xl font-bold tabular-nums">
                    {days}
                  </output>
                  <Button
                    variant="ghost"
                    size="icon-xl"
                    aria-label="More days"
                    onClick={() => setDays((d) => Math.min(30, d + 1))}
                    className="text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-7 rounded-2xl bg-ink-700 p-5">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white/60">
                    Rental · {dailyRate == null ? "rate on request" : `${peso(dailyRate)} × ${days} day${days > 1 ? "s" : ""}`}
                  </dt>
                  <dd className="font-semibold tabular-nums">{rental == null ? "Ask us" : peso(rental)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/60">Rate zone</dt>
                  <dd className="font-semibold">{zone.label}</dd>
                </div>
                {withDriver && (
                  <div className="flex justify-between">
                    <dt className="text-white/60">Driver fee · {peso(driverRate)} × {days}</dt>
                    <dd className="font-semibold tabular-nums">{peso(driver)}</dd>
                  </div>
                )}
              </dl>
              <Separator className="my-4 bg-white/10" />
              <div className="flex items-end justify-between">
                <div>
                  <p className={fieldLabel}>Estimated total</p>
                  <p className="mt-1 text-xs text-white/40">
                    {withDriver ? `Driver's meals${days > 1 ? " & lodging" : ""} shouldered by renter.` : "Fuel not included."}
                  </p>
                </div>
                <p className="font-display text-4xl font-extrabold text-brand tabular-nums sm:text-5xl">
                  {total == null ? <span className="text-2xl sm:text-3xl">On request</span> : peso(shownTotal)}
                </p>
              </div>
              {days >= discountMinDays && (
                <p className="mt-4 flex animate-pop-in items-center gap-2 rounded-xl bg-brand/15 px-3.5 py-2.5 text-sm text-white">
                  <BadgePercent className="size-4 shrink-0 text-brand" />
                  <span>
                    <span className="font-semibold text-brand">Multi-day discount.</span> Your {days}-day rental qualifies. Final price confirmed upon booking.
                  </span>
                </p>
              )}
            </div>

            <BookingDialog defaults={{ vehicleId, placeId, days, mode }}>
              <Button variant="brand" size="xl" className="group mt-5 h-16 w-full text-lg">
                <CalendarCheck className="size-6!" />
                Book now
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </BookingDialog>

            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Button asChild variant="glass" size="xl" className="border-white/15 bg-transparent">
                <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon /> WhatsApp
                </a>
              </Button>
              <Button asChild variant="glass" size="xl" className="border-white/15 bg-transparent">
                <a href={site.messenger} target="_blank" rel="noopener noreferrer">
                  <MessengerIcon className="text-brand" /> Messenger
                </a>
              </Button>
              <Button asChild variant="glass" size="xl" className="border-white/15 bg-transparent">
                <ViberLink>
                  <ViberIcon /> Viber
                </ViberLink>
              </Button>
            </div>

            {/* Call or text either number; Text opens SMS with the quote filled in */}
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {site.phones.map((p) => (
                <div key={p.href} className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">{p.network}</p>
                    <p className="font-semibold whitespace-nowrap tabular-nums">{p.display}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button asChild variant="brand" size="md" className="h-9 rounded-lg px-3 hover:translate-y-0">
                      <a href={`tel:${p.href}`} aria-label={`Call ${p.network} ${p.display}`}>
                        <Phone /> Call
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="md"
                      className="h-9 rounded-lg border-white/20 bg-transparent px-3 text-white hover:bg-white/10 hover:text-white"
                    >
                      <a href={`sms:${p.href}?&body=${encodeURIComponent(message)}`} aria-label={`Text ${p.network} ${p.display}`}>
                        <MessageSquareText /> Text
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-white/40">
              Estimate only. Final rate confirmed upon booking. Holidays and peak seasons may vary.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
