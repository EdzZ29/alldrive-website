import Link from "next/link";
import { ArrowRight, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[80svh] items-center overflow-hidden bg-ink px-5 pt-44 pb-20 text-white">
      <div aria-hidden className="absolute -top-28 -right-28 size-[30rem] animate-float-slow rounded-full border-[3rem] border-white/[0.04]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold tracking-[0.25em] text-brand uppercase">Page not found</p>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,7vw,5rem)] leading-[0.95] font-extrabold tracking-[-0.035em]">
          Wrong turn.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          We couldn&apos;t find that page. Let&apos;s get you back on the road.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="brand" size="xl" className="group">
            <Link href="/">
              Back to home
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="glass" size="xl">
            <Link href="/fleet">
              <CarFront className="text-brand" /> Browse the fleet
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
