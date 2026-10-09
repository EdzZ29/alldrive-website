import Image from "next/image";
import { Clock, MoonStar, Utensils } from "lucide-react";
import driverImg from "@/public/images/fleet-lineup.jpg";
import { driverFees, overtimeRate, peso } from "@/lib/site";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionHeading } from "./section-heading";

export function DriverFees() {
  return (
    <section id="driver" className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionHeading index="04" eyebrow="With driver" title="Sit back. We'll take the wheel.">
              Add a professional, courteous driver to any rental. Fees depend on destination and duration.
            </SectionHeading>

            <div data-reveal style={{ "--d": "200ms" } as React.CSSProperties} className="relative mt-10 aspect-[16/10] overflow-hidden rounded-[1.75rem]">
              <Image
                src={driverImg}
                alt="AllDrive HiAce vans and SUVs lined up, ready with a driver"
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-[50%_35%]"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { Icon: Clock, title: "9-hour rate", body: `${peso(overtimeRate)}/hour overtime. Driver's meals during travel are shouldered by the renter.` },
                { Icon: MoonStar, title: "Whole-day rate", body: "For overnight stays. Driver's meals and accommodation are shouldered by the renter." },
              ].map(({ Icon, title, body }, i) => (
                <Card
                  key={title}
                  data-reveal
                  style={{ "--d": `${300 + i * 100}ms` } as React.CSSProperties}
                  className="group gap-0 rounded-2xl border border-line p-5 ring-0 transition-colors hover:border-brand/50"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:rotate-[-8deg] group-hover:bg-brand group-hover:text-ink">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle className="mt-4 font-sans text-base font-bold">{title}</CardTitle>
                  <CardDescription className="mt-1 leading-relaxed">{body}</CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Card data-reveal="right" className="gap-0 rounded-[1.75rem] border border-line p-0 ring-0">
            <Table>
              <TableCaption className="sr-only">Driver fees in Philippine pesos by destination</TableCaption>
              <TableHeader>
                <TableRow className="border-line hover:bg-transparent">
                  <TableHead className="h-auto px-4 py-6 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase sm:px-7">
                    Destination
                  </TableHead>
                  <TableHead className="h-auto px-2 py-6 text-right sm:px-5">
                    <span className="block font-display text-base font-bold text-foreground sm:text-lg">9 hours</span>
                    <span className="text-xs font-normal text-muted-foreground">+{peso(overtimeRate)}/hr OT</span>
                  </TableHead>
                  <TableHead className="h-auto px-4 py-6 text-right sm:px-7">
                    <span className="block font-display text-base font-bold text-foreground sm:text-lg">Whole day</span>
                    <span className="text-xs font-normal text-muted-foreground">overnight</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driverFees.map((row) => (
                  <TableRow key={row.destination} className="group border-line hover:bg-brand-50">
                    <TableHead scope="row" className="h-auto px-4 py-4 text-sm font-medium whitespace-normal text-foreground sm:px-7 sm:py-5 sm:text-base">
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">{row.destination}</span>
                    </TableHead>
                    <TableCell className="px-2 py-4 text-right text-sm font-bold tabular-nums sm:px-5 sm:py-5 sm:text-base">
                      {row.nineHours ? peso(row.nineHours) : <span className="text-xs font-medium text-muted-foreground/60">N/A</span>}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right text-sm font-bold tabular-nums sm:px-7 sm:py-5 sm:text-base">
                      {row.wholeDay ? peso(row.wholeDay) : <span className="text-xs font-medium text-muted-foreground/60">N/A</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <p data-reveal className="mt-5 flex items-center gap-2 text-sm text-mute">
            <Utensils className="size-4 text-brand-600" /> Driver fees are added on top of the vehicle rental rate.
          </p>
        </div>
      </div>
    </section>
  );
}
