"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { site, whatsappLink } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GmailIcon, MessengerIcon, ViberIcon, WhatsAppIcon } from "./brand";
import { useViberLauncher } from "./viber-link";

const channels = [
  { id: "whatsapp", label: "WhatsApp", sub: "Usually the fastest reply", Icon: WhatsAppIcon, color: "" },
  { id: "messenger", label: "Messenger", sub: "Chat on Facebook", Icon: MessengerIcon, color: "text-[#0a7cff]" },
  { id: "viber", label: "Viber", sub: "Chat on Viber", Icon: ViberIcon, color: "" },
  { id: "email", label: "Email", sub: site.email, Icon: GmailIcon, color: "" },
] as const;

/**
 * "Chat with us" dropdown: pick WhatsApp, Messenger, Viber or Email. The icon cycles through them.
 * `nav` is the slim header button; `brand` is the big sky-blue call-to-action. `withCalls` adds
 * the call numbers at the top (the header has no separate number).
 */
export function ChatMenu({
  className,
  variant = "nav",
  withCalls = false,
}: {
  className?: string;
  variant?: "nav" | "brand";
  withCalls?: boolean;
}) {
  const brand = variant === "brand";
  const [shown, setShown] = useState(0);
  const [open, setOpen] = useState(false);
  const { launch, fallback } = useViberLauncher();

  useEffect(() => {
    if (open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setShown((n) => (n + 1) % channels.length), 2200);
    return () => window.clearInterval(timer);
  }, [open]);

  const itemClass = "cursor-pointer gap-3 rounded-xl px-2.5 py-2 focus:bg-muted";
  const row = (c: (typeof channels)[number]) => (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
        <c.Icon className={cn("size-5!", c.color)} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{c.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{c.sub}</span>
      </span>
    </>
  );

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={brand ? "brand" : "ghost"}
            size={brand ? "xl" : "md"}
            aria-label="Chat with us"
            className={cn(
              "group/chat",
              brand
                ? "aria-expanded:bg-white"
                : "text-white/80 hover:bg-transparent hover:text-white aria-expanded:bg-white/10 aria-expanded:text-white",
              className,
            )}
          >
            {/* Cycling channel logo (on a white disc on the sky-blue button so every logo stays visible) */}
            <span className={cn("relative shrink-0", brand ? "grid size-8 place-items-center rounded-full bg-white" : "size-5")}>
              {channels.map((c, k) => (
                <c.Icon
                  key={c.id}
                  aria-hidden
                  className={cn(
                    "absolute size-5! transition-all duration-500 ease-out",
                    brand ? "inset-1.5" : "inset-0",
                    c.color,
                    k === shown ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-45 opacity-0",
                  )}
                />
              ))}
            </span>
            <span className={brand ? "" : "lg:hidden xl:inline"}>Chat with us</span>
            <ChevronDown
              className={cn(
                "size-4! transition-transform duration-300 group-data-[state=open]/chat:rotate-180",
                brand ? "text-ink/60" : "text-white/60",
              )}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={12} className="w-64 rounded-2xl p-2">
          {withCalls && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Call or text us
                </DropdownMenuLabel>
                {site.phones.map((p) => (
                  <DropdownMenuItem key={p.href} asChild className={itemClass}>
                    <a href={`tel:${p.href}`}>
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-brand-700">
                        <Phone className="size-4!" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold tabular-nums text-ink">{p.display}</span>
                        <span className="block truncate text-xs text-muted-foreground">{p.network} · open 24 hours</span>
                      </span>
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1.5" />
            </>
          )}
          <DropdownMenuLabel className="px-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Chat with us on
          </DropdownMenuLabel>
          <DropdownMenuItem asChild className={itemClass}>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              {row(channels[0])}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={itemClass}>
            <a href={site.messenger} target="_blank" rel="noopener noreferrer">
              {row(channels[1])}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className={itemClass} onSelect={launch}>
            {row(channels[2])}
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={itemClass}>
            <a href={`mailto:${site.email}`}>{row(channels[3])}</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {fallback}
    </>
  );
}
