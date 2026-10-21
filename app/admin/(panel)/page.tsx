import type { Metadata } from "next";
import { OverviewView } from "./overview-view";

export const metadata: Metadata = { title: "Overview" };
// Rendered only after the browser confirms the sign-in (see the panel layout).
export const instant = false;

export default function AdminOverviewPage() {
  return <OverviewView />;
}
