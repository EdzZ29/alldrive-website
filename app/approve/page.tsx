import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { CircleAlert } from "lucide-react";
import { readApprovalToken } from "@/lib/approval";
import { site } from "@/lib/site";
import { ApproveForm } from "./approve-form";

// Opened from the "Approve booking" button in the team's booking email. Nothing is sent until the
// team taps the button on this page (email apps that preview links only load it).
export const metadata: Metadata = {
  title: "Approve booking",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ApprovePage({ searchParams }: PageProps<"/approve">) {
  return (
    <main className="min-h-svh bg-muted/40">
      <section className="bg-ink px-5 pt-44 pb-12 text-white sm:pt-52">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold tracking-[0.25em] text-brand uppercase">{site.name} team</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Approve booking</h1>
          <p className="mt-3 text-white/70">Check the details, then send the customer their &ldquo;Booking approved&rdquo; email.</p>
        </div>
      </section>
      <section className="px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <Suspense fallback={<div aria-hidden className="h-[32rem] rounded-3xl border border-line bg-white" />}>
            <Approval searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

async function Approval({ searchParams }: Pick<PageProps<"/approve">, "searchParams">) {
  const { t } = await searchParams;
  // Checking the link's expiry reads the clock, so this runs on every request.
  await connection();
  const token = typeof t === "string" ? t : "";
  const check = readApprovalToken(token);
  if (!check.ok) {
    return (
      <div role="alert" className="flex gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900">
        <CircleAlert className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-bold">{check.reason === "expired" ? "This approval link has expired." : "This approval link isn't valid."}</p>
          <p className="mt-1 text-sm">
            Open the <b>Approve booking</b> button from the booking email again. If the link was copied, make sure all of it was copied. You can still
            confirm with the customer by calling, texting or replying to their email.
          </p>
        </div>
      </div>
    );
  }
  return <ApproveForm token={token} booking={check.booking} />;
}
