import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { RevealObserver } from "./_components/reveal-observer";
import { Analytics } from "@vercel/analytics/next";
import { driverRate, fleet, site, startingRate } from "@/lib/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const title = `${site.legalName} | Self-Drive & With Driver`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s | ${site.legalName}`,
  },
  description: site.description,
  applicationName: site.legalName,
  keywords: [
    "car rental Butuan",
    "Butuan car rental",
    "rent a car Butuan City",
    "self drive car rental Butuan",
    "car rental with driver Butuan",
    "van rental Butuan",
    "car rental Caraga",
    "car rental Agusan del Norte",
    "airport transfer Bancasi",
    "wedding car rental Butuan",
    "24 hour car rental Butuan",
    "AllDrive",
    "AllDrive Rent a Car Butuan",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "/",
    siteName: site.legalName,
    title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "travel",
  formatDetection: { telephone: true },
  // Google Search Console "HTML tag" verification code (only the content="..." value).
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  }),
};

export const viewport: Viewport = {
  themeColor: "#070c16",
  colorScheme: "light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoRental",
  "@id": `${site.url}/#business`,
  name: site.legalName,
  alternateName: site.name,
  description: site.description,
  url: site.url,
  logo: `${site.url}/logo-mark.png`,
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
      itemOffered: { "@type": "Product", name: `${v.name}, ${v.seats}` },
    })).concat({
      "@type": "Offer",
      name: "Professional driver",
      priceCurrency: "PHP",
      price: driverRate,
      priceSpecification: { "@type": "UnitPriceSpecification", price: driverRate, priceCurrency: "PHP", unitText: "per day" },
      itemOffered: { "@type": "Product", name: "Professional driver service" },
    }),
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-PH" className={`${geist.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
        <RevealObserver />
        <Analytics />
      </body>
    </html>
  );
}
