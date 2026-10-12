import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarCheck, Check, Clock, MapPinned, Phone, Plane, Snowflake, UserCheck, Users } from "lucide-react";
import {
  driverRate,
  findModel,
  modelPath,
  models,
  peso,
  rateText,
  site,
  vehicleOf,
  zones,
  type CarModel,
} from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookingDialog } from "../../_components/booking-dialog";
import { MessengerIcon } from "../../_components/brand";
import { Contact } from "../../_components/contact";
import { PageHero } from "../../_components/page-hero";
import { ModelGallery } from "./model-gallery";

export function generateStaticParams() {
  return models.map((m) => ({ slug: m.id }));
}

function details(model: CarModel) {
  const vehicle = vehicleOf(model);
  const seats = model.seats ?? vehicle.seats;
  return { vehicle, seats, from: vehicle.rates.butuan, people: seats.replace(/ seats?$/, "") };
}

export async function generateMetadata({ params }: PageProps<"/fleet/[slug]">): Promise<Metadata> {
  const model = findModel((await params).slug);
  if (!model) return {};
  const { vehicle, seats, from } = details(model);
  const price = from == null ? "Rates on request" : `Self-drive from ${peso(from)}/day`;
  return pageMetadata({
    title: `${model.name} for Rent in Butuan City`,
    description: `Rent a ${model.name} (${vehicle.name}, ${seats}) in Butuan City. ${price}, or with a professional driver for ${peso(driverRate)}/day. Open 24 hours, trips anywhere in Mindanao.`,
    path: modelPath(model.id),
  });
}

function RelatedCard({ model }: { model: CarModel }) {
  const { vehicle, from } = details(model);
  return (
    <Card
      asChild
      className="group gap-0 rounded-[1.5rem] border border-line bg-white p-2 py-2 ring-0 transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_60px_-20px_rgba(7,12,22,0.25)]"
    >
      <Link href={modelPath(model.id)}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.1rem] bg-white">
          <Image
            src={model.variants[0].image}
            alt=""
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex items-end justify-between gap-3 px-3 pt-3 pb-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wider text-brand-600 uppercase">{vehicle.short}</p>
            <p className="font-display leading-tight font-bold transition-colors group-hover:text-brand-600">{model.name}</p>
          </div>
          <p className="shrink-0 text-right text-sm font-bold whitespace-nowrap">
            {from == null ? (
              "On request"
            ) : (
              <>
                {peso(from)}
                <span className="font-normal text-muted-foreground">/day</span>
              </>
            )}
          </p>
        </div>
      </Link>
    </Card>
  );
}

export default async function ModelPage({ params }: PageProps<"/fleet/[slug]">) {
  const model = findModel((await params).slug);
  if (!model) notFound();
  const { vehicle, seats, from, people } = details(model);

  const related = [
    ...models.filter((m) => m.category === model.category && m.id !== model.id),
    ...models.filter((m) => m.category !== model.category),
  ].slice(0, 4);

  const features = [
    { Icon: Users, label: seats },
    { Icon: Snowflake, label: "Air-conditioned" },
    ...(model.specs ?? []).map((label) => ({ Icon: Check, label })),
    ...(model.variants.length > 1 ? [{ Icon: Check, label: `${model.variants.length} colors` }] : []),
  ];

  const notes = [
    {
      Icon: UserCheck,
      title: "Self-drive or with driver",
      body: `Drive it yourself, or add a professional driver for ${peso(driverRate)} a day, any destination.`,
    },
    { Icon: MapPinned, title: "Anywhere in Mindanao", body: "Set daily rates for Butuan City, Caraga, CDO and Davao City, and the rest of Mindanao." },
    { Icon: Plane, title: "Airport pickup", body: "Ask for pickup at Bancasi Airport when you book." },
    { Icon: Clock, title: "Open 24 hours", body: "Call, text or message us any time, day or night." },
  ];

  return (
    <main>
      <PageHero
        crumbs={[
          { label: "Fleet", href: "/fleet" },
          { label: model.name, href: modelPath(model.id) },
        ]}
        eyebrow={`${vehicle.name} · ${seats}`}
        title={
          <>
            {model.name}
            <span className="block text-brand">for rent in Butuan City.</span>
          </>
        }
      >
        {vehicle.blurb}{" "}
        {from == null ? "Message us for current rates." : `Self-drive from ${peso(from)} a day in Butuan City.`}
      </PageHero>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-7">
            <ModelGallery model={model} />

            <ul className="mt-6 flex flex-wrap gap-2">
              {features.map(({ Icon, label }) => (
                <li key={label}>
                  <Badge variant="outline" className="h-9 gap-2 rounded-xl border-transparent bg-muted px-3.5 text-sm">
                    <Icon className="text-brand-600" /> {label}
                  </Badge>
                </li>
              ))}
            </ul>

            <h2 className="mt-12 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">About the {model.name}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-mute">
              The {model.name} is part of our {vehicle.name} lineup and seats {people} people. {vehicle.blurb} Rent it
              for a day, a week or a month, for trips around Butuan City or anywhere in Mindanao.
            </p>

            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {notes.map(({ Icon, title, body }, i) => (
                <li key={title} data-reveal style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
                  <Card className="h-full gap-2 rounded-2xl border border-line bg-white p-5 ring-0">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-1 font-display font-bold">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>

          <aside className="min-w-0 lg:col-span-5">
            <Card className="gap-0 rounded-[1.75rem] border-0 bg-ink p-6 text-white ring-0 sm:p-8 lg:sticky lg:top-28">
              <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">Daily rate</p>
              {from == null ? (
                <p className="mt-3 font-display text-4xl font-extrabold">On request</p>
              ) : (
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-sm text-white/55">from</span>
                  <span className="font-display text-5xl font-extrabold tracking-tight text-brand">{peso(from)}</span>
                  <span className="text-sm text-white/55">/ day</span>
                </p>
              )}

              <h2 className="mt-7 text-sm font-semibold text-white/80">Self-drive rate by destination</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {zones.map((z) => (
                  <li key={z.id} className="flex justify-between rounded-lg px-3 py-2 odd:bg-white/5">
                    <span className="text-white/65">{z.label}</span>
                    <span className="font-semibold tabular-nums">{rateText(vehicle.rates[z.id])}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-white/65">
                  <UserCheck className="size-4 text-brand" /> Add a driver
                </span>
                <span className="font-semibold tabular-nums">+ {peso(driverRate)} / day</span>
              </p>

              <BookingDialog defaults={{ vehicleId: model.category, modelId: model.id }}>
                <Button variant="brand" size="xl" className="group mt-7 w-full">
                  <CalendarCheck /> Book this car
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </BookingDialog>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {site.phones.map((p) => (
                  <Button
                    key={p.href}
                    asChild
                    variant="outline"
                    size="md"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <a href={`tel:${p.href}`}>
                      <Phone className="text-brand" /> {p.network}
                    </a>
                  </Button>
                ))}
              </div>
              <Button
                asChild
                variant="outline"
                size="md"
                className="mt-2 w-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <a href={site.messenger} target="_blank" rel="noopener noreferrer">
                  <MessengerIcon className="text-brand" /> Message us on Messenger
                </a>
              </Button>
            </Card>
          </aside>
        </div>
      </section>

      <section className="dot-grid py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">More cars you might like</h2>
            <Button asChild variant="outline-ink" size="md" className="group w-fit">
              <Link href="/fleet">
                View all {models.length} cars
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((m) => (
              <RelatedCard key={m.id} model={m} />
            ))}
          </div>
        </div>
      </section>

      <Contact />
    </main>
  );
}
