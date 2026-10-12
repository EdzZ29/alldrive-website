import type { StaticImageData } from "next/image";
import viosBlack from "@/public/images/fleet/toyota-vios-black.webp";
import viosBlue from "@/public/images/fleet/toyota-vios-blue.webp";
import viosGreen from "@/public/images/fleet/toyota-vios-green.webp";
import viosSilver from "@/public/images/fleet/toyota-vios-silver.webp";
import avanza from "@/public/images/fleet/toyota-avanza.webp";
import livina from "@/public/images/fleet/nissan-livina.webp";
import innovaWhite from "@/public/images/fleet/toyota-innova-white.webp";
import innovaRed from "@/public/images/fleet/toyota-innova-red.webp";
import fortuner from "@/public/images/fleet/toyota-fortuner.webp";
import montero from "@/public/images/fleet/mitsubishi-montero-sport.webp";
import terra from "@/public/images/fleet/nissan-terra.webp";
import hilux from "@/public/images/fleet/toyota-hilux.webp";
import navara from "@/public/images/fleet/nissan-navara-ve.webp";
import triton from "@/public/images/fleet/mitsubishi-triton.webp";
import commuter from "@/public/images/fleet/toyota-hiace-commuter.webp";
import grandia from "@/public/images/fleet/toyota-hiace-gl-grandia.webp";
import urvan from "@/public/images/fleet/nissan-urvan.webp";

/**
 * All business details live here.
 */
const googlePlaceId = "ChIJBUESUZzBATMRMZf6knQ5TZw";

export const site = {
  name: "AllDrive",
  legalName: "AllDrive Rent a Car Butuan",
  tagline: "Rent a Car in Butuan City, Caraga Region",
  description:
    "Rent a car in Butuan City from ₱1,300/day. Self-drive or with a driver, open 24 hours, Bancasi Airport pickup. Toyota Vios, Innova, Fortuner, Hilux, Hiace vans and more for trips across Caraga and Mindanao.",
  // Live domain for SEO links, robots.txt and sitemap.xml. Vercel serves the site on www
  // (alldrivebutuan.com redirects there), so that is the canonical address.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.alldrivebutuan.com").replace(/\/+$/, ""),
  // Call numbers, shown only in the contact section and footer so clients can call AllDrive.
  // Everywhere else, buttons open a WhatsApp chat instead.
  phoneHref: "+639461260177",
  phones: [
    { network: "Smart", display: "0946 126 0177", href: "+639461260177" },
    { network: "Globe", display: "0956 227 5764", href: "+639562275764" },
  ],
  email: "alldrivebtc@gmail.com",
  messenger: "https://m.me/alldriverentacarbutuan",
  // WhatsApp and Viber chats go to the Smart number.
  whatsappNumber: "639461260177",
  viber: "viber://chat?number=%2B639461260177",
  facebook: "https://www.facebook.com/alldriverentacarbutuan",
  mapsUrl: `https://www.google.com/maps/place/?q=place_id:${googlePlaceId}`,
  // Opens turn-by-turn directions to the exact Google Maps pin.
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=AllDrive+Rent+a+Car+Butuan&destination_place_id=${googlePlaceId}`,
  reviewUrl: `https://search.google.com/local/writereview?placeid=${googlePlaceId}`,
  // Keyless Google Maps embed for the contact page.
  mapsEmbedUrl: "https://maps.google.com/maps?q=AllDrive+Rent+a+Car+Butuan,+Doongan,+Butuan+City&z=16&output=embed",
  address: {
    full: "Brgy, P-5 Lower Doongan, Doongan, Butuan City, 8600 Agusan del Norte",
    street: "P-5 Lower Doongan, Doongan",
    locality: "Butuan City",
    region: "Agusan del Norte",
    postalCode: "8600",
    country: "PH",
  },
  hours: "Open 24 hours",
  areaServed: ["Butuan City", "Caraga", "Cagayan de Oro", "Davao City", "Mindanao"],
} as const;

export const defaultChatMessage = "Hi AllDrive! I would like to rent a car.";

/**
 * Opens a WhatsApp chat (app on phones, WhatsApp Web on computers) with a ready-made message.
 * Uses api.whatsapp.com rather than the short wa.me link, which some PH networks block.
 */
