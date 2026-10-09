import { CarFront } from "lucide-react";

const items = [
  "Butuan City",
  "Agusan del Norte",
  "Agusan del Sur",
  "Surigao del Norte",
  "Surigao del Sur",
  "Cagayan de Oro",
  "Davao City",
  "Airport Transfers",
  "Weddings",
  "Road Trips",
];

export function Marquee() {
  return (
    <div className="relative z-10 overflow-hidden py-6" aria-label="Destinations we serve">
      <div className="marquee-mask -mx-10 -rotate-[1.5deg] bg-brand py-4 sm:py-5">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
              {items.map((item) => (
                <li key={item} className="flex items-center gap-6 px-3 font-display text-xl font-extrabold tracking-tight text-ink uppercase sm:text-3xl">
                  {item}
                  <CarFront className="size-6 shrink-0 sm:size-7" strokeWidth={2.4} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
