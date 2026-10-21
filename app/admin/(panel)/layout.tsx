import type { ReactNode } from "react";
import { AdminShell } from "../_components/admin-shell";

// Every signed-in admin page (everything under /admin except /admin/login).
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
