// The fleet as shown on the website: the built-in cars and rates in lib/site.ts. To change a
// rate, a car's availability or its photos, edit lib/site.ts and redeploy.
import { catalogFrom, mergeCatalog, type CatalogData } from "./site";

const builtIn = mergeCatalog(null);

/** Plain data, so it can be passed to client components. */
export async function getCatalogData(): Promise<CatalogData> {
  return builtIn;
}

export async function getCatalog() {
  return catalogFrom(builtIn);
}
