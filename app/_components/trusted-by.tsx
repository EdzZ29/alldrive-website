import Image from "next/image";
import { BadgeCheck, Plus } from "lucide-react";
import { trustedBy } from "@/lib/site";

/** Clients who have trusted AllDrive (TV networks, programs and more). */
export function TrustedBy() {
  return (
    <section id="trusted" aria-labelledby="trusted-title" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p data-reveal className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-brand-600 uppercase">
            <BadgeCheck className="size-4" /> Trusted by
          </p>
          <h2
            id="trusted-title"
            data-reveal
            style={{ "--d": "80ms" } as React.CSSProperties}
            className="mt-4 font-display text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Trusted by national TV and clients across Mindanao.
          </h2>
          <p data-reveal style={{ "--d": "160ms" } as React.CSSProperties} className="mt-4 text-lg text-pretty text-mute">
            From national TV programs to local businesses and families, clients count on AllDrive for reliable rides.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {trustedBy.map((c, i) => (
            <li key={c.name} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
              <div className="group flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-line bg-white px-4 py-8 text-center transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_60px_-24px_rgba(7,12,22,0.25)] sm:py-10">
                {c.logo ? (
                  <Image src={c.logo} alt={c.name} width={180} height={72} className="h-14 w-auto object-contain" />
                ) : (
                  <span className="font-display text-4xl leading-none font-extrabold tracking-tight text-ink transition-colors duration-300 group-hover:text-brand-600 sm:text-5xl">
                    {c.short ?? c.name}
                  </span>
                )}
                <span className="mt-4 text-sm font-semibold text-ink">{c.name}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{c.note}</span>
              </div>
            </li>
          ))}
          <li data-reveal style={{ "--d": `${trustedBy.length * 80}ms` } as React.CSSProperties}>
            <div className="group flex h-full flex-col items-center justify-center rounded-[1.5rem] bg-ink px-4 py-8 text-center text-white transition-transform duration-500 hover:-translate-y-1 sm:py-10">
              <span className="grid size-14 place-items-center rounded-full bg-brand text-ink transition-transform duration-500 group-hover:rotate-90">
                <Plus className="size-7" />
              </span>
              <span className="mt-4 text-sm font-semibold">And many more</span>
              <span className="mt-0.5 text-xs text-white/60">Businesses, families and travelers</span>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
