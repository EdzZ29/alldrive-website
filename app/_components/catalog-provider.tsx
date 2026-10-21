"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { catalogFrom, mergeCatalog, type Catalog, type CatalogData } from "@/lib/site";

// Built-in fleet, used only if a component renders outside the provider.
const fallback = catalogFrom(mergeCatalog(null));
const CatalogContext = createContext<Catalog>(fallback);

/** Gives client components the same fleet, prices and photos the server rendered. */
export function CatalogProvider({ data, children }: { data: CatalogData; children: ReactNode }) {
  const catalog = useMemo(() => catalogFrom(data), [data]);
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
