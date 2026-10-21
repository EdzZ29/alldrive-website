import { faqsFor } from "@/lib/faq";
import { getCatalog } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { Faq } from "../_components/faq";
import { JsonLd } from "../_components/json-ld";
import { PageHero } from "../_components/page-hero";
import { Contact } from "../_components/contact";

export const metadata = pageMetadata({
  title: "Car Rental FAQ: Rates, Self-Drive, With Driver & Airport Pickup",
  description:
    "Answers to common questions about renting a car in Butuan City: daily rates, self-drive and with-driver rentals, Bancasi Airport pickup, trips across Mindanao, and how to book.",
  path: "/faq",
});

export default async function FaqPage() {
  const faqs = faqsFor(await getCatalog());
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <PageHero crumbs={[{ label: "FAQ", href: "/faq" }]} eyebrow="Frequently asked questions" title="Renting a car in Butuan City, explained.">
        Everything you need to know before you book: rates, drivers, airport pickups and trips across Mindanao.
      </PageHero>
      <Faq />
      <Contact />
    </main>
  );
}