export const whatsappLink = (message: string = defaultChatMessage) =>
  `https://api.whatsapp.com/send?phone=${site.whatsappNumber}&text=${encodeURIComponent(message)}`;

// From the Google Business listing. Update the count now and then.
export const googleRating = { value: "5.0", count: 92 };

/**
 * Clients who have rented from AllDrive, shown as text wordmarks. To show a real logo instead,
 * add its image under public/images/clients and set `logo` (only with the owner's permission).
 */
export const trustedBy: { name: string; short?: string; note: string; logo?: string }[] = [
  { name: "GMA Network", short: "GMA", note: "TV network" },
  { name: "Raffy Tulfo in Action", short: "RTIA", note: "Public service program" },
  { name: "Kapuso Mo, Jessica Soho", short: "KMJS", note: "Documentary program" },
];

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
  { label: "Fleet", href: "/fleet" },
  { label: "Rates", href: "/rates" },
  { label: "Driver", href: "/driver" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
] as const;

/** Where the instant quote lives (the estimator section). */
export const quoteHref = "/rates#book";

// Rate zones. Every Mindanao destination below maps to one of these.
export const zones = [
  { id: "butuan", label: "Butuan City", short: "Butuan" },
  { id: "caraga", label: "Within Caraga", short: "Caraga" },
  { id: "cdo-davao", label: "CDO & Davao City", short: "CDO / Davao" },
  { id: "outside", label: "Rest of Mindanao", short: "Outside" },
] as const;

export type ZoneId = (typeof zones)[number]["id"];

export type Place = { id: string; name: string; kind: "City" | "Province"; zone: ZoneId };

const place = (name: string, kind: Place["kind"], zone: ZoneId): Place => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  kind,
  zone,
});

// All Mindanao provinces and cities, grouped by region.
export const regions: { name: string; places: Place[] }[] = [
  {
    name: "Caraga",
    places: [
      place("Butuan City", "City", "butuan"),
      place("Agusan del Norte", "Province", "caraga"),
      place("Agusan del Sur", "Province", "caraga"),
      place("Dinagat Islands", "Province", "caraga"),
      place("Surigao del Norte", "Province", "caraga"),
      place("Surigao del Sur", "Province", "caraga"),
      place("Bayugan City", "City", "caraga"),
      place("Bislig City", "City", "caraga"),
      place("Cabadbaran City", "City", "caraga"),
      place("Surigao City", "City", "caraga"),
      place("Tandag City", "City", "caraga"),
    ],
  },
  {
    name: "Northern Mindanao",
    places: [
      place("Cagayan de Oro City", "City", "cdo-davao"),
      place("Bukidnon", "Province", "outside"),
      place("Camiguin", "Province", "outside"),
      place("Lanao del Norte", "Province", "outside"),
      place("Misamis Occidental", "Province", "outside"),
      place("Misamis Oriental", "Province", "outside"),
      place("El Salvador City", "City", "outside"),
      place("Gingoog City", "City", "outside"),
      place("Iligan City", "City", "outside"),
      place("Malaybalay City", "City", "outside"),
      place("Oroquieta City", "City", "outside"),
      place("Ozamiz City", "City", "outside"),
      place("Tangub City", "City", "outside"),
      place("Valencia City", "City", "outside"),
    ],
  },
  {
    name: "Davao Region",
    places: [
      place("Davao City", "City", "cdo-davao"),
      place("Davao de Oro", "Province", "outside"),
      place("Davao del Norte", "Province", "outside"),
      place("Davao del Sur", "Province", "outside"),
      place("Davao Occidental", "Province", "outside"),
      place("Davao Oriental", "Province", "outside"),
      place("Digos City", "City", "outside"),
      place("Mati City", "City", "outside"),
      place("Panabo City", "City", "outside"),
      place("Samal City", "City", "outside"),
      place("Tagum City", "City", "outside"),
    ],
  },
  {
    name: "Soccsksargen",
    places: [
      place("Cotabato", "Province", "outside"),
      place("Sarangani", "Province", "outside"),
      place("South Cotabato", "Province", "outside"),
      place("Sultan Kudarat", "Province", "outside"),
      place("General Santos City", "City", "outside"),
      place("Kidapawan City", "City", "outside"),
      place("Koronadal City", "City", "outside"),
      place("Tacurong City", "City", "outside"),
    ],
  },
  {
    name: "Zamboanga Peninsula",
    places: [
      place("Zamboanga del Norte", "Province", "outside"),
      place("Zamboanga del Sur", "Province", "outside"),
      place("Zamboanga Sibugay", "Province", "outside"),
      place("Dapitan City", "City", "outside"),
      place("Dipolog City", "City", "outside"),
      place("Isabela City", "City", "outside"),
      place("Pagadian City", "City", "outside"),
      place("Zamboanga City", "City", "outside"),
    ],
  },
  {
    name: "Bangsamoro & Sulu",
    places: [
      place("Basilan", "Province", "outside"),
      place("Lanao del Sur", "Province", "outside"),
      place("Maguindanao del Norte", "Province", "outside"),
      place("Maguindanao del Sur", "Province", "outside"),
      place("Sulu", "Province", "outside"),
      place("Tawi-Tawi", "Province", "outside"),
      place("Cotabato City", "City", "outside"),
      place("Lamitan City", "City", "outside"),
      place("Marawi City", "City", "outside"),
    ],
  },
];

