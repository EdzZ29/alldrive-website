"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { isUploadedPhoto, zones, type CarModel, type CatalogOverrides, type Rates } from "@/lib/site";
import { api } from "../../_lib/api";
import { refreshWebsiteCatalog } from "../../_lib/catalog-actions";

/** Rates as editable text: "" = on request. */
export type RatesDraft = Record<keyof Rates, string>;
export const toDraft = (r: Rates): RatesDraft => Object.fromEntries(zones.map((z) => [z.id, r[z.id] == null ? "" : String(r[z.id])])) as RatesDraft;

/** Validates a draft; returns the rates or an error message. */
export function fromDraft(d: RatesDraft): Rates | string {
  const out = {} as Rates;
  for (const z of zones) {
    const v = d[z.id].trim();
    if (v === "") out[z.id] = null;
    else if (/^\d{1,7}$/.test(v)) out[z.id] = Number(v);
    else return `${z.label}: enter a whole peso amount, or leave it blank for "On request".`;
  }
  return out;
}

export function RatesEditor({ idPrefix, value, onChange, placeholder }: { idPrefix: string; value: RatesDraft; onChange: (d: RatesDraft) => void; placeholder?: Rates }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {zones.map((z) => (
        <div key={z.id} className="grid gap-1">
          <label htmlFor={`${idPrefix}-${z.id}`} className="text-xs font-semibold text-muted-foreground">
            {z.label}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
            <Input
              id={`${idPrefix}-${z.id}`}
              inputMode="numeric"
              value={value[z.id]}
              onChange={(e) => onChange({ ...value, [z.id]: e.target.value.replace(/[^\d]/g, "") })}
              placeholder={placeholder?.[z.id] != null ? String(placeholder[z.id]) : "On request"}
              className="h-11 rounded-xl bg-white pl-7"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A car photo: built-in images through next/image, uploaded ones as-is. */
export function CarPhoto({ image, alt, className }: { image: CarModel["variants"][number]["image"]; alt: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-white", className)}>
      <Image src={image} alt={alt} fill sizes="320px" unoptimized={isUploadedPhoto(image)} className="object-contain" />
    </div>
  );
}

export const getOverrides = () => api<CatalogOverrides>("/catalog");

/** Saves to the backend, then refreshes the website so visitors see it right away. */
export async function saveCatalog(path: string, method: "PUT" | "DELETE", body?: unknown) {
  const overrides = await api<CatalogOverrides>(`/catalog/${path}`, { method, body });
  await refreshWebsiteCatalog().catch((err) => console.error("[fleet] Website refresh failed (it updates within a minute anyway):", err));
  return overrides;
}
