import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "../_components/page-hero";
import { TrackForm } from "./track-form";

export const metadata = {
  ...pageMetadata({
    title: "Track My Booking",
    description: "Check the status of your AllDrive car rental booking with your booking code and the email or mobile number you booked with.",
    path: "/track",
  }),
  // A lookup form, not something to show in search results.
  robots: { index: false, follow: true },
};

export default function TrackPage() {
  return (
    <main>
      <PageHero crumbs={[{ label: "Track my booking", href: "/track" }]} eyebrow="Track my booking" title="Where's my booking?">
        Enter your booking code and the email or mobile number you booked with to see if your car is confirmed.
      </PageHero>
      <section className="bg-white px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-xl">
          {/* The form reads ?ref= from the link in the booking email. */}
          <Suspense fallback={<div aria-hidden className="h-[26rem] rounded-[1.75rem] border border-line bg-white" />}>
            <TrackForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
