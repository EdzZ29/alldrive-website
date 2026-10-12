import type { MetadataRoute } from "next";
import { modelPath, models, nav, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (path: string, priority: number, images?: string[]): MetadataRoute.Sitemap[number] => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority,
    ...(images && { images }),
  });

  return [
    // Home page (index)
    entry("", 1, [`${site.url}/opengraph-image.jpg`]),
    // Main pages
    ...nav.map((n) => entry(n.href, 0.8)),
    // One page per car, with its photos
    ...models.map((m) => entry(modelPath(m.id), 0.7, m.variants.map((v) => `${site.url}${v.image.src}`))),
  ];
}
