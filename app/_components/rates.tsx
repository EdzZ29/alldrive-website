"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { driverRate, fleet, models, peso, rateText, regions, vehicleOf, zones, type VehicleId } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeading } from "./section-heading";

export function Rates() {
  const [hoverCol, setHoverCol] = useState<VehicleId | null>(null);

  return (
    <section id="rates" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading index="03" eyebrow="Transparent pricing" title="Rental rates, no surprises." center>
          Daily self-drive rates by zone. Add a driver for {peso(driverRate)} per day.
        </SectionHeading>

        {/* Tablet and desktop: comparison table */}
        <Card data-reveal className="mt-16 hidden gap-0 rounded-[1.75rem] border border-line p-0 ring-0 md:flex">
          <Table onMouseLeave={() => setHoverCol(null)}>
            <TableCaption className="sr-only">Daily car rental rates in Philippine pesos by vehicle and zone</TableCaption>
            <TableHeader>
              <TableRow className="border-0 bg-ink hover:bg-ink">
                <TableHead className="h-auto px-6 py-6 text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Rate zone</TableHead>
                {fleet.map((v) => (
                  <TableHead
                    key={v.id}
                    onMouseEnter={() => setHoverCol(v.id)}
                    className={cn("h-auto px-4 py-6 text-center text-white transition-colors duration-300", hoverCol === v.id && "bg-brand text-ink")}
                  >
                    <span className="block font-display text-base font-bold lg:text-lg">{v.short}</span>
                    <span className={cn("text-xs font-normal", hoverCol === v.id ? "text-ink/70" : "text-white/50")}>{v.seats}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((z) => (
                <TableRow key={z.id} className="group border-line hover:bg-muted">
                  <TableHead scope="row" className="h-auto px-6 py-5 font-semibold text-foreground">
                    <span className="flex items-center gap-2.5">
                      <MapPin className="size-4 text-brand-600 transition-transform duration-300 group-hover:-translate-y-0.5" />
                      {z.label}
                    </span>
                  </TableHead>
                  {fleet.map((v) => (
                    <TableCell
                      key={v.id}
                      onMouseEnter={() => setHoverCol(v.id)}
                      className={cn(
                        "px-4 py-5 text-center text-sm font-semibold tabular-nums transition-colors duration-300 lg:text-base",
                        hoverCol === v.id && "bg-brand-50 text-brand-700",
                        v.rates[z.id] == null && "text-muted-foreground",
                      )}
                    >
                      {rateText(v.rates[z.id], 2)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Phones: one vehicle at a time */}
        <Tabs data-reveal defaultValue={fleet[0].id} className="mt-12 gap-4 md:hidden">
          <TabsList aria-label="Choose vehicle" className="grid w-full grid-cols-4 rounded-2xl bg-muted p-1 group-data-horizontal/tabs:h-auto">
            {fleet.map((v) => (
              <TabsTrigger key={v.id} value={v.id} className="h-10 rounded-xl px-1 text-xs font-bold text-mute data-active:bg-ink data-active:text-white">
                {v.id === "suv" ? "SUV" : v.short}
              </TabsTrigger>
            ))}
          </TabsList>
          {fleet.map((v) => (
            <TabsContent key={v.id} value={v.id}>
              <Card className="gap-0 rounded-2xl border border-line p-0 ring-0">
                <p className="flex items-center justify-between bg-ink px-4 py-3 text-white">
                  <span className="font-display font-bold">{v.name}</span>
                  <span className="text-xs text-white/60">{v.seats}</span>
                </p>
                <ul>
                  {zones.map((z, i) => (
                    <li
                      key={z.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="flex animate-pop-in items-center justify-between border-b border-line px-4 py-3.5 last:border-0"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="size-4 text-brand-600" /> {z.label}
                      </span>
                      <span className={cn("font-bold tabular-nums", v.rates[z.id] == null && "text-sm text-muted-foreground")}>
                        {rateText(v.rates[z.id])}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Cars priced differently from their category */}
        {models
          .filter((m) => m.rates)
          .map((m) => (
            <p key={m.id} className="mx-auto mt-6 max-w-3xl rounded-2xl border border-brand/30 bg-brand-50 px-5 py-3 text-center text-sm text-ink">
              <span className="font-bold">{m.name}</span> ({vehicleOf(m).short}) has its own rate:{" "}
              {zones.map((z, i) => (
                <span key={z.id}>
                  {i > 0 && " · "}
                  {z.short} <span className="font-semibold tabular-nums">{rateText(m.rates![z.id])}</span>
                </span>
              ))}
            </p>
          ))}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          All rates are per day. Weekly and monthly rates available on inquiry. Prices may vary on holidays and peak seasons.
        </p>

        {/* Coverage: every Mindanao destination and its zone */}
        <div className="mt-20">
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <h3 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Where each rate applies</h3>
            <p className="mt-3 text-muted-foreground">We drive anywhere in Mindanao. Find your destination below.</p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {/* Butuan, Caraga and CDO/Davao */}
            <div className="grid gap-4">
              {zones
                .filter((z) => z.id !== "outside")
                .map((z, i) => (
                  <Card
                    key={z.id}
                    data-reveal
                    style={{ "--d": `${i * 80}ms` } as React.CSSProperties}
                    className="gap-3 rounded-[1.5rem] border border-line bg-muted p-5 ring-0"
                  >
                    <ZoneHeader zoneId={z.id} />
                    <ul className="flex flex-wrap gap-1.5">
                      {regions
                        .flatMap((r) => r.places)
                        .filter((p) => p.zone === z.id)
                        .map((p) => (
                          <li key={p.id}>
                            <Badge variant="outline" className="h-7 border-line bg-white px-2.5 font-medium">
                              {p.name}
                            </Badge>
                          </li>
                        ))}
                    </ul>
                  </Card>
                ))}
            </div>

            {/* Rest of Mindanao, grouped by region */}
            <Card data-reveal="zoom" className="gap-5 rounded-[1.5rem] border border-line bg-white p-5 ring-0 sm:p-6 lg:col-span-2">
              <ZoneHeader zoneId="outside" />
              <div className="grid gap-5 sm:grid-cols-2">
                {regions.map((r) => {
                  const list = r.places.filter((p) => p.zone === "outside");
                  if (list.length === 0) return null;
                  return (
                    <div key={r.name}>
                      <p className="text-xs font-bold tracking-[0.15em] text-brand-700 uppercase">{r.name}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {list.map((p) => (
                          <li key={p.id}>
                            <Badge variant="outline" className="h-7 border-line bg-muted px-2.5 font-medium">
                              {p.name}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function ZoneHeader({ zoneId }: { zoneId: (typeof zones)[number]["id"] }) {
  const zone = zones.find((z) => z.id === zoneId)!;
  const sedan = fleet.find((v) => v.id === "sedan")!.rates[zoneId];
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <span className="grid size-8 place-items-center rounded-lg bg-ink text-brand">
          <MapPin className="size-4" />
        </span>
        {zone.label}
      </p>
      {sedan != null && (
        <p className="text-right text-xs text-muted-foreground">
          from <span className="font-display text-base font-extrabold text-brand-600">{peso(sedan)}</span>/day
        </p>
      )}
    </div>
  );
}
