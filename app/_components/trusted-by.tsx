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

        <ul className="mx-auto mt-14 flex max-w-4xl flex-wrap items-start justify-center gap-x-16 gap-y-10 sm:gap-x-24">
          {trustedBy.map((c, i) => (
            <li key={c.name} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
              <div className="group flex flex-col items-center text-center transition-transform duration-500 ease-out hover:-translate-y-1.5">
                {c.logo ? (
                  <Image
                    src={c.logo}
                    alt={`${c.name} logo`}
                    sizes="240px"
                    className="h-16 w-auto object-contain transition-transform duration-500 ease-out group-hover:scale-110 sm:h-24"
                  />
                ) : (
                  <span className="font-display text-5xl leading-none font-extrabold tracking-tight text-ink transition-colors duration-300 group-hover:text-brand-600 sm:text-6xl">
                    {c.short ?? c.name}
                  </span>
                )}
                <span className="mt-5 text-sm font-semibold text-ink">{c.name}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{c.note}</span>
              </div>
            </li>
          ))}
        </ul>
        <p
          data-reveal
          style={{ "--d": `${trustedBy.length * 80}ms` } as React.CSSProperties}
          className="mt-10 flex items-center justify-center gap-1.5 text-sm font-semibold text-mute"
        >
          <Plus className="size-4 text-brand-600" /> And many more businesses, families and travelers
        </p>
      </div>
    </section>
  );
}
