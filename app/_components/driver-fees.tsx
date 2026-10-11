import Image from "next/image";
import { BedDouble, CalendarCheck, MapPinned, ShieldCheck, Utensils } from "lucide-react";
import driverImg from "@/public/images/fleet-lineup.jpg";
import { driverRate, peso } from "@/lib/site";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "./section-heading";

const notes = [
  { Icon: MapPinned, title: "Any destination", body: "Same rate whether you stay in Butuan or travel across Mindanao." },
  { Icon: ShieldCheck, title: "Professional & courteous", body: "Experienced drivers who know Caraga and Northern Mindanao roads." },
  { Icon: Utensils, title: "Driver's meals", body: "Meals during the trip are shouldered by the renter." },
  { Icon: BedDouble, title: "Overnight trips", body: "For multi-day trips, the driver's accommodation is shouldered by the renter." },
];

export function DriverFees() {
  return (
    <section id="driver" className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <SectionHeading index="04" eyebrow="With driver" title="Sit back. We'll take the wheel.">
            Add a professional, courteous driver to any rental for one simple daily rate.
          </SectionHeading>

          <div data-reveal style={{ "--d": "200ms" } as React.CSSProperties} className="relative mt-10 aspect-[16/10] overflow-hidden rounded-[1.75rem]">
            <Image
              src={driverImg}
              alt="AllDrive HiAce vans and SUVs lined up, ready with a driver"
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[50%_35%]"
            />
          </div>
        </div>

        <div className="lg:col-span-6">
          <Card data-reveal="right" className="gap-0 rounded-[1.75rem] border-0 bg-ink p-7 text-white ring-0 sm:p-9">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-brand uppercase">
              <CalendarCheck className="size-4" /> Driver rate
            </p>
            <p className="mt-4 flex items-end gap-2">
              <span className="font-display text-6xl font-extrabold tracking-tight text-brand sm:text-7xl">{peso(driverRate)}</span>
              <span className="pb-2 text-lg text-white/60">/ day</span>
            </p>
            <p className="mt-2 text-white/60">Added on top of the vehicle rental rate.</p>
          </Card>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {notes.map(({ Icon, title, body }, i) => (
              <li key={title} data-reveal style={{ "--d": `${150 + i * 80}ms` } as React.CSSProperties}>
                <Card className="group h-full gap-0 rounded-2xl border border-line p-5 ring-0 transition-colors hover:border-brand/50">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:rotate-[-8deg] group-hover:bg-brand group-hover:text-ink">
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-4 font-bold">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
