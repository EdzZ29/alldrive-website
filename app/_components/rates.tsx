"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { fleet, peso, routes, type VehicleId } from "@/lib/site";
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
          Daily self-drive rates by destination. What you see is what you pay.
        </SectionHeading>

        {/* Tablet and desktop: full comparison table */}
        <Card data-reveal className="mt-16 hidden gap-0 rounded-[1.75rem] border border-line p-0 ring-0 md:flex">
          <Table onMouseLeave={() => setHoverCol(null)}>
            <TableCaption className="sr-only">Daily car rental rates in Philippine pesos by vehicle and destination</TableCaption>
            <TableHeader>
              <TableRow className="border-0 bg-ink hover:bg-ink">
                <TableHead className="h-auto px-6 py-6 text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Destination</TableHead>
                {fleet.map((v) => (
                  <TableHead
                    key={v.id}
                    onMouseEnter={() => setHoverCol(v.id)}
                    className={cn(
                      "h-auto px-4 py-6 text-center text-white transition-colors duration-300",
                      hoverCol === v.id && "bg-brand text-ink",
                    )}
                  >
                    <span className="block font-display text-base font-bold lg:text-lg">{v.short}</span>
                    <span className={cn("text-xs font-normal", hoverCol === v.id ? "text-ink/70" : "text-white/50")}>{v.seats}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((r) => (
                <TableRow key={r.id} className="group border-line hover:bg-muted">
                  <TableHead scope="row" className="h-auto px-6 py-4.5 font-semibold text-foreground">
                    <span className="flex items-center gap-2.5">
                      <MapPin className="size-4 text-brand-600 transition-transform duration-300 group-hover:-translate-y-0.5" />
                      {r.long}
                    </span>
                  </TableHead>
                  {fleet.map((v) => (
                    <TableCell
                      key={v.id}
                      onMouseEnter={() => setHoverCol(v.id)}
                      className={cn(
                        "px-4 py-4.5 text-center text-sm font-semibold tabular-nums transition-colors duration-300 lg:text-base",
                        hoverCol === v.id && "bg-brand-50 text-brand-700",
                      )}
                    >
                      {peso(v.rates[r.id], 2)}
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
              <TabsTrigger
                key={v.id}
                value={v.id}
                className="h-10 rounded-xl px-1 text-xs font-bold text-mute data-active:bg-ink data-active:text-white"
              >
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
                  {routes.map((r, i) => (
                    <li
                      key={r.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="flex animate-pop-in items-center justify-between border-b border-line px-4 py-3.5 last:border-0"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="size-4 text-brand-600" /> {r.long}
                      </span>
                      <span className="font-bold tabular-nums">{peso(v.rates[r.id])}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          All rates are per day. Weekly and monthly rates available on inquiry. Prices may vary on holidays and peak seasons.
        </p>
      </div>
    </section>
  );
}
