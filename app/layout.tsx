import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { RevealObserver } from "./_components/reveal-observer";
import { Navbar } from "./_components/navbar";
import { Footer } from "./_components/contact";
import { JsonLd } from "./_components/json-ld";
import { Analytics } from "@vercel/analytics/next";
import { catalogFrom, site, type Catalog } from "@/lib/site";
import { getCatalogData } from "@/lib/catalog";
import { CatalogProvider } from "./_components/catalog-provider";
import { homeTitle } from "@/lib/seo";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: homeTitle,
    template: `%s | ${site.legalName}`,
  },
  description: site.description,
  applicationName: site.legalName,
  // Google ignores this tag, but other search engines may read it. The phrases matter more in page text.
  keywords: [
    "car rental Butuan",
    "car rental Butuan City",
    "Butuan car rental",
    "rent a car Butuan",
    "rent a car Butuan City",
    "car for rent Butuan",
    "car for rent Butuan City",
    "rental car Butuan",
    "self drive car rental Butuan",
    "self drive Butuan",
    "car rental with driver Butuan",
    "van for rent Butuan",
    "van rental Butuan",
    "Hiace for rent Butuan",
    "SUV for rent Butuan",
    "pickup for rent Butuan",
    "Vios for rent Butuan",
    "Innova for rent Butuan",
    "Bancasi airport car rental",
    "Butuan airport car rental",
    "car rental Caraga",
    "car rental Agusan del Norte",
    "car rental Surigao",
    "car rental Cabadbaran",
    "car rental Mindanao",
    "wedding car rental Butuan",
    "24 hour car rental Butuan",
    "cheap car rental Butuan",
    "AllDrive",
    "AllDrive Rent a Car Butuan",
  ],
  // Canonical URL and share card are set per page (see lib/seo.ts).
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: site.legalName,
    title: homeTitle,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "travel",
  formatDetection: { telephone: false },
  // Google Search Console "HTML tag" verification code (only the content="..." value).
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  }),
};

export const viewport: Viewport = {
  themeColor: "#070c16",
  colorScheme: "light",
};

function businessJsonLd({ fleet, driverRate, startingRate }: Catalog) {
  return {
  "@context": "https://schema.org",
  "@type": "AutoRental",
  "@id": `${site.url}/#business`,
  name: site.legalName,
  alternateName: site.name,
  description: site.description,
  url: site.url,
  logo: `${site.url}/icon.png`,
  image: `${site.url}/opengraph-image.jpg`,
  telephone: site.phoneHref,
  priceRange: `₱${startingRate.toLocaleString("en-PH")}+ per day`,
  currenciesAccepted: "PHP",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
  hasMap: site.mapsUrl,
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  areaServed: site.areaServed.map((name) => ({ "@type": "Place", name })),
  sameAs: [site.facebook, site.mapsUrl],
  contactPoint: site.phones.map((p) => ({
    "@type": "ContactPoint",
    telephone: p.href,
    contactType: "reservations",
    name: p.network,
    availableLanguage: ["English", "Filipino", "Cebuano"],
  })),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Car rental rates",
    itemListElement: fleet.filter((v) => v.rates.butuan != null).map((v) => ({
      "@type": "Offer",
      name: `${v.name} rental (${v.seats})`,
      priceCurrency: "PHP",
      price: v.rates.butuan,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: v.rates.butuan,
        priceCurrency: "PHP",
        unitText: "per day, within Butuan City",
      },
      itemOffered: { "@type": "Service", name: `${v.name} rental, ${v.seats}`, serviceType: "Car rental" },
    })).concat({
      "@type": "Offer",
      name: "Professional driver",
      priceCurrency: "PHP",
      price: driverRate,
      priceSpecification: { "@type": "UnitPriceSpecification", price: driverRate, priceCurrency: "PHP", unitText: "per day" },
      itemOffered: { "@type": "Service", name: "Professional driver service", serviceType: "Chauffeur service" },
    }),
  },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Fleet, prices and photos as edited in the admin dashboard (built-in fleet as fallback).
  const catalogData = await getCatalogData();
  const jsonLd = businessJsonLd(catalogFrom(catalogData));
  return (
    <html lang="en-PH" data-scroll-behavior="smooth" className={`${geist.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <JsonLd data={jsonLd} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <CatalogProvider data={catalogData}>
          <Navbar />
          {children}
          <Footer />
        </CatalogProvider>
        <RevealObserver />
        <Analytics />
      </body>
    </html>
  );
}
