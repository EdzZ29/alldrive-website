"use client";

import { useRef, useState } from "react";
import { EyeOff, ImagePlus, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { builtInFleet, builtInModels, catalogFrom, mergeCatalog, peso, type CatalogOverrides } from "@/lib/site";
import { api, errorText } from "../../_lib/api";
import { uploadCarPhoto } from "../../_lib/images";
import { SheetActions, sheetClass } from "../../_components/ui";
import { CarPhoto, fromDraft, RatesEditor, saveCatalog, toDraft, type RatesDraft } from "./fleet-shared";

type Availability = "available" | "unavailable" | "hidden";
type Photo = { url: string; label: string; color: string };

const AVAILABILITY: { value: Availability; label: string; note: string }[] = [
  { value: "available", label: "Available", note: "Listed with an “Available” badge." },
  { value: "unavailable", label: "Not available", note: "Still listed, with a “Not available” badge." },
  { value: "hidden", label: "Hidden", note: "Not shown on the website at all." },
];

const availabilityBadge: Record<Availability, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  unavailable: "bg-amber-50 text-amber-800 ring-amber-200",
  hidden: "bg-muted text-muted-foreground ring-line",
};

export function WebsiteCars({ overrides, onSaved }: { overrides: CatalogOverrides; onSaved: (o: CatalogOverrides) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  // Everything, hidden cars included, with the dashboard's changes applied.
  const catalog = catalogFrom(mergeCatalog(overrides, { includeHidden: true }));
  const model = editing ? builtInModels.find((m) => m.id === editing) : undefined;

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        The cars shown on the website. Tap a car to show or hide it, set its prices, or add photos. Changes appear on the
        website right away.
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {catalog.models.map((m) => {
          const availability: Availability = overrides.models[m.id]?.availability ?? "available";
          const from = catalog.ratesOf(m).butuan;
          const added = overrides.models[m.id]?.photos?.length ?? 0;
          return (
            <li key={m.id}>
              <button
                onClick={() => setEditing(m.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left transition hover:border-brand active:bg-muted/60",
                  availability === "hidden" && "opacity-70",
                )}
              >
                <CarPhoto image={m.variants[0].image} alt="" className="h-16 w-24 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{m.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {catalog.vehicleOf(m).short} · from {from == null ? "On request" : peso(from)}
                    {added > 0 && ` · +${added} photo${added > 1 ? "s" : ""}`}
                  </span>
                  <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset", availabilityBadge[availability])}>
                    {availability === "hidden" && <EyeOff className="size-3" />}
                    {AVAILABILITY.find((a) => a.value === availability)!.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!model} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className={sheetClass} onOpenAutoFocus={(e) => e.preventDefault()}>
          {model && (
            <CarEditor
              key={model.id}
              modelId={model.id}
              overrides={overrides}
              onSaved={(o) => {
                onSaved(o);
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CarEditor({ modelId, overrides, onSaved }: { modelId: string; overrides: CatalogOverrides; onSaved: (o: CatalogOverrides) => void }) {
  const builtIn = builtInModels.find((m) => m.id === modelId)!;
  const saved = overrides.models[modelId];
  const classOf = builtInFleet.find((v) => v.id === builtIn.category)!;
  // What applies with no custom prices: the car's own built-in rates, or its class's (as edited).
  const defaultRates = builtIn.rates ?? overrides.classes[builtIn.category]?.rates ?? classOf.rates;

  const [availability, setAvailability] = useState<Availability>(saved?.availability ?? "available");
  const [custom, setCustom] = useState(!!saved?.rates);
  const [rates, setRates] = useState<RatesDraft>(toDraft(saved?.rates ?? defaultRates));
  const [photos, setPhotos] = useState<Photo[]>(saved?.photos ?? []);
  const [busy, setBusy] = useState<"save" | "reset" | "upload" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy("upload");
    setError(null);
    try {
      for (const file of Array.from(files).slice(0, 12 - photos.length)) {
        const url = await uploadCarPhoto(file, (form) => api<{ url: string }>("/uploads/image", { form }));
        setPhotos((list) => [...list, { url, label: "Photo", color: "#c4c8cc" }]);
      }
    } catch (err) {
      setError(err instanceof Error && !("status" in err) ? err.message : errorText(err, "Couldn't upload the photo."));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    const parsed = custom ? fromDraft(rates) : null;
    if (typeof parsed === "string") return setError(parsed);
    if (photos.some((p) => !p.label.trim())) return setError("Give every photo a name, e.g. its color.");
    setBusy("save");
    setError(null);
    try {
      onSaved(await saveCatalog(`models/${modelId}`, "PUT", { availability, rates: parsed, photos: photos.map((p) => ({ ...p, label: p.label.trim() })) }));
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  };

  const reset = async () => {
    if (!window.confirm(`Reset ${builtIn.name} to how the website shows it by default? Added photos are removed.`)) return;
    setBusy("reset");
    setError(null);
    try {
      onSaved(await saveCatalog(`models/${modelId}`, "DELETE"));
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  };

  return (
    <>
      <DialogHeader className="pr-8 text-left">
        <DialogTitle className="font-display text-2xl font-extrabold tracking-tight">{builtIn.name}</DialogTitle>
        <DialogDescription>{classOf.name} · as shown on the website</DialogDescription>
      </DialogHeader>

      <section className="grid gap-2">
        <h3 className="text-sm font-bold">On the website</h3>
        <div role="radiogroup" aria-label="Availability" className="grid gap-2 sm:grid-cols-3">
          {AVAILABILITY.map((a) => (
            <button
              key={a.value}
              role="radio"
              aria-checked={availability === a.value}
              onClick={() => setAvailability(a.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                availability === a.value ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/30",
              )}
            >
              <span className="block text-sm font-bold">{a.label}</span>
              <span className={cn("block text-xs", availability === a.value ? "text-white/70" : "text-muted-foreground")}>{a.note}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <h3 className="text-sm font-bold">Self-drive price per day</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="price-mode" checked={!custom} onChange={() => setCustom(false)} className="size-4 accent-ink" />
          {builtIn.rates ? "This car's standard prices" : `Same as other ${classOf.short.toLowerCase()}s`}
          <span className="text-muted-foreground">(from {defaultRates.butuan == null ? "On request" : peso(defaultRates.butuan)})</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="price-mode" checked={custom} onChange={() => setCustom(true)} className="size-4 accent-ink" />
          Custom prices for this car
        </label>
        {custom && <RatesEditor idPrefix={`car-${modelId}`} value={rates} onChange={setRates} />}
        {custom && <p className="text-xs text-muted-foreground">Leave a box empty to show “On request” for that area.</p>}
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold">Photos</h3>
          <Button variant="outline" size="md" disabled={!!busy || photos.length >= 12} onClick={() => fileRef.current?.click()} className="rounded-xl border-line">
            {busy === "upload" ? <Loader2 className="animate-spin" /> : <ImagePlus />} Add photos
          </Button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addPhotos(e.target.files)} />
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {builtIn.variants.map((v, i) => (
            <li key={`b-${i}`} className="overflow-hidden rounded-xl border border-line">
              <CarPhoto image={v.image} alt={v.label} className="aspect-[16/10]" />
              <p className="truncate px-2 py-1.5 text-xs">
                {v.label} <span className="text-muted-foreground">· built in</span>
              </p>
            </li>
          ))}
          {photos.map((p, i) => (
            <li key={`a-${i}-${p.url}`} className="overflow-hidden rounded-xl border border-brand/40">
              <div className="relative">
                <CarPhoto image={p.url} alt={p.label} className="aspect-[16/10]" />
                <button
                  onClick={() => setPhotos((list) => list.filter((_, j) => j !== i))}
                  aria-label={`Remove ${p.label}`}
                  className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-lg bg-white/90 text-red-600 shadow hover:bg-white"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 p-1.5">
                <input
                  type="color"
                  value={p.color}
                  onChange={(e) => setPhotos((list) => list.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))}
                  aria-label="Swatch color"
                  className="size-8 shrink-0 cursor-pointer rounded-md border border-line bg-white p-0.5"
                />
                <Input
                  value={p.label}
                  maxLength={40}
                  onChange={(e) => setPhotos((list) => list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  aria-label="Photo name (e.g. color)"
                  placeholder="e.g. White"
                  className="h-8 rounded-md bg-white px-2 text-sm"
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Added photos show after the built-in ones, as extra color options. They&apos;re resized before upload, so phone photos are fine.
        </p>
      </section>

      <SheetActions>
        {error && (
          <p role="alert" className="w-full text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
        {saved ? (
          <Button variant="outline" size="md" disabled={!!busy} onClick={() => void reset()} className="rounded-xl border-line">
            {busy === "reset" ? <Loader2 className="animate-spin" /> : <RotateCcw />} Reset
          </Button>
        ) : (
          <span />
        )}
        <Button variant="brand-light" size="md" disabled={!!busy} onClick={() => void save()} className="max-sm:flex-1">
          {busy === "save" && <Loader2 className="animate-spin" />} Save
        </Button>
      </SheetActions>
    </>
  );
}
