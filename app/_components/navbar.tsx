"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { nav, site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./brand";
import { BookingDialog } from "./booking-dialog";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-500 sm:px-5",
          scrolled
            ? "border-white/10 bg-ink/85 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" aria-label={`${site.legalName} home`}>
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="group relative rounded-full px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white aria-[current=page]:text-white"
              >
                {item.label}
                <span className="absolute inset-x-4 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-x-100 group-aria-[current=page]:scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="md" className="hidden text-white/80 hover:bg-transparent hover:text-white md:inline-flex">
            <a href={`tel:${site.phoneHref}`}>
              <Phone className="text-brand" />
              {site.phone}
            </a>
          </Button>
          <BookingDialog defaults={{ vehicleId: "sedan" }}>
            <Button variant="brand" size="md" className="group hidden sm:inline-flex">
              Book now
              <ArrowUpRight className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </BookingDialog>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-xl"
                aria-label="Open menu"
                className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white lg:hidden"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88%] border-white/10 bg-ink text-white sm:max-w-sm [&>button]:text-white">
              <SheetHeader className="p-5">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo />
              </SheetHeader>
              <ul className="px-3">
                {nav.map((item, i) => (
                  <li key={item.href} className="animate-pop-in" style={{ animationDelay: `${80 + i * 50}ms` }}>
                    <SheetClose asChild>
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className="flex items-center justify-between rounded-xl px-3 py-3.5 font-display text-2xl font-semibold transition-colors hover:bg-white/5 aria-[current=page]:bg-white/5 aria-[current=page]:text-brand"
                      >
                        {item.label}
                        <ArrowUpRight className="size-5 text-brand" />
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
              <SheetFooter className="gap-2 border-t border-white/10 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {site.phones.map((p) => (
                    <Button
                      key={p.href}
                      asChild
                      variant="outline"
                      className="h-auto flex-col gap-0.5 rounded-xl border-white/15 bg-transparent py-2.5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <a href={`tel:${p.href}`}>
                        <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                          <Phone className="size-3.5 text-brand" /> {p.display}
                        </span>
                        <Badge variant="secondary" className="h-4 bg-white/10 text-[10px] tracking-wider text-white/60 uppercase">
                          {p.network}
                        </Badge>
                      </a>
                    </Button>
                  ))}
                </div>
                <BookingDialog defaults={{ vehicleId: "sedan" }}>
                  <Button variant="brand" size="md" className="w-full">
                    Book now
                  </Button>
                </BookingDialog>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
