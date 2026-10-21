"use client";

import { Suspense, useEffect, useState, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUpRight, BadgePercent, Menu, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { discountMinDays, nav, quoteHref, site, whatsappLink } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo, ViberIcon, WhatsAppIcon } from "./brand";
import { BookingDialog } from "./booking-dialog";
import { ViberLink } from "./viber-link";
import { ChatMenu } from "./chat-menu";

const smart = site.phones[0];

/**
 * Nav link marked aria-current on its own section. It reads the URL, which isn't known while
 * Next.js prerenders the shared shell of a dynamic route (e.g. /fleet/[slug]), so render it inside
 * <Suspense> or only after the page has loaded.
 */
function NavLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return <Link href={href} aria-current={active ? "page" : undefined} {...props} />;
}

const desktopLink =
  "group relative rounded-full px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white aria-[current=page]:text-white";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      {/* Multi-day discount strip, shown on every page and tucked away once the visitor scrolls */}
      <div
        aria-hidden={scrolled}
        className={cn(
          "mx-auto grid max-w-7xl transition-all duration-500",
          scrolled ? "grid-rows-[0fr] opacity-0" : "mb-2 grid-rows-[1fr] opacity-100",
        )}
      >
        <div className="overflow-hidden">
          <Link
            href={quoteHref}
            tabIndex={scrolled ? -1 : undefined}
            className="group flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-ink sm:text-sm"
          >
            <BadgePercent className="size-4 shrink-0" />
            <span>
              <span className="font-extrabold">Rent {discountMinDays} days or more and get a discount!</span>
              <span className="hidden sm:inline"> Get your multi-day quote.</span>
            </span>
            <ArrowRight className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
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
              {/* Same link without the current-page mark until the URL is known. */}
              <Suspense
                fallback={
                  <Link href={item.href} className={desktopLink}>
                    {item.label}
                    <span className="absolute inset-x-4 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-x-100" />
                  </Link>
                }
              >
                <NavLink href={item.href} className={desktopLink}>
                  {item.label}
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-x-100 group-aria-[current=page]:scale-x-100" />
                </NavLink>
              </Suspense>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Call us: the Smart number */}
          <a
            href={`tel:${smart.href}`}
            className="group hidden items-center gap-2.5 rounded-xl px-2 py-1 text-white/85 transition-colors hover:text-white md:flex"
          >
            <span className="grid size-9 place-items-center rounded-full bg-white/10 text-brand transition-transform duration-300 group-hover:-rotate-12">
              <Phone className="size-4" />
            </span>
            <span className="flex flex-col text-left leading-tight">
              <span className="text-[10px] font-semibold tracking-wider text-white/50 uppercase">Call us</span>
              <span className="text-sm font-semibold tabular-nums">{smart.display}</span>
            </span>
          </a>
          <ChatMenu className="hidden md:inline-flex" />
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
                      {/* The menu only renders once opened, so the URL is always known here. */}
                      <NavLink
                        href={item.href}
                        className="flex items-center justify-between rounded-xl px-3 py-3.5 font-display text-2xl font-semibold transition-colors hover:bg-white/5 aria-[current=page]:bg-white/5 aria-[current=page]:text-brand"
                      >
                        {item.label}
                        <ArrowUpRight className="size-5 text-brand" />
                      </NavLink>
                    </SheetClose>
                  </li>
                ))}
              </ul>
              <SheetFooter className="gap-2 border-t border-white/10 p-4">
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-xl border-white/15 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
                >
                  <a href={`tel:${smart.href}`}>
                    <Phone className="size-4 text-brand" /> Call us
                    <span className="tabular-nums text-white/70">{smart.display}</span>
                  </a>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-white/15 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
                  >
                    <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="size-4!" /> WhatsApp
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-white/15 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
                  >
                    <ViberLink>
                      <ViberIcon className="size-4!" /> Viber
                    </ViberLink>
                  </Button>
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
