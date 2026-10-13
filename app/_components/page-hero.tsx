import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { JsonLd } from "./json-ld";

export type Crumb = { label: string; href: string };

/** Dark page header for inner pages: breadcrumbs, eyebrow, the page's H1 and a short intro. */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  children,
  actions,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const trail = [{ label: "Home", href: "/" }, ...crumbs];

  return (
    <section id="top" className="relative overflow-hidden bg-ink px-5 pt-44 pb-16 text-white sm:pt-52 sm:pb-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: trail.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            item: `${site.url}${c.href === "/" ? "" : c.href}`,
          })),
        }}
      />

      {/* Solid decorative rings */}
      <div aria-hidden className="absolute -top-28 -right-28 size-[30rem] animate-float-slow rounded-full border-[3rem] border-white/[0.04]" />
      <div aria-hidden className="absolute -right-10 -bottom-28 size-52 animate-float sm:right-[18%] rounded-full border-[1.5rem] border-brand/15" />

      <div className="relative mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="fade-up">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/55">
            {trail.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight aria-hidden className="size-3.5 text-white/30" />}
                {i === trail.length - 1 ? (
                  <span aria-current="page" className="font-semibold text-white">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="inline-flex items-center gap-1.5 transition-colors hover:text-brand">
                    {i === 0 && <House aria-hidden className="size-3.5" />}
                    {c.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <p className="fade-up mt-8 text-xs font-bold tracking-[0.25em] text-brand uppercase" style={{ "--d": "80ms" } as React.CSSProperties}>
          {eyebrow}
        </p>
        <h1
          className="fade-up mt-4 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.035em] text-balance"
          style={{ "--d": "140ms" } as React.CSSProperties}
        >
          {title}
        </h1>
        {children && (
          <p
            className="fade-up mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-white/70 sm:text-xl"
            style={{ "--d": "220ms" } as React.CSSProperties}
          >
            {children}
          </p>
        )}
        {actions && (
          <div className="fade-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ "--d": "300ms" } as React.CSSProperties}>
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}
