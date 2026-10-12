import { Clock, MapPin, Navigation } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "../_components/page-hero";
import { WhatsAppIcon } from "../_components/brand";
import { Contact } from "../_components/contact";

export const metadata = pageMetadata({
  title: "Contact & Directions",
  description: `Contact AllDrive Rent a Car Butuan, open 24 hours. Message us on WhatsApp, Viber or Facebook Messenger, or visit us at ${site.address.full}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main>
      <PageHero
        crumbs={[{ label: "Contact", href: "/contact" }]}
        eyebrow="Contact & directions"
        title="Talk to us any time, day or night."
        actions={
          <>
            <Button asChild variant="brand" size="xl">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="rounded-full bg-white p-0.5" /> Chat on WhatsApp
              </a>
            </Button>
            <Button asChild variant="glass" size="xl">
              <a href={site.directionsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="text-brand" /> Get directions
              </a>
            </Button>
          </>
        }
      >
        We&apos;re open 24 hours in Butuan City. Message us on WhatsApp, Viber or Messenger, or send an email, and
        we&apos;ll confirm your booking fast.
      </PageHero>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-5 lg:grid-cols-12">
          <div
            data-reveal
            className="relative min-h-[22rem] min-w-0 overflow-hidden rounded-[1.75rem] border border-line bg-muted lg:col-span-8 lg:min-h-[28rem]"
          >
            <iframe
              src={site.mapsEmbedUrl}
              title={`Map to ${site.legalName}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 size-full border-0"
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            <Card data-reveal="right" className="gap-3 rounded-[1.75rem] border-0 bg-ink p-7 text-white ring-0">
              <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-brand">
                <MapPin className="size-5" />
              </span>
              <h2 className="font-display text-xl font-bold">Our location</h2>
              <address className="text-sm leading-relaxed text-white/65 not-italic">{site.address.full}</address>
              <Button asChild variant="brand" size="md" className="mt-2 w-fit">
                <a href={site.directionsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation /> Directions
                </a>
              </Button>
            </Card>
            <Card
              data-reveal="right"
              style={{ "--d": "80ms" } as React.CSSProperties}
              className="gap-3 rounded-[1.75rem] border border-line bg-white p-7 ring-0"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Clock className="size-5" />
              </span>
              <h2 className="font-display text-xl font-bold">Opening hours</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {site.hours}, every day. Pickups at Bancasi Airport on request.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Contact />
    </main>
  );
}
