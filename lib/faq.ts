import { driverRate, fleet, models, peso, startingRate } from "./site";

const rate = (id: string) => {
  const r = fleet.find((v) => v.id === id)?.rates.butuan;
  return r == null ? "on request" : peso(r);
};

const modelNames = (category: string) =>
  models
    .filter((m) => m.category === category)
    .map((m) => m.name.replace(/^(Toyota|Nissan|Mitsubishi) /, ""))
    .join(", ");

/**
 * Questions people commonly search for about renting a car in Butuan. The answers are plain
 * text so they double as FAQ structured data.
 */
export const faqs: { q: string; a: string }[] = [
  {
    q: "How much is car rental in Butuan City?",
    a: `Self-drive car rental in Butuan City starts at ${peso(startingRate)} per day for a sedan. MPVs start at ${rate("mpv")}, SUVs and pickups at ${rate("suv")}, and van rates are on request. Rates go up the farther you travel: within Caraga, Cagayan de Oro and Davao City, or the rest of Mindanao.`,
  },
  {
    q: "Do you offer self-drive car rental in Butuan?",
    a: "Yes. Most of our cars can be rented self-drive for city errands, business trips and road trips. Tell us how many years you have been driving when you book.",
  },
  {
    q: "Can I rent a car with a driver in Butuan?",
    a: `Yes. A professional driver is ${peso(driverRate)} per day on top of the car rental, the same rate for any destination in Mindanao. Meals during the trip and the driver's accommodation on overnight trips are shouldered by the renter.`,
  },
  {
    q: "Do you offer car rental with airport pickup at Bancasi Airport?",
    a: "Yes. Let us know your flight details when you book and we can meet you with the car at Bancasi Airport (Butuan Airport).",
  },
  {
    q: "Can I take the rental car outside Butuan City?",
    a: "Yes. You can drive anywhere in Mindanao, including Surigao, Cabadbaran, Bayugan, Cagayan de Oro, Davao City and beyond. Each area has its own daily rate, listed on our rates page.",
  },
  {
    q: "What cars and vans are available for rent?",
    a: `Our fleet of 30+ cars includes sedans (${modelNames("sedan")}), MPVs (${modelNames("mpv")}), SUVs and pickups (${modelNames("suv")}) and vans for 12 to 15 passengers (${modelNames("van")}).`,
  },
  {
    q: "Is AllDrive Rent a Car Butuan open 24 hours?",
    a: "Yes, we are open 24 hours, every day. Message us on WhatsApp, Viber or Facebook Messenger any time.",
  },
  {
    q: "How do I book a rental car?",
    a: "Use the Book now button on our website, or message us on WhatsApp, Viber or Facebook Messenger. Share your name, destination, date and time, preferred car and number of days, and we will confirm your booking.",
  },
  {
    q: "Do you have weekly or monthly car rental?",
    a: "Yes. We offer daily, weekly and monthly rentals. Ask us about special long-term rates for extended stays and project-based work.",
  },
  {
    q: "Do you rent cars for weddings and tours?",
    a: "Yes. We provide bridal cars and entourage vehicles for weddings, and tour-ready cars and vans for trips around Butuan, Caraga and Mindanao.",
  },
];
