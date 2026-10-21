import type { Metadata } from "next";
import { Clock, MapPin, Phone, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site, whatsappLink } from "@/lib/site";
import { Logo, MessengerIcon, WhatsAppIcon } from "../_components/brand";

// Shown in place of every page while maintenance mode is on (see proxy.ts).
export const metadata: Metadata = {
  title: { absolute: `We'll be right back | ${site.legalName}` },
  description: "Our website is being upgraded. You can still book a car by WhatsApp, Messenger or phone, 24 hours a day.",
  robots: { index: false, follow: false },
};

// Hides the public site's header and footer on this page (same approach as the admin layout).
const hidePublicChrome =
  "body:has([data-maintenance-page]) > header, body:has([data-maintenance-page]) > footer { display: none !important; }";

export default function MaintenancePage() {
  return (
    <main data-maintenance-page className="relative flex min-h-svh flex-col overflow-hidden bg-ink px-5 py-8 text-white sm:py-10">
      <style>{hidePublicChrome}</style>
      <div aria-hidden className="absolute -top-28 -right-28 size-[30rem] animate-float-slow rounded-full border-[3rem] border-white/[0.04]" />
      <div aria-hidden className="absolute -bottom-40 -left-32 size-[26rem] rounded-full border-[2.5rem] border-white/[0.03]" />

      <div className="relative mx-auto w-full max-w-3xl">
        <Logo />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-14 text-center">
        <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-brand uppercase">
          <Wrench className="size-3.5" /> Website upgrade
        </span>
        <h1 className="mt-6 font-display text-[clamp(2.4rem,7vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.035em]">
          We&apos;ll be right back.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          We&apos;re upgrading our website and online booking. Our cars are still on the road, so message or call us
          and we&apos;ll book your rental for you.
        </p>

        <div className="mx-auto mt-9 grid w-full max-w-md gap-3 sm:max-w-none sm:grid-cols-2">
          <Button asChild variant="white" size="xl">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> WhatsApp us
            </a>
          </Button>
          <Button asChild variant="glass" size="xl">
            <a href={site.messenger} target="_blank" rel="noopener noreferrer">
              <MessengerIcon /> Messenger
            </a>
          </Button>
          {site.phones.map((p) => (
            <Button key={p.href} asChild variant="glass" size="xl">
              <a href={`tel:${p.href}`}>
                <Phone className="text-brand" /> {p.network} {p.display}
              </a>
            </Button>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-2 text-center text-sm text-white/55 sm:flex-row sm:justify-center sm:gap-6">
        <span className="inline-flex items-center gap-2">
          <Clock className="size-4 text-brand" /> {site.hours}
        </span>
        <a href={site.directionsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
          <MapPin className="mr-2 inline size-4 align-[-3px] text-brand" />
          {site.address.full}
        </a>
      </div>
    </main>
  );
}
