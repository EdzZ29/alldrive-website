import Link from "next/link";
import { ArrowRight, CarFront } from "lucide-react";
import { models, peso, quoteHref, startingRate } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { PageHero } from "../_components/page-hero";
import { Fleet } from "../_components/fleet";
import { Estimator } from "../_components/estimator";
import { Contact } from "../_components/contact";

export const metadata = pageMetadata({
  title: "Our Fleet: Cars, SUVs & Vans for Rent in Butuan City",
  description: `Browse all ${models.length} AllDrive rental cars in Butuan City: Toyota Vios, Innova, Avanza, Fortuner, Montero Sport, Hilux, Hiace and more. Self-drive from ${peso(startingRate)}/day or with a driver.`,
  path: "/fleet",
});

export default function FleetPage() {
  return (
    <main>
      <PageHero
        crumbs={[{ label: "Fleet", href: "/fleet" }]}
        eyebrow="Our fleet"
        title="Cars, SUVs and vans for rent in Butuan City."
        actions={
          <Button asChild variant="brand" size="xl" className="group">
            <Link href={quoteHref}>
              <CarFront />
              Get an instant quote
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        }
      >
        {models.length} well-kept cars, from city sedans to 15-seat vans. Self-drive from {peso(startingRate)} a day, or
        add a professional driver for any trip across Mindanao.
      </PageHero>
      <Fleet />
      <Estimator />
      <Contact />
    </main>
  );
}
