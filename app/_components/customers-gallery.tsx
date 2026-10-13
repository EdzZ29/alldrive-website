"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Globe, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { customerPhotos } from "@/lib/customers";
import { foreignCustomerShare, googleRating, site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { GoogleIcon } from "./brand";
import { SectionHeading } from "./section-heading";

function Stars({ value, className }: { value: number; className?: string }) {
  const row = (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="size-3.5 shrink-0 fill-current" />
      ))}
    </>
  );
  return (
    <span aria-hidden className={cn("relative inline-flex", className)}>
      <span className="flex text-white/25">{row}</span>
      <span className="absolute inset-y-0 left-0 flex overflow-hidden text-amber-400" style={{ width: `${(value / 5) * 100}%` }}>
        {row}
      </span>
    </span>
  );
}

/** Auto-playing carousel of real customers with their AllDrive rentals. */
export function CustomersGallery() {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const update = () => {
      setSelected(api.selectedScrollSnap());
      setCount(api.scrollSnapList().length);
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  // Autoplay, paused while hovered/focused and for visitors who prefer reduced motion.
  useEffect(() => {
    if (!api || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => api.scrollNext(), 3200);
    return () => window.clearInterval(timer);
  }, [api, paused]);

  return (
    <section id="customers" className="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading index="02" eyebrow="Our customers" title="Happy customers, every trip." dark>
            Real AllDrive customers with their rentals in Butuan City. {foreignCustomerShare}% of them are foreign travelers. Join
            them on your next trip across Mindanao.
          </SectionHeading>

          <div data-reveal style={{ "--d": "200ms" } as React.CSSProperties} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2.5">
              <Globe className="size-6 text-brand" />
              <span className="leading-tight">
                <span className="block font-display text-lg font-bold">{foreignCustomerShare}%</span>
                <span className="text-xs text-white/55">Foreign customers</span>
              </span>
            </div>
            <a
              href={site.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2.5 transition-colors hover:border-white/30"
            >
              <GoogleIcon className="size-6 rounded-full bg-white p-0.5" />
              <span className="leading-tight">
                <span className="flex items-center gap-1.5 font-display text-lg font-bold">
                  {googleRating.value} <Stars value={Number(googleRating.value)} />
                </span>
                <span className="text-xs text-white/55">{googleRating.count} Google reviews</span>
              </span>
            </a>
            <Button
              type="button"
              variant="outline"
              size="icon-xl"
              aria-label="Previous photos"
              onClick={() => api?.scrollPrev()}
              className="hidden border-white/15 bg-transparent text-white hover:bg-white hover:text-ink sm:inline-flex"
            >
              <ArrowLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xl"
              aria-label="Next photos"
              onClick={() => api?.scrollNext()}
              className="hidden border-white/15 bg-transparent text-white hover:bg-white hover:text-ink sm:inline-flex"
            >
              <ArrowRight />
            </Button>
          </div>
        </div>

        <div
          data-reveal
          style={{ "--d": "250ms" } as React.CSSProperties}
          className="mt-14"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }} aria-label="Customer photos">
            <CarouselContent className="-ml-4">
              {customerPhotos.map((p, i) => (
                <CarouselItem key={i} className="basis-[78%] pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <figure className="group relative aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-ink-800">
                    <Image
                      src={p.image}
                      alt={`AllDrive customer with their rental car in Butuan City (${i + 1})`}
                      fill
                      placeholder="blur"
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 78vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <span
                      role="img"
                      aria-label={`Rated ${p.rating.toFixed(1)} out of 5`}
                      className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-md"
                    >
                      <Stars value={p.rating} />
                      {p.rating.toFixed(1)}
                    </span>
                  </figure>
                </CarouselItem>
              ))}

              {/* And many more */}
              <CarouselItem className="basis-[78%] pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <div className="flex aspect-[3/4] flex-col justify-between rounded-[1.75rem] bg-brand p-7 text-ink">
                  <span className="font-display text-6xl leading-none font-extrabold">+</span>
                  <div>
                    <p className="font-display text-3xl leading-tight font-extrabold">And many more happy customers.</p>
                    <p className="mt-3 text-sm text-ink/70">
                      Rated {googleRating.value} on Google from {googleRating.count} reviews.
                    </p>
                    <Button asChild variant="ink" size="md" className="group mt-6">
                      <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">
                        Read the reviews
                        <ArrowUpRight className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>

          {/* Position dots */}
          <div className="mt-8 flex justify-center gap-1.5">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === selected}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === selected ? "w-8 bg-brand" : "w-1.5 bg-white/25 hover:bg-white/50",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
