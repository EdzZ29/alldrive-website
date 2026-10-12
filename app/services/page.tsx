import { pageMetadata } from "@/lib/seo";
import { PageHero } from "../_components/page-hero";
import { Services } from "../_components/services";
import { WhyUs } from "../_components/why-us";
import { TrustedBy } from "../_components/trusted-by";
import { Contact } from "../_components/contact";

export const metadata = pageMetadata({
  title: "Car Rental Services: Self-Drive, Airport Transfers, Weddings & Tours",
  description:
    "AllDrive Rent a Car Butuan services: self-drive and with-driver rentals, Bancasi Airport transfers, wedding cars, tours around Caraga, and weekly or monthly rentals.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <main>
      <PageHero crumbs={[{ label: "Services", href: "/services" }]} eyebrow="What we offer" title="More than a rental.">
        Self-drive or with a driver, airport pickups, wedding cars, tours around Caraga and long-term rentals. Open 24
        hours in Butuan City.
      </PageHero>
      <Services />
      <TrustedBy />
      <WhyUs />
      <Contact />
    </main>
  );
}