export const places = regions.flatMap((r) => r.places);
export const findPlace = (id: string) => places.find((p) => p.id === id) ?? places[0];
export const placesInZone = (zone: ZoneId) => places.filter((p) => p.zone === zone);

export type VehicleId = "sedan" | "mpv" | "suv" | "van";

export type Vehicle = {
  id: VehicleId;
  name: string;
  short: string;
  seats: string;
  blurb: string;
  tags: string[];
  // Daily self-drive rate in PHP per zone. null = rate on request.
  rates: Record<ZoneId, number | null>;
};

export const fleet: Vehicle[] = [
  {
    id: "sedan",
    name: "Sedan",
    short: "Sedan",
    seats: "5 seats",
    blurb: "Easy to park, light on fuel. Built for city errands and business trips.",
    tags: ["City-friendly", "Fuel-efficient"],
    rates: { butuan: 1300, caraga: 1800, "cdo-davao": 2300, outside: 2800 },
  },
  {
    id: "mpv",
    name: "MPV",
    short: "MPV",
    seats: "7-8 seats",
    blurb: "Room for the whole family plus bags. The road-trip favorite.",
    tags: ["Family size", "Roomy cabin"],
    rates: { butuan: 1800, caraga: 2300, "cdo-davao": 2800, outside: 3300 },
  },
  {
    id: "suv",
    name: "SUV & Pickup",
    short: "SUV & Pickup",
    seats: "5-8 seats",
    blurb: "High clearance and torque for provincial roads and long hauls.",
    tags: ["High clearance", "Long trips"],
    rates: { butuan: 2500, caraga: 3000, "cdo-davao": 3500, outside: 4000 },
  },
  {
    id: "van",
    name: "Van",
    short: "Van",
    seats: "12-15 seats",
    blurb: "Move the whole team, entourage or barkada in one comfortable ride.",
    tags: ["Group travel", "Big cargo space"],
    // TODO: van rates not provided yet.
    rates: { butuan: null, caraga: null, "cdo-davao": null, outside: null },
  },
];

export type CarModel = {
  id: string;
  name: string;
  category: VehicleId;
  seats?: string;
  specs?: string[];
  variants: { label: string; color: string; image: StaticImageData }[];
  /** Own daily rates when this car is priced differently from its category. */
  rates?: Record<ZoneId, number | null>;
};

