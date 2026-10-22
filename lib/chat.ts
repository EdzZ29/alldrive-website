// Live chat (the bubble at the bottom right): quick questions with instant answers and the
// automatic replies. Shared by the chat window (browser) and /api/live-chat (server), so both
// give the same answers from the same fleet, prices and contact details.
import { discountMinDays, rentalRequirements, site, type Catalog } from "./site";

export const CHAT_MAX_LENGTH = 1000;

export type ChatSender = "visitor" | "admin" | "auto";
export type ChatMessage = { id: number; sender: ChatSender; body: string; createdAt: string };

export const quickTopics = [
  { id: "rates", label: "How much is the rent?" },
  { id: "requirements", label: "What are the requirements?" },
  { id: "booking", label: "How do I book?" },
  { id: "location", label: "Where are you located?" },
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
        `We'll call or text you to confirm, and you'll get a "Booking Confirmed" message with your pickup day and time. You can check your booking anytime: ${site.url}/track`,
      ].join("\n\n");
    case "location":
      return `We're at ${site.address.full}, open 24 hours. Directions: ${site.directionsUrl}`;
  }
}

/** First thing the chat window says (shown in the window, not saved). */
export const chatGreeting = `Hi! Welcome to ${site.legalName}. Pick a question below for an instant answer, or send us a message and our team will reply here.`;

/** Automatic reply to the visitor's first message. */
export function firstMessageReply(name: string, contact: string) {
  const first = name.trim().split(/\s+/)[0] || "there";
  return `Thanks, ${first}! We got your message, and someone from our team will reply right here shortly. If you have to leave, we'll call or text you at ${contact}.`;
}
