// Per-visitor limit for the booking and inquiry forms, which send emails, paid texts and
// dashboard entries. Kept in memory, so it resets when the server restarts; enough to stop
// someone spamming a form.

const WINDOW_MS = 30 * 60 * 1000;

/** Returns a checker that allows `limit` submissions per visitor every 30 minutes. */
export function createRateLimiter(limit: number) {
  const recent = new Map<string, number[]>();
  return function isRateLimited(key: string) {
    const now = Date.now();
    const times = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    if (times.length >= limit) return true;
    recent.set(key, [...times, now]);
    if (recent.size > 5000) recent.delete(recent.keys().next().value!);
    return false;
  };
}
