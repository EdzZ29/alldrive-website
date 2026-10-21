import { peso } from "@/lib/site";
import { getCatalog } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "../_components/page-hero";
import { Rates } from "../_components/rates";
import { Estimator } from "../_components/estimator";
import { Contact } from "../_components/contact";

export async function generateMetadata() {
  const { startingRate, driverRate } = await getCatalog();
  return pageMetadata({
    title: "Car Rental Rates in Butuan City & Mindanao",
    description: `AllDrive car rental rates: sedans from ${peso(startingRate)}/day in Butuan City, with set daily rates for Caraga, Cagayan de Oro, Davao City and the rest of Mindanao. Driver ${peso(driverRate)}/day.`,
    path: "/rates",
  });
}

export default async function RatesPage() {
  const { driverRate } = await getCatalog();
  return (
    <main>
      <PageHero crumbs={[{ label: "Rates", href: "/rates" }]} eyebrow="Transparent pricing" title="Car rental rates, no surprises.">
        Your daily rate depends on the car and how far you go: Butuan City, within Caraga, Cagayan de Oro and Davao City,
        or the rest of Mindanao. A driver is {peso(driverRate)} a day anywhere.
      </PageHero>
      <Estimator />
      <Rates />
      <Contact />
    </main>
  );
}
