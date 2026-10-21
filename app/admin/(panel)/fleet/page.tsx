import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { FleetView } from "./fleet-view";

export const metadata: Metadata = { title: "Fleet & prices" };

export default function AdminFleetPage() {
  return (
    // The view reads ?tab= from the URL, which needs a Suspense boundary.
    <Suspense fallback={<Loader2 className="mx-auto my-16 size-6 animate-spin text-muted-foreground" aria-label="Loading" />}>
      <FleetView />
    </Suspense>
  );
}
