import type { Metadata } from "next";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "Settings" };
// Rendered only after the browser confirms the sign-in (see the panel layout).
export const instant = false;

export default function AdminSettingsPage() {
  return <SettingsView />;
}
