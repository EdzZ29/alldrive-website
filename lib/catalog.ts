// The fleet as shown on the website: built-in cars plus the admin dashboard's changes (rates,
// availability, photos), fetched from the AllDrive backend. Server-only.
import { cacheLife, cacheTag } from "next/cache";
import { catalogFrom, mergeCatalog, type CatalogData, type CatalogOverrides } from "./site";

export const CATALOG_TAG = "catalog";

const API_URL = (process.env.ALLDRIVE_API_URL || "").replace(/\/+$/, "");

// The last changes fetched successfully by this server, so a brief backend outage doesn't
// flip the site back to built-in prices.
let lastGood: CatalogOverrides | null = null;

async function fetchOverrides(): Promise<CatalogOverrides | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/api/catalog`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    lastGood = (await res.json()) as CatalogOverrides;
  } catch (err) {
    console.error(`Couldn't load the fleet from the dashboard, using ${lastGood ? "the last copy" : "the built-in fleet"}:`, err);
  }
  return lastGood;
}

/**
 * Cached for a minute and refreshed right away when an admin saves (updateTag in
 * app/admin/_lib/catalog-actions.ts). Plain data, so it can be passed to client components.
 */
export async function getCatalogData(): Promise<CatalogData> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);
  return mergeCatalog(await fetchOverrides());
}

export async function getCatalog() {
  return catalogFrom(await getCatalogData());
}
