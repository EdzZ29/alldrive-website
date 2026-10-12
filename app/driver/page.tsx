import Link from "next/link";
import { ArrowRight, CarFront } from "lucide-react";
import { driverRate, peso, quoteHref } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { PageHero } from "../_components/page-hero";
import { DriverFees } from "../_components/driver-fees";
import { Estimator } from "../_components/estimator";
import { Contact } from "../_components/contact";

export const metadata = pageMetadata({
  title: "Car Rental with Driver in Butuan City",
  description: `Rent a car with a professional driver in Butuan City for ${peso(driverRate)}/day, the same rate for any destination in Mindanao. Airport transfers, business trips, tours and weddings.`,
  path: "/driver",
});

export default function DriverPage() {
  return (
    <main>
      <PageHero
        crumbs={[{ label: "Driver", href: "/driver" }]}
        eyebrow="Car rental with driver"
        title="Sit back. We'll take the wheel."
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
        Add a professional, courteous driver to any car for {peso(driverRate)} a day. Same rate whether you stay in
        Butuan City or travel anywhere in Mindanao.
      </PageHero>
      <DriverFees />
      <Estimator />
      <Contact />
    </main>
  );
}
