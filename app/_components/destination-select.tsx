"use client";

import { cn } from "@/lib/utils";
import { findPlace, regions, zones } from "@/lib/site";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";

const zoneShort = Object.fromEntries(zones.map((z) => [z.id, z.short]));

/** Every Mindanao province and city, grouped by region, each tagged with its rate zone. */
export function DestinationSelect({
  id,
  value,
  onValueChange,
  dark = false,
  className,
  ...aria
}: {
  id?: string;
  value: string;
  onValueChange: (placeId: string) => void;
  dark?: boolean;
  className?: string;
  "aria-labelledby"?: string;
}) {
  const selected = findPlace(value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={cn("w-full", className)} {...aria}>
        {/* Rendered by hand so the trigger shows the place plus its rate zone. */}
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{selected.name}</span>
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
              dark ? "bg-brand/15 text-brand" : "bg-brand-50 text-brand-700",
            )}
          >
            {zoneShort[selected.zone]}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className={cn("max-h-80 rounded-xl", dark && "border border-white/10 bg-ink-800 text-white")}
      >
        {regions.map((region, i) => (
          <SelectGroup key={region.name}>
            {i > 0 && <SelectSeparator className={dark ? "bg-white/10" : undefined} />}
            <SelectLabel className={cn("text-[11px] font-bold tracking-[0.15em] uppercase", dark ? "text-white/45" : "text-muted-foreground")}>
              {region.name}
            </SelectLabel>
            {region.places.map((p) => (
              <SelectItem
                key={p.id}
                value={p.id}
                className={cn("rounded-lg py-2", dark && "focus:bg-brand/15 focus:text-white")}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span>
                    {p.name}
                    {p.kind === "Province" && (
                      <span className={cn("ml-1.5 text-xs", dark ? "text-white/40" : "text-muted-foreground")}>province</span>
                    )}
                  </span>
                  <span className={cn("text-[10px] font-bold tracking-wide uppercase", dark ? "text-brand/80" : "text-brand-600")}>
                    {zoneShort[p.zone]}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
