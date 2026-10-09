import Image from "next/image";
import { ArrowUpRight, CalendarRange, Gem, KeyRound, Mountain, Plane, UserCheck } from "lucide-react";
import vansImg from "@/public/images/755736355_1467823295364827_4389632249072634893_n.jpg";
import toursImg from "@/public/images/tours.jpg";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "./section-heading";

const base =
  "group relative gap-0 overflow-hidden rounded-[1.75rem] border text-base ring-0 transition-all duration-500 hover:-translate-y-1";
const tile = `${base} border-white/10 bg-ink-800 p-7 text-white hover:border-brand/50`;
const photoTile = `${base} flex flex-col justify-end border-white/10 bg-ink-800 py-0 text-white hover:border-brand/50`;

function Icon({ icon: I }: { icon: typeof Plane }) {
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/5 text-brand ring-1 ring-white/10 transition-all duration-500 group-hover:rotate-[-10deg] group-hover:bg-brand group-hover:text-ink">
      <I className="size-6" />
    </span>
  );
}

function Arrow() {
  return (
    <ArrowUpRight className="absolute top-7 right-7 size-5 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
  );
}

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
      <div aria-hidden className="grid-lines absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading index="05" eyebrow="What we offer" title="More than a rental." dark>
            From airport pickups to wedding convoys, AllDrive adapts to your journey, not the other way around.
          </SectionHeading>
        </div>

        <div className="mt-14 grid auto-rows-[minmax(15rem,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* With driver: tall photo tile */}
          <Card asChild className={`${photoTile} min-h-[26rem] sm:row-span-2`}>
          <a href="#driver" data-reveal>
            <Image
              src={vansImg}
              alt=""
              fill
              placeholder="blur"
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-75"
            />
            <div className="relative m-3 rounded-2xl bg-ink/90 p-5 backdrop-blur-md">
              <Icon icon={UserCheck} />
              <h3 className="mt-4 font-display text-2xl font-bold">With Driver</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Relax with a professional, courteous driver who knows every route in Northern Mindanao.
              </p>
            </div>
          </a>
          </Card>

          <Card asChild className={tile}>

          <a href="#fleet" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
            <Arrow />
            <Icon icon={KeyRound} />
            <h3 className="mt-6 font-display text-2xl font-bold">Self-Drive</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Hit the road on your own terms, with full independence and flexibility across Caraga.
            </p>
          </a>
          </Card>

          <Card asChild className={`${base} border-brand bg-brand p-7 text-ink hover:border-white`}>
          <a href="#book" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
            <ArrowUpRight className="absolute top-7 right-7 size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand transition-transform duration-500 group-hover:-rotate-12">
              <Plane className="size-6" />
            </span>
            <h3 className="mt-6 font-display text-2xl font-bold">Airport Transfers</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Seamless pickup and drop-off at Bancasi Airport. Start your trip with zero hassle.
            </p>
            <Plane aria-hidden className="absolute -right-6 -bottom-6 size-36 -rotate-12 text-ink/10 transition-transform duration-700 group-hover:translate-x-3 group-hover:-translate-y-3" />
          </a>
          </Card>

          {/* Tours: wide photo tile */}
          <Card asChild className={`${photoTile} min-h-[20rem] sm:col-span-2`}>
          <a href="#book" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            <Image
              src={toursImg}
              alt=""
              fill
              placeholder="blur"
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-85"
            />
            <div className="relative m-3 max-w-md rounded-2xl bg-ink/90 p-5 backdrop-blur-md">
              <Icon icon={Mountain} />
              <h3 className="mt-4 font-display text-2xl font-bold">Tours & Adventures</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Explore Butuan&apos;s river, Buenavista, Tinuy-an Falls and more with a tour-ready fleet.
              </p>
            </div>
          </a>
          </Card>

          <Card asChild className={tile}>

          <a href="#contact" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
            <Arrow />
            <Icon icon={Gem} />
            <h3 className="mt-6 font-display text-2xl font-bold">Wedding Service</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Bridal car and entourage vehicles to make your special day unforgettable.
            </p>
          </a>
          </Card>

          <Card asChild className={`${tile} lg:col-span-2`}>
          <a href="#contact" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
            <Arrow />
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <Icon icon={CalendarRange} />
              <div>
                <h3 className="font-display text-2xl font-bold">Weekly & Monthly Rentals</h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/60">
                  Extended stay or project-based work? Ask about special long-term rates with flexible terms for
                  business or personal use.
                </p>
              </div>
            </div>
          </a>
          </Card>
        </div>
      </div>
    </section>
  );
}
