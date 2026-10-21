import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { faqsFor } from "@/lib/faq";
import { getCatalog } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";

/**
 * Common questions. Uses native <details> so every answer stays in the HTML (readable by Google)
 * even while collapsed.
 */
export async function Faq({ limit, showAllLink = false }: { limit?: number; showAllLink?: boolean }) {
  const faqs = faqsFor(await getCatalog());
  const shown = limit ? faqs.slice(0, limit) : faqs;

  return (
    <section id="faq" className="bg-white py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading index="08" eyebrow="FAQ" title="Car rental in Butuan, answered.">
            Rates, drivers, airport pickups and trips across Mindanao. Still have a question? Message us on WhatsApp,
            any time.
          </SectionHeading>
          {showAllLink && (
            <Button asChild variant="outline-ink" size="md" className="group mt-8">
              <Link href="/faq">
                See all questions
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          )}
        </div>

        <div className="space-y-3 lg:col-span-7">
          {shown.map((f, i) => (
            <details
              key={f.q}
              data-reveal
              style={{ "--d": `${Math.min(i, 5) * 60}ms` } as React.CSSProperties}
              className="group rounded-2xl border border-line bg-white transition-colors open:border-ink/20 open:bg-muted/50 hover:border-ink/20"
              open={i === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-display text-lg font-bold sm:p-6 [&::-webkit-details-marker]:hidden">
                <h3>{f.q}</h3>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-brand transition-transform duration-300 group-open:rotate-45">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="-mt-1 px-5 pb-6 leading-relaxed text-pretty text-mute sm:px-6">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
