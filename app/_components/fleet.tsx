"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, Check, ChevronDown, Snowflake, Users } from "lucide-react";
import { fleet, peso, routes, type VehicleId } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeading } from "./section-heading";

type Filter = "all" | VehicleId;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  ...fleet.map((v) => ({ id: v.id, label: v.short })),
];

export function Fleet() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = filter === "all" ? fleet : fleet.filter((v) => v.id === filter);

  return (
    <section id="fleet" className="dot-grid relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading index="01" eyebrow="Our fleet" title={<>Pick your ride.<br />We handle the rest.</>}>
            From compact sedans to 15-seater vans: sanitized, well-maintained and ready for any trip across
            Caraga and beyond.
          </SectionHeading>

          <Tabs
            data-reveal
            style={{ "--d": "200ms" } as React.CSSProperties}
            value={filter}
            onValueChange={(v) => setFilter(v as Filter)}
            className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0"
          >
            <TabsList aria-label="Filter vehicles" className="gap-2 bg-transparent p-0 group-data-horizontal/tabs:h-auto">
              {filters.map((f) => (
                <TabsTrigger
                  key={f.id}
                  value={f.id}
                  className="h-11 flex-none rounded-xl border border-line bg-white px-5 font-semibold text-mute shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:text-ink data-active:border-ink data-active:bg-ink data-active:text-white data-active:shadow-lg"
                >
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div key={filter} className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((v, i) => (
            <Card
              key={v.id}
              style={{ animationDelay: `${i * 90}ms` }}
              className="group animate-pop-in gap-0 rounded-[1.75rem] border border-line bg-white p-2 py-2 ring-0 transition-all duration-500 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_24px_60px_-20px_rgba(7,12,22,0.25)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-muted">
                <Image
                  src={v.image}
                  alt={`${v.name} for rent in Butuan City`}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <Badge variant="secondary" className="absolute top-3 left-3 h-6 px-3 text-[11px] font-bold tracking-wider uppercase">
                  {v.short}
                </Badge>
                <span className="absolute top-3 right-3 grid size-9 translate-y-1 place-items-center rounded-full bg-brand text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>

              <CardContent className="flex flex-1 flex-col px-3.5 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl leading-tight font-bold tracking-tight">{v.name}</h3>
                  <div className="text-right">
                    <p className="font-display text-2xl leading-none font-extrabold text-brand-600">{peso(v.rates.city)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">per day · city</p>
                  </div>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.blurb}</p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  <li>
                    <Badge variant="outline" className="h-7 gap-1.5 rounded-lg border-transparent bg-muted px-2.5">
                      <Users className="text-brand-600" /> {v.seats}
                    </Badge>
                  </li>
                  <li>
                    <Badge variant="outline" className="h-7 gap-1.5 rounded-lg border-transparent bg-muted px-2.5">
                      <Snowflake className="text-brand-600" /> A/C
                    </Badge>
                  </li>
                  {v.tags.map((t) => (
                    <li key={t}>
                      <Badge variant="outline" className="h-7 gap-1.5 rounded-lg border-transparent bg-muted px-2.5">
                        <Check className="text-brand-600" /> {t}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto block border-0 bg-transparent px-3.5 pt-5 pb-3">
                <Collapsible>
                  <CollapsibleTrigger className="group/rates flex w-full items-center justify-between border-t border-line pt-4 text-sm font-semibold">
                    Rates by destination
                    <ChevronDown className="size-4 transition-transform duration-500 group-data-[state=open]/rates:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <ul className="space-y-1 pt-3 text-sm">
                      {routes.map((r) => (
                        <li key={r.id} className="flex justify-between rounded-lg px-2 py-1.5 odd:bg-muted">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="font-semibold tabular-nums">{peso(v.rates[r.id])}</span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
