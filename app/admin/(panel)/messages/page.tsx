import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { MessagesView } from "./messages-view";

export const metadata: Metadata = { title: "Messages" };
// Rendered only after the browser confirms the sign-in (see the panel layout).
export const instant = false;

export default function AdminMessagesPage() {
  return (
    // The view reads ?id= from the URL, which needs a Suspense boundary.
    <Suspense fallback={<Loader2 className="mx-auto my-16 size-6 animate-spin text-muted-foreground" aria-label="Loading" />}>
      <MessagesView />
    </Suspense>
  );
}
