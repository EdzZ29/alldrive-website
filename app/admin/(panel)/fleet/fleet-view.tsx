"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { CatalogOverrides } from "@/lib/site";
import { errorText } from "../../_lib/api";
import { FilterChips, PageTitle } from "../../_components/ui";
import { getOverrides } from "./fleet-shared";
import { Prices } from "./prices";
import { Units } from "./units";
import { WebsiteCars } from "./website-cars";

const TABS = { cars: "Website cars", prices: "Prices", units: "Units" } as const;
type Tab = keyof typeof TABS;
const TAB_KEYS = Object.keys(TABS) as Tab[];

export function FleetView() {
  const router = useRouter();
  const pathname = usePathname();
  const param = useSearchParams().get("tab");
  const tab: Tab = TAB_KEYS.includes(param as Tab) ? (param as Tab) : "cars";
  const [overrides, setOverrides] = useState<CatalogOverrides | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOverrides().then(setOverrides, (err) => setError(errorText(err, "Couldn't load the fleet.")));
  }, []);

  return (
    <>
      <PageTitle title="Fleet & prices" description="What the website shows: cars, availability, prices and photos. Plus your actual cars by plate number." />
      <FilterChips
        label="Fleet sections"
        options={TAB_KEYS.map((k) => TABS[k])}
        value={TABS[tab]}
        onChange={(label) => {
          const key = TAB_KEYS.find((k) => TABS[k] === label)!;
          router.replace(key === "cars" ? pathname : `${pathname}?tab=${key}`, { scroll: false });
        }}
      />

      {tab === "units" ? (
        <Units />
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : !overrides ? (
        <Loader2 className="mx-auto my-12 size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : tab === "prices" ? (
        <Prices overrides={overrides} onSaved={setOverrides} />
      ) : (
        <WebsiteCars overrides={overrides} onSaved={setOverrides} />
      )}
    </>
  );
}