// The actual cars in the fleet. Multiple variants = available colors.
export const models: CarModel[] = [
  {
    id: "toyota-vios",
    name: "Toyota Vios",
    category: "sedan",
    variants: [
      { label: "Black", color: "#16181d", image: viosBlack },
      { label: "Blue", color: "#22344f", image: viosBlue },
      { label: "Green", color: "#4d5a3c", image: viosGreen },
      { label: "Silver · AT 2021", color: "#c4c8cc", image: viosSilver },
    ],
  },
  { id: "toyota-avanza", name: "Toyota Avanza", category: "mpv", variants: [{ label: "Black", color: "#16181d", image: avanza }] },
  { id: "nissan-livina", name: "Nissan Livina", category: "mpv", variants: [{ label: "Silver", color: "#c4c8cc", image: livina }] },
  {
    id: "toyota-innova",
    name: "Toyota Innova",
    category: "suv",
    seats: "7-8 seats",
    rates: { butuan: 2300, caraga: 2800, "cdo-davao": 3300, outside: 3800 },
    variants: [
      { label: "White", color: "#e8e9eb", image: innovaWhite },
      { label: "Red", color: "#5a1f2b", image: innovaRed },
    ],
  },
  { id: "toyota-fortuner", name: "Toyota Fortuner G", category: "suv", seats: "7 seats", variants: [{ label: "White", color: "#f2f2f2", image: fortuner }] },
  { id: "mitsubishi-montero-sport", name: "Mitsubishi Montero Sport", category: "suv", seats: "7 seats", variants: [{ label: "White", color: "#f2f2f2", image: montero }] },
  { id: "nissan-terra", name: "Nissan Terra", category: "suv", seats: "7 seats", variants: [{ label: "White", color: "#f2f2f2", image: terra }] },
  { id: "toyota-hilux", name: "Toyota Hilux", category: "suv", seats: "5 seats", specs: ["Pickup"], variants: [{ label: "Orange", color: "#c58a35", image: hilux }] },
  { id: "nissan-navara-ve", name: "Nissan Navara VE", category: "suv", seats: "5 seats", specs: ["Pickup"], variants: [{ label: "Silver", color: "#c4c8cc", image: navara }] },
  { id: "mitsubishi-triton", name: "Mitsubishi Triton", category: "suv", seats: "5 seats", specs: ["Pickup"], variants: [{ label: "Orange", color: "#d06a1f", image: triton }] },
  {
    id: "toyota-hiace-commuter",
    name: "Toyota Hiace Commuter Deluxe",
    category: "van",
    specs: ["2023", "Manual"],
    variants: [{ label: "Silver", color: "#c4c8cc", image: commuter }],
  },
  {
    id: "toyota-hiace-gl-grandia",
    name: "Toyota Hiace GL Grandia",
    category: "van",
    specs: ["2023", "Automatic"],
    variants: [{ label: "Black", color: "#16181d", image: grandia }],
  },
  { id: "nissan-urvan", name: "Nissan Urvan", category: "van", variants: [{ label: "Gray", color: "#4b4f55", image: urvan }] },
];

/** Total cars in the fleet (several units per model), shown in headings and stats. */
export const fleetSize = 30;
export const fleetSizeText = `${fleetSize}+`;

export const modelPath = (id: string) => `/fleet/${id}`;
export const findModel = (id: string) => models.find((m) => m.id === id);
export const vehicleOf = (model: CarModel) => fleet.find((v) => v.id === model.category)!;
/** A car's daily rates: its own if set, otherwise its category's. */
export const ratesOf = (model: CarModel) => model.rates ?? vehicleOf(model).rates;
/** Cheapest Butuan rate among the cars in a category (null if all are on request). */
export const fromRateOf = (vehicleId: VehicleId) => {
  const rates = models.filter((m) => m.category === vehicleId).flatMap((m) => (ratesOf(m).butuan == null ? [] : [ratesOf(m).butuan!]));
  return rates.length ? Math.min(...rates) : null;
};

export const driverRate = 1000; // PHP per day

export const peso = (n: number, decimals = 0) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Formats a rate, or "On request" when there is no fixed rate. */
export const rateText = (n: number | null, decimals = 0) => (n == null ? "On request" : peso(n, decimals));

export const startingRate = Math.min(...fleet.flatMap((v) => (v.rates.butuan == null ? [] : [v.rates.butuan])));

/**
 * Trip estimate used by both the estimator and the booking form. Pass modelId to use a car's own
 * rates (e.g. the Innova). total is null when the rate is on request.
 */
export function estimateTrip(vehicleId: VehicleId, zoneId: ZoneId, days: number, withDriver: boolean, modelId?: string) {
  const vehicle = fleet.find((v) => v.id === vehicleId)!;
  const model = modelId ? models.find((m) => m.id === modelId && m.category === vehicleId) : undefined;
  const dailyRate = (model ? ratesOf(model) : vehicle.rates)[zoneId];
  const rental = dailyRate == null ? null : dailyRate * days;
  const driver = withDriver ? driverRate * days : 0;
  return { vehicle, dailyRate, rental, driver, total: rental == null ? null : rental + driver };
}
