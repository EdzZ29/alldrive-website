"use server";

import { cookies } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog";

const API_URL = (process.env.ALLDRIVE_API_URL || "").replace(/\/+$/, "");

/**
 * After an admin saves fleet changes: refresh the website's cached fleet so visitors see the
 * change right away instead of within a minute. Only for a signed-in admin (checked with the
 * backend), so nobody else can force refreshes.
 */
export async function refreshWebsiteCatalog(): Promise<{ ok: boolean }> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token || !API_URL) return { ok: false };
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Cookie: `access_token=${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false };
  } catch {
    return { ok: false };
  }
  // The fleet data itself...
  updateTag(CATALOG_TAG);
  // ...and every stored page, since they all show it (via the root layout). Without this, a page
  // that had been idle could still be served once from its older stored copy.
  revalidatePath("/", "layout");
  return { ok: true };
}
