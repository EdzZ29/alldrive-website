import Link from "next/link";
import { ArrowUpRight, Clock, MapPin, Navigation, Phone } from "lucide-react";
import { nav, quoteHref, site, whatsappLink } from "@/lib/site";
import { FacebookIcon, GmailIcon, GoogleIcon, Logo, MessengerIcon, ViberIcon, WhatsAppIcon } from "./brand";
import { Year } from "./year";
import { ViberLink } from "./viber-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function Contact() {
  const channels = [
    ...site.phones.map((p) => ({
      icon: Phone,
      label: `Call · ${p.network}`,
      value: p.display,
      href: `tel:${p.href}`,
      external: false,
    })),
    { icon: WhatsAppIcon, label: "WhatsApp", value: "Message us now", href: whatsappLink(), external: true },
    { icon: ViberIcon, label: "Viber", value: "Chat with us", href: site.viber, external: false },
    { icon: MessengerIcon, label: "Messenger", value: "Chat with us", href: site.messenger, external: true },
    { icon: GmailIcon, label: "Email us", value: site.email, href: `mailto:${site.email}`, external: false },
    {
      icon: Navigation,
      label: "Get directions",
      value: `${site.address.street}, ${site.address.locality}`,
      href: site.directionsUrl,
      external: true,
    },
  ];

  return (
    <section id="contact" className="bg-white px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="relative overflow-hidden rounded-[2.25rem] bg-brand px-6 py-20 sm:px-12 sm:py-28">
        {/* Solid decorative rings */}
        <div aria-hidden className="absolute -right-24 -bottom-24 size-[26rem] rounded-full border-[3rem] border-ink/5 animate-float-slow" />
        <div aria-hidden className="absolute -top-16 right-1/3 size-40 rounded-full border-[1.5rem] border-white/20 animate-float" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-14 lg:grid-cols-12 lg:items-end">
          <div className="min-w-0 lg:col-span-7">
            <p data-reveal className="text-xs font-bold tracking-[0.25em] text-ink/60 uppercase">Ready when you are</p>
            <h2 data-reveal style={{ "--d": "80ms" } as React.CSSProperties} className="mt-5 font-display text-[clamp(2.8rem,8vw,6.5rem)] leading-[0.92] font-extrabold tracking-[-0.04em] text-ink">
              Your next trip
              <br />
              starts here.
            </h2>
            <div data-reveal style={{ "--d": "160ms" } as React.CSSProperties} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="ink" size="xl" className="group">
                <Link href={quoteHref}>
                  Get a quote
                  <ArrowUpRight className="text-brand transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
              <Button asChild variant="outline-ink" size="xl" className="group bg-transparent">
                <a href={site.reviewUrl} target="_blank" rel="noopener noreferrer">
                  <GoogleIcon className="rounded-full bg-white p-0.5 transition-transform duration-500 group-hover:rotate-[360deg]" />
                  Rate us on Google
                </a>
              </Button>
            </div>
          </div>

          <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {channels.map((c, i) => {
              const inner = (
                <>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-brand transition-transform duration-300 group-hover:-rotate-8">
                    <c.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-ink/55">{c.label}</span>
                    <span className="block truncate font-bold text-ink">{c.value}</span>
                  </span>
                </>
              );
              return (
                <li key={c.label} data-reveal="right" style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
                  <Card asChild className="group flex-row items-center gap-4 rounded-2xl bg-white/90 p-3.5 ring-0 transition-all duration-300 hover:translate-x-1 hover:bg-white">
                    {c.href === site.viber ? (
                      <ViberLink>{inner}</ViberLink>
                    ) : (
                      <a href={c.href} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {inner}
                      </a>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-white px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="rounded-[2.25rem] bg-ink px-6 pt-16 pb-8 text-white sm:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              Self-drive and chauffeured car rental in {site.address.locality}, open 24 hours. Serving Caraga,
              Cagayan de Oro and Davao.
            </p>
            <p className="mt-3 flex items-start gap-2 text-sm text-white/55">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
              {site.address.full}
            </p>
            <a
              href={site.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-2 ml-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:text-white"
            >
              <Navigation className="size-3.5 transition-transform duration-300 group-hover:rotate-12" /> Get directions
            </a>
            <div className="mt-6 flex gap-2">
              {[
                { href: site.facebook, label: "AllDrive Rent a Car Butuan on Facebook", Icon: FacebookIcon },
                { href: whatsappLink(), label: "Chat with AllDrive on WhatsApp", Icon: WhatsAppIcon },
                { href: site.viber, label: "Chat with AllDrive on Viber", Icon: ViberIcon, sameTab: true },
                { href: site.messenger, label: "Message AllDrive on Messenger", Icon: MessengerIcon },
                { href: `mailto:${site.email}`, label: `Email AllDrive at ${site.email}`, Icon: GmailIcon, sameTab: true },
                { href: site.reviewUrl, label: "Leave AllDrive a Google review", Icon: GoogleIcon },
              ].map(({ href, label, Icon, sameTab }) => (
                <Button
                  key={href}
                  asChild
                  variant="outline"
                  size="icon-xl"
                  className="border-white/15 bg-transparent text-white/70 hover:-translate-y-0.5 hover:border-brand hover:bg-brand hover:text-ink"
                >
                  {href === site.viber ? (
                    <ViberLink aria-label={label} title={label}>
                      <Icon />
                    </ViberLink>
                  ) : (
                    <a
                      href={href}
                      {...(sameTab ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                      aria-label={label}
                      title={label}
                    >
                      <Icon />
                    </a>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Call us</p>
            <ul className="mt-5 space-y-3">
              {site.phones.map((p) => (
                <li key={p.href}>
                  <a href={`tel:${p.href}`} className="group flex items-center gap-3 text-white/80 transition hover:text-brand">
                    <Phone className="size-4 text-brand" />
                    <span className="font-semibold tabular-nums">{p.display}</span>
                    <Badge variant="secondary" className="rounded-md bg-white/10 text-[10px] font-bold tracking-wider text-white/60 uppercase">
                      {p.network}
                    </Badge>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Message us</p>
            <ul className="mt-5 space-y-3">
              {[
                { href: whatsappLink(), label: "Chat on WhatsApp", Icon: WhatsAppIcon, newTab: true },
                { href: site.viber, label: "Chat on Viber", Icon: ViberIcon, newTab: false },
                { href: site.messenger, label: "Chat on Messenger", Icon: MessengerIcon, newTab: true },
              ].map(({ href, label, Icon, newTab }) => (
                <li key={label}>
                  {href === site.viber ? (
                    <ViberLink className="group flex items-center gap-3 font-semibold text-white/80 transition hover:text-brand">
                      <Icon className="size-5 text-brand transition-transform duration-300 group-hover:-rotate-8" />
                      {label}
                    </ViberLink>
                  ) : (
                    <a
                      href={href}
                      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group flex items-center gap-3 font-semibold text-white/80 transition hover:text-brand"
                    >
                      <Icon className="size-5 text-brand transition-transform duration-300 group-hover:-rotate-8" />
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-center gap-2 text-sm text-white/55">
              <Clock className="size-4 text-brand" /> {site.hours}
            </p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-2">
            <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Explore</p>
            <ul className="mt-5 space-y-3">
              {[...nav, { label: "FAQ", href: "/faq" }].map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-white/70 transition hover:text-brand">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Areas we serve</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {site.areaServed.map((a) => (
                <li key={a}>
                  <Badge variant="outline" className="h-7 border-white/10 px-3 font-normal text-white/65">
                    {a}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="mx-auto mt-14 max-w-7xl bg-white/10" />
        <div className="mx-auto flex max-w-7xl flex-col gap-3 pt-7 text-xs text-white/40 sm:flex-row sm:justify-between">
          <p>
            © <Year /> {site.legalName}. All rights reserved.
          </p>
          <a href="#top" className="transition hover:text-brand">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
