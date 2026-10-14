"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, Check, ChevronDown, Snowflake, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { fleet, fleetSizeText, modelPath, models, rateText, ratesOf, zones, type CarModel, type VehicleId } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingDialog } from "./booking-dialog";
import { SectionHeading } from "./section-heading";

type Filter = "all" | VehicleId;

const filters: { id: Filter; label: string; count: number }[] = [
  { id: "all", label: "All", count: models.length },
  ...fleet.map((v) => ({ id: v.id, label: v.short, count: models.filter((m) => m.category === v.id).length })),
];

function ModelCard({ model, index }: { model: CarModel; index: number }) {
  const [variant, setVariant] = useState(0);
  const vehicle = fleet.find((v) => v.id === model.category)!;
  const current = model.variants[variant];
  const rates = ratesOf(model);
  const fromRate = rates.butuan;

  return (
    <Card
      style={{ animationDelay: `${index * 70}ms` }}
      className="group animate-pop-in gap-0 rounded-[1.75rem] border border-line bg-white p-2 py-2 ring-0 transition-all duration-500 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_24px_60px_-20px_rgba(7,12,22,0.25)]"
    >
      {/* Photo */}
      <Link
        href={modelPath(model.id)}
        aria-label={`${model.name} details and rates`}
        className="relative block aspect-[16/10] overflow-hidden rounded-[1.35rem] bg-white"
      >
        {model.variants.map((v, i) => (
          <Image
            key={v.label}
            src={v.image}
            alt={`${model.name}${model.variants.length > 1 ? ` in ${v.label}` : ""} for rent in Butuan City`}
            fill
            placeholder="blur"
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              "object-contain transition-all duration-700 ease-out group-hover:scale-105",
              i === variant ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        <Badge variant="secondary" className="absolute top-3 left-3 h-6 px-3 text-[11px] font-bold tracking-wider uppercase">
          {vehicle.short}
        </Badge>
        <Badge
          variant="outline"
          className="absolute top-3 right-3 h-6 gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-bold tracking-wider text-emerald-700 uppercase"
        >
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping-slow rounded-full bg-emerald-400 opacity-75" />
            <span className="relative size-full rounded-full bg-emerald-500" />
          </span>
          Available
        </Badge>
      </Link>

      <CardContent className="flex flex-1 flex-col px-3.5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-tight font-bold tracking-tight sm:text-xl">
              <Link href={modelPath(model.id)} className="transition-colors hover:text-brand-600">
                {model.name}
              </Link>
            </h3>
            {model.variants.length > 1 && <p className="mt-0.5 text-xs text-muted-foreground">{current.label}</p>}
          </div>
          <div className="shrink-0 text-right">
            {fromRate == null ? (
              <p className="mt-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">Rate on request</p>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground">from</p>
                <p className="font-display text-xl leading-none font-extrabold text-brand-600 sm:text-2xl">{rateText(fromRate)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">per day</p>
              </>
            )}
          </div>
        </div>

        {/* Color options */}
        {model.variants.length > 1 && (
          <div role="radiogroup" aria-label={`${model.name} color`} className="mt-3 flex items-center gap-2">
            {model.variants.map((v, i) => (
              <button
                key={v.label}
                type="button"
                role="radio"
                aria-checked={i === variant}
                aria-label={v.label}
                title={v.label}
                onClick={() => setVariant(i)}
                className={cn(
                  "size-7 rounded-full border-2 ring-offset-2 transition-all hover:scale-110",
                  i === variant ? "border-white ring-2 ring-brand" : "border-line",
                )}
                style={{ backgroundColor: v.color }}
              />
            ))}
          </div>
        )}

        <ul className="mt-4 flex flex-wrap gap-1.5">
          <li>
            <Badge variant="outline" className="h-7 gap-1.5 rounded-lg border-transparent bg-muted px-2.5">
              <Users className="text-brand-600" /> {model.seats ?? vehicle.seats}
            </Badge>
          </li>
          <li>
            <Badge variant="outline" className="h-7 gap-1.5 rounded-lg border-transparent bg-muted px-2.5">
              <Snowflake className="text-brand-600" /> A/C
            </Badge>
          </li>
          {(model.specs ?? []).map((t) => (
            <li key={t}>
              <Badge variant="outline" className="h-7 gap-1.5 rounded-lg border-transparent bg-muted px-2.5">
                <Check className="text-brand-600" /> {t}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="mt-auto block border-0 bg-transparent px-3.5 pt-4 pb-3">
        <Collapsible>
          <div className="flex items-center gap-2 border-t border-line pt-4">
            <CollapsibleTrigger className="group/rates flex flex-1 items-center gap-1.5 text-left text-sm font-semibold">
              Rates by zone
              <ChevronDown className="size-4 transition-transform duration-500 group-data-[state=open]/rates:rotate-180" />
            </CollapsibleTrigger>
            <BookingDialog defaults={{ vehicleId: model.category, modelId: model.id }}>
              <Button variant="brand-light" size="md">
                <CalendarCheck /> Book
              </Button>
            </BookingDialog>
          </div>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <ul className="space-y-1 pt-3 text-sm">
              {zones.map((z) => (
                <li key={z.id} className="flex justify-between rounded-lg px-2 py-1.5 odd:bg-muted">
                  <span className="text-muted-foreground">{z.label}</span>
                  <span className="font-semibold tabular-nums">{rateText(rates[z.id])}</span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </CardFooter>
    </Card>
  );
}

export function Fleet() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = filter === "all" ? models : models.filter((m) => m.category === filter);

  return (
    <section id="fleet" className="dot-grid relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading index="01" eyebrow="Our fleet" title={<>Pick your ride.<br />We handle the rest.</>}>
            {fleetSizeText} well-kept cars, from the Toyota Vios to the Hiace GL Grandia. Sanitized and ready for any
            trip across Mindanao.
          </SectionHeading>

          <Tabs
            data-reveal
            style={{ "--d": "200ms" } as React.CSSProperties}
            value={filter}
            onValueChange={(v) => setFilter(v as Filter)}
            className="shrink-0"
          >
            <TabsList
              aria-label="Filter vehicles"
              className="w-auto flex-wrap justify-start gap-2 bg-transparent p-0 group-data-horizontal/tabs:h-auto lg:justify-end"
            >
              {filters.map((f) => (
                <TabsTrigger
                  key={f.id}
                  value={f.id}
                  className="group/tab h-11 flex-none gap-2 rounded-xl border border-line bg-white px-4 font-semibold text-mute shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:text-ink data-active:border-ink data-active:bg-ink data-active:text-white data-active:shadow-lg"
                >
                  {f.label}
                  <span className="rounded-md bg-muted px-1.5 text-xs font-bold text-mute group-data-active/tab:bg-white/15 group-data-active/tab:text-white">
                    {f.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div key={filter} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((m, i) => (
            <ModelCard key={m.id} model={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
