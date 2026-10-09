import { ArrowUpRight, Quote, Star } from "lucide-react";
import { googleRating, site, testimonials } from "@/lib/site";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { GoogleIcon } from "./brand";

function Stars({ className = "size-4" }: { className?: string }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${className} fill-amber-400 text-amber-400`} />
      ))}
    </span>
  );
}

export function Testimonials() {
  return (
    <div className="mt-20">
      {/* Rating summary */}
      <Card
        data-reveal
        className="flex-col gap-6 rounded-[1.75rem] bg-ink p-6 text-white ring-0 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white sm:size-16">
            <GoogleIcon className="size-8 sm:size-9" />
          </span>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">What renters say</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-display text-4xl font-extrabold">{googleRating.value}</span>
              <div>
                <Stars />
                <p className="mt-1 text-sm text-white/60">{googleRating.count} reviews on Google</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:flex">
          <Button asChild variant="glass" size="md" className="group border-white/15 bg-transparent">
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">
              Read all reviews
              <ArrowUpRight className="text-brand transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
          <Button asChild variant="brand" size="md">
            <a href={site.reviewUrl} target="_blank" rel="noopener noreferrer">
              <GoogleIcon className="rounded-full bg-white p-0.5" /> Write a review
            </a>
          </Button>
        </div>
      </Card>

      {/* Review cards */}
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <li key={t.name} data-reveal style={{ "--d": `${i * 100}ms` } as React.CSSProperties}>
            <Card className="group relative h-full gap-0 rounded-[1.75rem] border border-line bg-muted py-0 ring-0 transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:bg-white hover:shadow-[0_24px_60px_-24px_rgba(7,12,22,0.25)]">
              <Quote
                aria-hidden
                className="absolute top-6 right-6 size-10 fill-brand/10 text-brand/20 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"
              />
              <CardContent className="flex-1 px-6 pt-7 sm:px-7">
                <Stars />
                <blockquote className="mt-5 text-[15px] leading-relaxed text-ink/80">&ldquo;{t.quote}&rdquo;</blockquote>
              </CardContent>
              <CardFooter className="mx-6 mt-6 gap-3 rounded-none border-t border-line bg-transparent px-0 pt-5 pb-7 sm:mx-7">
                <Avatar className="size-11">
                  <AvatarFallback className="bg-brand font-display text-lg font-extrabold text-ink">
                    {t.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-bold">{t.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <GoogleIcon className="size-3.5" /> Google review
                  </p>
                </div>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
