import type { Metadata } from "next";
import { CalendarView } from "./calendar-view";

export const metadata: Metadata = { title: "Calendar" };
// Rendered only after the browser confirms the sign-in (see the panel layout).
export const instant = false;

export default function AdminCalendarPage() {
  return <CalendarView />;
}
