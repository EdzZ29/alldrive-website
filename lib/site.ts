import type { StaticImageData } from "next/image";
import sedanImg from "@/public/images/sedan.jpg";
import mpvImg from "@/public/images/mpv.jpg";
import suvImg from "@/public/images/suv.jpg";
import vanImg from "@/public/images/van.jpg";

/**
 * All business details live here. Before going live, set the
 * NEXT_PUBLIC_SITE_URL env var to the live domain.
 */
const googlePlaceId = "ChIJBUESUZzBATMRMZf6knQ5TZw";

export const site = {
  name: "AllDrive",
  legalName: "AllDrive Rent a Car Butuan",
  tagline: "Rent a Car in Butuan City, Caraga Region",
  description:
    "AllDrive Rent a Car Butuan: self-drive or with a professional driver, open 24 hours. Sedans, MPVs, SUVs, pickups and vans for city drives, airport pickups, weddings and trips across Caraga, CDO and Davao.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", // set NEXT_PUBLIC_SITE_URL to the live domain
  // Primary number, used for the main call/text buttons.
  phone: "0946 126 0177",
  phoneHref: "+639461260177",
  phones: [
    { network: "Smart", display: "0946 126 0177", href: "+639461260177" },
    { network: "Globe", display: "0956 227 5764", href: "+639562275764" },
  ],
  messenger: "https://m.me/alldriverentacarbutuan",
  facebook: "https://www.facebook.com/alldriverentacarbutuan",
  mapsUrl: `https://www.google.com/maps/place/?q=place_id:${googlePlaceId}`,
  // Opens turn-by-turn directions to the exact Google Maps pin.
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=AllDrive+Rent+a+Car+Butuan&destination_place_id=${googlePlaceId}`,
  reviewUrl: `https://search.google.com/local/writereview?placeid=${googlePlaceId}`,
  address: {
    full: "Brgy, P-5 Lower Doongan, Doongan, Butuan City, 8600 Agusan del Norte",
    street: "P-5 Lower Doongan, Doongan",
    locality: "Butuan City",
    region: "Agusan del Norte",
    postalCode: "8600",
    country: "PH",
  },
  hours: "Open 24 hours",
  areaServed: [
    "Butuan City",
    "Agusan del Norte",
    "Agusan del Sur",
    "Surigao del Norte",
    "Surigao del Sur",
    "Cagayan de Oro",
    "Davao City",
  ],
} as const;

// From the Google Business listing. Update the count now and then.
export const googleRating = { value: "5.0", count: 92 };

export const testimonials = [
  {
    name: "La mbo",
    quote:
      "I had a great experience with AllDrive Rent a Car Butuan. The whole rental process was easy and smooth, and the car was clean, comfortable, and reliable. The staff were very friendly, helpful, and professional…",
  },
  {
    name: "Michael Brown",
    quote:
      "This is by far the best car rental experience I have had in the Philippines. Very accommodating and well-maintained vehicles. If you let them know in advance they can pick you up at the airport with the car.",
  },
  {
    name: "Jerryl Corria Rondez-Layog",
    quote:
      "On 19 June 2026, while traveling to Talacogon to pay our respects at the wake of Rene, I rented a vehicle from this owner. The booking process was smooth and hassle-free. The owner arrived at the airport ahead of schedule…",
  },
];

export const nav = [
  { label: "Fleet", href: "#fleet" },
  { label: "Rates", href: "#rates" },
  { label: "Driver", href: "#driver" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
] as const;

export const routes = [
  { id: "city", label: "City Drive", long: "Butuan City Drive" },
  { id: "adn", label: "ADNorte", long: "Agusan del Norte" },
  { id: "ags", label: "AGSur", long: "Agusan del Sur" },
  { id: "sdn", label: "SDNorte", long: "Surigao del Norte" },
  { id: "sds", label: "SDSur", long: "Surigao del Sur" },
  { id: "cdo", label: "CDO City", long: "Cagayan de Oro City" },
  { id: "dav", label: "Davao City", long: "Davao City" },
] as const;

export type RouteId = (typeof routes)[number]["id"];
export type VehicleId = "sedan" | "mpv" | "suv" | "van";

export type Vehicle = {
  id: VehicleId;
  name: string;
  short: string;
  seats: string;
  blurb: string;
  tags: string[];
  image: StaticImageData;
  rates: Record<RouteId, number>;
};

// Daily rental rates in PHP, self-drive, per destination.
export const fleet: Vehicle[] = [
  {
    id: "sedan",
    name: "Sedan",
    short: "Sedan",
    seats: "5 seats",
    blurb: "Easy to park, light on fuel. Built for city errands and business trips.",
    tags: ["City-friendly", "Fuel-efficient"],
    image: sedanImg,
    rates: { city: 1300, adn: 1800, ags: 2000, sdn: 1800, sds: 2000, cdo: 2500, dav: 2800 },
  },
  {
    id: "mpv",
    name: "MPV",
    short: "MPV",
    seats: "7-8 seats",
    blurb: "Room for the whole family plus bags. The road-trip favorite.",
    tags: ["Family size", "Roomy cabin"],
    image: mpvImg,
    rates: { city: 1900, adn: 2400, ags: 2500, sdn: 2400, sds: 2500, cdo: 3000, dav: 3500 },
  },
  {
    id: "suv",
    name: "Full-Size SUV & Pickup",
    short: "SUV & Pickup",
    seats: "7 seats",
    blurb: "High clearance and torque for provincial roads and long hauls.",
    tags: ["High clearance", "Long trips"],
    image: suvImg,
    rates: { city: 2500, adn: 2800, ags: 3000, sdn: 3000, sds: 3000, cdo: 3500, dav: 4000 },
  },
  {
    id: "van",
    name: "Van",
    short: "Van",
    seats: "13-15 seats",
    blurb: "Move the whole team, entourage or barkada in one comfortable ride.",
    tags: ["Group travel", "Big cargo space"],
    image: vanImg,
    rates: { city: 3500, adn: 4000, ags: 4000, sdn: 4000, sds: 4000, cdo: 4500, dav: 4500 },
  },
];

// Driver fees in PHP. null = not offered for that option.
export const driverFees: { destination: string; nineHours: number | null; wholeDay: number | null }[] = [
  { destination: "City Drive", nineHours: 500, wholeDay: null },
  { destination: "Magallanes / Cabadbaran", nineHours: 800, wholeDay: 1000 },
  { destination: "Kitcharao", nineHours: 800, wholeDay: 1000 },
  { destination: "Agusan del Norte", nineHours: 800, wholeDay: 1000 },
  { destination: "Agusan del Sur (Bayugan to San Francisco)", nineHours: 800, wholeDay: 1000 },
  { destination: "Agusan del Sur (rest of AGSur)", nineHours: 1000, wholeDay: 1000 },
  { destination: "Surigao del Norte", nineHours: 800, wholeDay: 1000 },
  { destination: "Surigao del Sur", nineHours: null, wholeDay: 1000 },
];

export const overtimeRate = 80;

// Driver fee used by the trip estimator for each rental route (null = quoted on request).
export const driverFeeByRoute: Record<RouteId, number | null> = {
  city: 500,
  adn: 800,
  ags: 800,
  sdn: 800,
  sds: 1000,
  cdo: null,
  dav: null,
};

export const peso = (n: number, decimals = 0) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const startingRate = Math.min(...fleet.map((v) => v.rates.city));
