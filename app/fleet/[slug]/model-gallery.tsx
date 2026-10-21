"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { isUploadedPhoto, type CarModel } from "@/lib/site";

/** Large car photo with color swatches. */
export function ModelGallery({ model }: { model: CarModel }) {
  const [variant, setVariant] = useState(0);
  const many = model.variants.length > 1;

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-line bg-white">
        {model.variants.map((v, i) => (
          <Image
            key={`${i}-${v.label}`}
            src={v.image}
            alt={`${model.name}${many ? ` in ${v.label}` : ""} for rent in Butuan City`}
            fill
            preload={i === 0}
            placeholder={isUploadedPhoto(v.image) ? "empty" : "blur"}
            unoptimized={isUploadedPhoto(v.image)}
            sizes="(min-width: 1024px) 58vw, 100vw"
            className={cn("object-contain p-4 transition-opacity duration-700", i === variant ? "opacity-100" : "opacity-0")}
          />
        ))}
      </div>

      {many && (
        <div role="radiogroup" aria-label={`${model.name} color`} className="mt-4 flex flex-wrap gap-2">
          {model.variants.map((v, i) => (
            <button
              key={`${i}-${v.label}`}
              type="button"
              role="radio"
              aria-checked={i === variant}
              onClick={() => setVariant(i)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl border bg-white px-3 text-sm font-semibold transition-all hover:-translate-y-0.5",
                i === variant ? "border-ink text-ink shadow-sm" : "border-line text-mute hover:border-ink/30",
              )}
            >
              <span className="size-4 rounded-full border border-line" style={{ backgroundColor: v.color }} />
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
