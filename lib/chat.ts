// Live chat (the bubble at the bottom right): quick questions with instant answers and the
// automatic replies. Used by the chat window, so its answers come from the same fleet, prices
// and contact details as the rest of the site.
import { discountMinDays, rentalRequirements, site, type Catalog } from "./site";

export const CHAT_MAX_LENGTH = 1000;

export type ChatSender = "visitor" | "admin" | "auto";
export type ChatMessage = { id: number; sender: ChatSender; body: string; createdAt: string };

export const quickTopics = [
  { id: "rates", label: "How much is the rent?" },
  { id: "requirements", label: "What are the requirements?" },
  { id: "booking", label: "How do I book?" },
  { id: "location", label: "Where are you located?" },
  { id: "airportPickup", label: "Can I get the car at the airport?" },
  { id: "airportDropoff", label: "Can I return the car at the airport?" },
] as const;
export type QuickTopicId = (typeof quickTopics)[number]["id"];

export const isQuickTopic = (id: unknown): id is QuickTopicId => quickTopics.some((t) => t.id === id);

const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

/** Instant answer to a quick question. */
export function quickAnswer(id: QuickTopicId, catalog: Pick<Catalog, "startingRate" | "driverRate">): string {
  switch (id) {
    case "rates":
      return [
        `Our rates start at ${peso(catalog.startingRate)} a day within Butuan City. The price depends on the car and where you're going.`,
        `A professional driver is ${peso(catalog.driverRate)} a day, and renting ${discountMinDays} days or more gets a discount.`,
        `See every car's rates: ${site.url}/rates`,
      ].join("\n\n");
    case "requirements":
      return [
        "Please prepare:",
        ...rentalRequirements.everyone.map((r) => `• ${r}`),
        ...rentalRequirements.selfDrive.map((r) => `• Self-drive: ${r}`),
        ...rentalRequirements.withDriver.map((r) => `• With a driver: ${r}`),
      ].join("\n");
    case "booking":
      return [
        'Tap "Book now" at the top of the page (on phones it\'s in the menu), then choose your car, dates and destination and send it.',
        `We'll call or text you to confirm, and you'll get a "Booking approved" message with your pickup day and time. Questions about your booking? Message us on WhatsApp or Messenger with your booking code.`,
      ].join("\n\n");
    case "location":
      return `We're at ${site.address.full}, open 24 hours. Directions: ${site.directionsUrl}`;
    case "airportPickup":
      return [
        "Yes! We can meet you with the car at Bancasi Airport (Butuan Airport) when you land.",
        'When you book, write "airport pickup" with your flight number and arrival time under Purpose, or send them to us here. We\'ll be at the arrival area ahead of time, and if your flight is delayed, we\'ll wait.',
      ].join("\n\n");
    case "airportDropoff":
      return [
        "Yes! You can return the car at Bancasi Airport (Butuan Airport) before your flight.",
        "Tell us your flight number and departure time when you book, or send them here, and we'll meet you at the departure area to take the car back. Please come about 2 hours before your flight so there's time for check-in.",
      ].join("\n\n");
  }
}

/** First thing the chat window says (shown in the window, not saved). */
export const chatGreeting = `Hi! Welcome to ${site.legalName}. Pick a question below for an instant answer, or type a message to send it to our team on WhatsApp.`;

/** Automatic reply to the visitor's first message. */
export function firstMessageReply(name: string, contact: string) {
  const first = name.trim().split(/\s+/)[0] || "there";
  return `Thanks, ${first}! We got your message, and someone from our team will reply right here shortly. If you have to leave, we'll call or text you at ${contact}.`;
}
