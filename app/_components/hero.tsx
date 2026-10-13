import Image from "next/image";
import { ArrowRight, BadgePercent, CarFront, ChevronDown, MapPin } from "lucide-react";
import fleetImg from "@/public/images/hero-fleet.jpg";
import { discountMinDays, fleetSizeText, peso, places, site, startingRate } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink pt-40 pb-24 text-white sm:pt-44 lg:pb-28">
      {/* Fleet photo background with a solid dark overlay */}
      <Image
        src={fleetImg}
        alt="The AllDrive Rent a Car Butuan fleet: pickup, SUVs and vans parked in Butuan City"
        fill
        preload
        placeholder="blur"
        sizes="100vw"
        className="hero-bg object-cover object-[30%_70%] lg:object-[50%_70%]"
      />
      <div aria-hidden className="absolute inset-0 bg-ink/75" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-5 text-center">
        <Badge
          variant="outline"
          className="fade-up group h-auto gap-3 border-white/15 bg-ink/70 p-1 pr-4 text-xs font-semibold text-white/85 backdrop-blur-md transition-colors hover:border-brand/60 sm:text-sm"
        >
          <span className="flex items-center gap-2 rounded-full bg-brand px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-ink uppercase sm:text-xs">
            <span className="relative flex size-3 rounded-full bg-ink p-0.5">
              <span className="absolute inset-0 animate-ping-slow rounded-full bg-emerald-400 opacity-75" />
              <span className="relative size-full animate-blink rounded-full bg-emerald-400" />
            </span>
            Open 24/7
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-brand transition-transform duration-300 group-hover:-translate-y-0.5 sm:size-4" />
            <span>
              {site.address.locality}
              <span className="hidden text-white/50 sm:inline">, {site.address.region}</span>
            </span>
          </span>
        </Badge>

        <h1 className="mt-6 font-display text-[clamp(3.4rem,11vw,9.5rem)] leading-[0.88] font-extrabold tracking-[-0.035em]">
          {/* Visible search phrase, part of the H1 so Google reads it as the page topic */}
          <span
            className="fade-up mb-5 block font-sans text-sm font-bold tracking-[0.3em] text-white/70 uppercase sm:text-base"
            style={{ "--d": "40ms" } as React.CSSProperties}
          >
            Car Rental in Butuan City
          </span>
          <span className="rise">
            <span style={{ "--d": "80ms" } as React.CSSProperties}>Every road.</span>
          </span>
          <span className="rise">
            <span style={{ "--d": "220ms" } as React.CSSProperties} className="text-brand">
              AllDrive.
            </span>
          </span>
        </h1>

        <p className="fade-up mt-7 max-w-2xl text-lg leading-relaxed text-pretty text-white/80 sm:text-xl" style={{ "--d": "380ms" } as React.CSSProperties}>
          Rent a car in Butuan City, self-drive or with a professional driver. Clean, well-kept sedans, MPVs, SUVs,
          pickups and vans for city errands, Bancasi Airport pickups and road trips across Caraga and Mindanao. Daily,
          weekly or monthly.
        </p>

        <a
          href="#book"
          className="fade-up group mt-8 inline-flex items-center gap-3 rounded-2xl border border-brand/50 bg-brand/15 py-2 pr-4 pl-2 text-left backdrop-blur-md transition-colors hover:border-brand hover:bg-brand/25"
          style={{ "--d": "440ms" } as React.CSSProperties}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-ink">
            <BadgePercent className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-extrabold text-brand sm:text-lg">
              Rent {discountMinDays} days or more and get a discount
            </span>
            <span className="text-xs text-white/70 sm:text-sm">Multi-day trips cost less per day. Ask for your rate.</span>
          </span>
        </a>

        <div className="fade-up mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row" style={{ "--d": "500ms" } as React.CSSProperties}>
          <Button asChild variant="brand" size="xl" className="group">
            <a href="#book">
              <CarFront />
              Get an instant quote
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Button>
          <Button asChild variant="glass" size="xl">
            <a href="#fleet">Browse the fleet</a>
          </Button>
        </div>

        <dl className="fade-up mt-12 grid w-full max-w-xl grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-6" style={{ "--d": "650ms" } as React.CSSProperties}>
          {[
            ["From", peso(startingRate), "per day"],
            ["Fleet", `${fleetSizeText} cars`, "5-15 seats"],
            ["Coverage", `${places.length}+`, "Mindanao places"],
          ].map(([label, value, sub]) => (
            <div key={label} className="px-2 sm:px-4">
              <dt className="text-xs font-medium tracking-widest text-white/55 uppercase">{label}</dt>
              <dd className="mt-1 font-display text-xl font-bold whitespace-nowrap sm:text-3xl">{value}</dd>
              <dd className="text-xs text-white/60">{sub}</dd>
            </div>
          ))}
        </dl>
      </div>

      <a
        href="#fleet"
        aria-label="Scroll to fleet"
        className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 animate-float text-white/60 transition-colors hover:text-brand sm:block"
      >
        <ChevronDown className="size-7" />
      </a>
    </section>
  );
}
