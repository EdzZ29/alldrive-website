import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

export function SectionHeading({
  index,
  eyebrow,
  title,
  children,
  dark = false,
  center = false,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  dark?: boolean;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p
        data-reveal
        className={`flex items-center gap-3 text-xs font-bold tracking-[0.25em] uppercase ${center ? "justify-center" : ""} ${dark ? "text-brand" : "text-brand-600"}`}
      >
        <Badge
          variant="secondary"
          className={`h-6 rounded-md px-2 font-mono text-[11px] tracking-normal ${dark ? "bg-white/10 text-white" : "bg-ink text-white"}`}
        >
          {index}
        </Badge>
        {eyebrow}
      </p>
      <h2
        data-reveal
        style={{ "--d": "80ms" } as React.CSSProperties}
        className={`mt-5 font-display text-4xl leading-[1.02] font-extrabold tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl ${dark ? "text-white" : "text-ink"}`}
      >
        {title}
      </h2>
      {children && (
        <p
          data-reveal
          style={{ "--d": "160ms" } as React.CSSProperties}
          className={`mt-5 text-lg leading-relaxed text-pretty ${dark ? "text-white/65" : "text-mute"}`}
        >
          {children}
        </p>
      )}
    </div>
  );
}
