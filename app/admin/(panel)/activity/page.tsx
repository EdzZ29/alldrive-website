import type { Metadata } from "next";
import { ActivityView } from "./activity-view";

export const metadata: Metadata = { title: "Activity log" };
// Rendered only after the browser confirms the sign-in (see the panel layout).
export const instant = false;

export default function AdminActivityPage() {
  return <ActivityView />;
}
