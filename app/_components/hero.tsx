import Image from "next/image";
import { ArrowRight, CarFront, ChevronDown } from "lucide-react";
import fleetImg from "@/public/images/hero-fleet.jpg";
import { peso, site, startingRate } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink pt-28 pb-24 text-white sm:pt-32 lg:pb-28">
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
      <div aria-hidden className="grid-lines absolute inset-0" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-5 text-center">
        <Badge
          variant="outline"
          className="fade-up h-auto gap-2.5 border-white/15 bg-ink/60 py-1.5 pr-4 pl-2 text-xs font-semibold tracking-wide text-white/85 backdrop-blur-md sm:text-sm"
        >
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
          </span>
          {site.hours} · {site.address.locality}
        </Badge>

        <h1 className="mt-6 font-display text-[clamp(3.4rem,11vw,9.5rem)] leading-[0.88] font-extrabold tracking-[-0.035em]">
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
          Self-drive or with a professional driver. Clean, well-kept sedans, MPVs, SUVs, pickups and vans for city
          errands, airport runs and road trips across Caraga. Daily, weekly or monthly.
        </p>

        <div className="fade-up mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row" style={{ "--d": "500ms" } as React.CSSProperties}>
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
            ["Fleet", "4 classes", "5-15 seats"],
            ["Routes", "7+", "across Mindanao"],
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
