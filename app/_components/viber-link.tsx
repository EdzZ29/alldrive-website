"use client";

import { useState, type ComponentProps, type MouseEvent } from "react";
import { Check, Copy, Download, RotateCw } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ViberIcon, WhatsAppIcon } from "./brand";

const viberNumber = site.phones[0];

/**
 * Opens a Viber chat with AllDrive. Browsers give no error when Viber isn't installed (they just
 * do nothing), so if the page is still in focus shortly after, `fallback` shows the number, a
 * download link and WhatsApp instead. Render `fallback` somewhere that stays mounted.
 */
export function useViberLauncher() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const launch = () => {
    let left = false;
    const onLeave = () => {
      left = true;
    };
    window.addEventListener("blur", onLeave, { once: true });
    document.addEventListener("visibilitychange", onLeave, { once: true });
    window.location.assign(site.viber);
    window.setTimeout(() => {
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onLeave);
      if (!left && !document.hidden) setOpen(true);
    }, 2200);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(viberNumber.href);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; the number is still shown on screen.
    }
  };

  const fallback = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl p-6 sm:max-w-md">
        <DialogHeader className="text-left">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#7360F2]/10">
            <ViberIcon className="size-7" />
          </span>
          <DialogTitle className="mt-2 font-display text-2xl font-extrabold">Chat with us on Viber</DialogTitle>
          <DialogDescription>
            Viber didn&apos;t open, so it may not be installed on this device. Add our number in Viber, or message us on
            WhatsApp instead.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-muted/60 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Viber number · {viberNumber.network}</p>
            <p className="font-display text-xl font-bold tabular-nums">{viberNumber.display}</p>
          </div>
          <Button type="button" variant="outline" size="md" onClick={copy} className="shrink-0">
            {copied ? <Check className="text-emerald-600" /> : <Copy />} {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="brand-light" size="md" onClick={launch}>
            <RotateCw /> Try again
          </Button>
          <Button asChild variant="outline" size="md">
            <a href="https://www.viber.com/en/download/" target="_blank" rel="noopener noreferrer">
              <Download /> Get Viber
            </a>
          </Button>
        </div>
        <Button asChild variant="ink" size="md" className="w-full">
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon /> Use WhatsApp instead
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );

  return { launch, fallback };
}

/** Link that opens a Viber chat with AllDrive, with the fallback above. */
export function ViberLink({ onClick, ...props }: ComponentProps<"a">) {
  const { launch, fallback } = useViberLauncher();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    launch();
  };

  return (
    <>
      <a href={site.viber} {...props} onClick={handleClick} />
      {fallback}
    </>
  );
}
