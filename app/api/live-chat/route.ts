// The website's live chat (the bubble at the bottom right). The visitor's browser talks only to
// this route; it checks and rate-limits each request, writes the automatic replies and forwards
// everything to the admin dashboard with the website key, which never reaches the browser.
//
// GET  ?after=<id>, header x-chat-token  -> new messages (the browser polls this)
// POST { action: "start", name, contact, message, page, website, startedAt }
// POST { action: "send", token, message }
// POST { action: "quick", token, topic }  -> the question plus its instant answer
import { NextResponse, type NextRequest } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { CHAT_MAX_LENGTH, firstMessageReply, isQuickTopic, quickAnswer, quickTopics } from "@/lib/chat";
import {
  addChatMessagesInDashboard,
  DashboardError,
  dashboardConfigured,
  pollChatInDashboard,
  startChatInDashboard,
} from "@/lib/dashboard";
import { createRateLimiter } from "@/lib/rate-limit";

// Per visitor (IP) every 30 minutes.
const startLimited = createRateLimiter(4);
const messageLimited = createRateLimiter(60);

const TOKEN = /^[A-Za-z0-9_-]{20,64}$/;

const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
const ok = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const ipOf = (req: NextRequest) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

// A chat the dashboard no longer knows (deleted as spam): the browser starts over.
function dashboardFailure(err: unknown) {
  if (err instanceof DashboardError && err.status === 404) return fail(404, "expired");
  console.error("Live chat:", err);
  return fail(502, "We couldn't send that. Please try again, or message us on WhatsApp.");
}

export async function GET(req: NextRequest) {
  if (!dashboardConfigured) return fail(503, "unavailable");
  const token = req.headers.get("x-chat-token") ?? "";
  if (!TOKEN.test(token)) return fail(404, "expired");
  const after = Math.max(0, Math.floor(Number(req.nextUrl.searchParams.get("after")) || 0));
  try {
    return ok(await pollChatInDashboard(token, after));
  } catch (err) {
    return dashboardFailure(err);
  }
}

export async function POST(req: NextRequest) {
  if (!dashboardConfigured) return fail(503, "Chat is unavailable right now. Please message us on WhatsApp or Messenger.");
  const data = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || typeof data !== "object") return fail(400, "Invalid request.");
  const ip = ipOf(req);

  if (data.action === "start") {
    // Same spam guards as the website's forms: a hidden honeypot field and a minimum time.
    if (text(data.website, 200)) return ok({ token: null, messages: [] });
    const startedAt = Number(data.startedAt);
    if (!startedAt || Date.now() - startedAt < 2000) return fail(400, "Please take a moment, then send your message again.");

    const name = text(data.name, 100);
    const contact = text(data.contact, 30);
    const message = text(data.message, CHAT_MAX_LENGTH);
    const page = text(data.page, 120);
    const missing = [!name && "your name", contact.replace(/\D/g, "").length < 7 && "your mobile number", !message && "a message"].filter(Boolean);
    if (missing.length) return fail(400, `Please enter ${missing.join(" and ")}.`);
    if (startLimited(ip)) return fail(429, "You've started several chats already. Please call or text us instead.");

    try {
      return ok(
        await startChatInDashboard({
          name,
          contact,
          ...(page && { page }),
          messages: [
            { sender: "visitor", body: message },
            { sender: "auto", body: firstMessageReply(name, contact) },
          ],
        }),
      );
    } catch (err) {
      return dashboardFailure(err);
    }
  }

  const token = text(data.token, 64);
  if (!TOKEN.test(token)) return fail(404, "expired");
  if (messageLimited(ip)) return fail(429, "You're sending messages very fast. Please wait a moment.");

  if (data.action === "send") {
    const message = text(data.message, CHAT_MAX_LENGTH);
    if (!message) return fail(400, "Please type a message.");
    try {
      return ok(await addChatMessagesInDashboard(token, [{ sender: "visitor", body: message }]));
    } catch (err) {
      return dashboardFailure(err);
    }
  }

  if (data.action === "quick" && isQuickTopic(data.topic)) {
    const topic = quickTopics.find((t) => t.id === data.topic)!;
    // The answer is written here from the site's own data, never taken from the browser.
    const answer = quickAnswer(topic.id, await getCatalog());
    try {
      return ok(
        await addChatMessagesInDashboard(token, [
          { sender: "visitor", body: topic.label },
          { sender: "auto", body: answer },
        ]),
      );
    } catch (err) {
      return dashboardFailure(err);
    }
  }

  return fail(400, "Invalid request.");
}
