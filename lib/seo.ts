import type { Metadata } from "next";
import { site } from "./site";

export const homeTitle = `${site.legalName} | Self-Drive & With Driver`;

/**
 * Per-page metadata. Every page sets its own canonical URL and share card, so Search Console
 * sees each page as its own entry instead of a copy of the home page.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  /** Short page title; the root layout appends "| AllDrive Rent a Car Butuan". Omit for the home page. */
  title?: string;
  description: string;
  path: string;
}): Metadata {
  const shareTitle = title ? `${title} | ${site.legalName}` : homeTitle;
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_PH",
      siteName: site.legalName,
      url: path,
      title: shareTitle,
      description,
    },
    twitter: { card: "summary_large_image", title: shareTitle, description },
  };
}
