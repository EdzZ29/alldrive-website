import type { ReactNode } from "react";
import { AdminShell } from "../_components/admin-shell";

// Every signed-in admin page (everything under /admin except /admin/login).
//
// The shell shows its page only after the browser confirms the admin is signed in, so pages are
// never rendered on the server and Next.js can't check them for instant navigation. Each page
// therefore sets `export const instant = false` (it has to be on the page, not this layout).
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
