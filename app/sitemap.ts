import type { MetadataRoute } from "next";
import { modelPath, nav, site } from "@/lib/site";
import { getCatalog } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { models } = await getCatalog();
  const entry = (path: string, priority: number, images?: string[]): MetadataRoute.Sitemap[number] => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority,
    ...(images && { images }),
  });
  // Built-in photos are files on this site; photos added in the dashboard may be full URLs.
  const imageUrl = (image: string | { src: string }) => {
    const src = typeof image === "string" ? image : image.src;
    return src.startsWith("https://") ? src : `${site.url}${src}`;
  };

  return [
    // Home page (index)
    entry("", 1, [`${site.url}/opengraph-image.jpg`]),
    // Main pages
    ...nav.map((n) => entry(n.href, 0.8)),
    entry("/faq", 0.6),
    // One page per car, with its photos
    ...models.map((m) => entry(modelPath(m.id), 0.7, m.variants.map((v) => imageUrl(v.image)))),
  ];
}
