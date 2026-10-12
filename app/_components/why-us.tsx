import Image from "next/image";
import { BadgeCheck, CarFront, Clock, MessagesSquare, Receipt, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import brandImg from "@/public/images/alldrive.jpg";
import { fleetSize, places, site, startingRate, whatsappLink } from "@/lib/site";
import { ViberIcon, WhatsAppIcon } from "./brand";
import { ViberLink } from "./viber-link";
import { CountUp } from "./count-up";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "./section-heading";
import { Testimonials } from "./testimonials";

const features = [
  { icon: Sparkles, title: "Pristine fleet", body: "Every vehicle is cleaned, sanitized and checked before each rental." },
  { icon: Wallet, title: "Flexible pricing", body: "Daily, weekly and monthly rates that work for you, across every vehicle class." },
  { icon: ShieldCheck, title: "Your choice of comfort", body: "Self-drive for independence or a pro driver for a stress-free trip." },
  { icon: Receipt, title: "Business ready", body: "Official receipts available, ideal for corporate and business travel." },
];

const steps = [
  { icon: CarFront, title: "Pick your ride", body: "Browse the fleet and check rates for your destination." },
  { icon: MessagesSquare, title: "Reserve in minutes", body: "Call, text or message us your dates and route. We confirm fast." },
  { icon: BadgeCheck, title: "Hit the road", body: "Grab the keys, or meet your driver, and enjoy the trip." },
];

export function WhyUs() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading index="06" eyebrow="Why AllDrive" title="Trusted across Caraga.">
              Reliable vehicles, transparent pricing and local know-how. Everything you need for a stress-free trip,
              any hour of the day.
            </SectionHeading>
            <div data-reveal style={{ "--d": "240ms" } as React.CSSProperties} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="ink" size="xl" className="group">
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="transition-transform duration-300 group-hover:-rotate-12" /> Chat on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline-ink" size="xl" className="group">
                <ViberLink>
                  <ViberIcon className="transition-transform duration-300 group-hover:-rotate-12" /> Chat on Viber
                </ViberLink>
              </Button>
            </div>
          </div>
          <div data-reveal="zoom" className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-ink">
            <Image
              src={brandImg}
              alt="AllDrive Rent a Car Butuan logo"
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
            />
            <Badge variant="outline" className="absolute bottom-4 left-4 h-9 gap-2 border-0 bg-white px-4 text-sm font-bold text-ink">
              <Clock className="size-4! text-brand-600" /> {site.hours}
            </Badge>
          </div>
        </div>

        <Testimonials />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Card
              key={f.title}
              data-reveal
              style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
              className="group gap-0 rounded-[1.75rem] border border-line bg-muted p-6 ring-0 transition-all duration-500 hover:-translate-y-1 hover:border-ink hover:bg-ink hover:text-white sm:p-7"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-8deg] group-hover:bg-brand group-hover:text-ink">
                <f.icon className="size-7" />
              </span>
              <CardTitle className="mt-7 font-display text-xl font-bold">{f.title}</CardTitle>
              <CardDescription className="mt-2 leading-relaxed transition-colors duration-500 group-hover:text-white/60">{f.body}</CardDescription>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <dl data-reveal className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] bg-brand-600 lg:grid-cols-4">
          {[
            { value: <CountUp to={fleetSize} suffix="+" />, label: "Cars in the fleet" },
            { value: <CountUp to={places.length} suffix="+" />, label: "Mindanao destinations" },
            { value: <CountUp to={15} />, label: "Max seats per van" },
            { value: <CountUp to={startingRate} prefix="₱" />, label: "Starting daily rate" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col-reverse bg-brand p-7 sm:p-9">
              <dt className="mt-2 text-sm font-semibold text-ink/65">{s.label}</dt>
              <dd className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* How it works */}
      <div className="mx-auto mt-28 max-w-7xl px-5 sm:mt-36">
        <SectionHeading index="07" eyebrow="How it works" title="On the road in 3 steps." center />

        <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
          <svg aria-hidden className="absolute top-10 left-[16%] hidden h-2 w-[68%] md:block" preserveAspectRatio="none">
            <line x1="0" y1="4" x2="100%" y2="4" stroke="#27abff" strokeWidth="2" strokeDasharray="6 10" className="animate-dash" />
          </svg>
          {steps.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              style={{ "--d": `${i * 150}ms` } as React.CSSProperties}
              className="group relative flex flex-col items-center text-center"
            >
              <span className="relative grid size-20 place-items-center rounded-3xl bg-ink text-brand transition-all duration-500 group-hover:-translate-y-1.5 group-hover:rotate-6 group-hover:bg-brand group-hover:text-ink">
                <s.icon className="size-9" />
                <span className="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full border-4 border-white bg-brand font-display text-sm font-extrabold text-ink">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-7 font-display text-2xl font-bold">{s.title}</h3>
              <p className="mt-2 max-w-xs text-mute">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
