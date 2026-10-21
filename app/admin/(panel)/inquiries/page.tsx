import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { InquiriesView } from "./inquiries-view";

export const metadata: Metadata = { title: "Inquiries" };
// Rendered only after the browser confirms the sign-in (see the panel layout).
export const instant = false;

export default function AdminInquiriesPage() {
  return (
    // The view reads ?id= from the URL, which needs a Suspense boundary.
    <Suspense fallback={<Loader2 className="mx-auto my-16 size-6 animate-spin text-muted-foreground" aria-label="Loading" />}>
      <InquiriesView />
    </Suspense>
  );
}
