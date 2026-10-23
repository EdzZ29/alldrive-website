"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Car, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, errorText, UNIT_STATUSES, type UnitStatus, type Vehicle } from "../../_lib/api";
import { uploadCarPhoto } from "../../_lib/images";
import { useLive } from "../../_components/live";
import { useRestoredEvents, useUndo } from "../../_components/undo";
import { Field, pageSlice, Pagination, selectClass, SheetActions, sheetClass, StatusBadge } from "../../_components/ui";

const TYPES = ["Sedan", "MPV", "SUV", "Pickup", "Van"];
const TRANSMISSIONS = ["Automatic", "Manual"];
const FUELS = ["Gasoline", "Diesel", "Hybrid", "Electric"];

const STATUS_NOTE: Record<UnitStatus, string> = {
  Available: "Ready to rent and to assign to bookings",
  Booked: "Out on an approved booking",
  Maintenance: "In the shop; can't be assigned",
  Unlisted: "Kept, but not in use",
};

type Draft = {
  brand: string;
  model: string;
  plateNumber: string;
  vehicleType: string;
  year: string;
  color: string;
  transmission: string;
  fuelType: string;
  seats: string;
  dailyRate: string;
  status: UnitStatus;
  image: string | null;
  description: string;
};

const empty: Draft = {
  brand: "",
  model: "",
  plateNumber: "",
  vehicleType: "Sedan",
  year: String(new Date().getFullYear()),
  color: "",
  transmission: "Automatic",
  fuelType: "Gasoline",
  seats: "5",
  dailyRate: "",
  status: "Available",
  image: null,
  description: "",
};
const draftOf = (v: Vehicle): Draft => ({
  brand: v.brand,
  model: v.model,
  plateNumber: v.plateNumber,
  vehicleType: v.vehicleType,
  year: String(v.year),
  color: v.color,
  transmission: v.transmission,
  fuelType: v.fuelType,
  seats: String(v.seats),
  dailyRate: String(Number(v.dailyRate)),
  status: v.status,
  image: v.image,
  description: v.description ?? "",
});

/** A unit's photo, or a car icon when it has none. */
function UnitPhoto({ src, className }: { src: string | null; className?: string }) {
  return (
    <div className={cn("relative grid shrink-0 place-items-center overflow-hidden bg-muted", className)}>
      {src ? <Image src={src} alt="" fill sizes="240px" unoptimized className="object-cover" /> : <Car className="size-6 text-muted-foreground" />}
    </div>
  );
}

/** The physical cars (with plate numbers) that bookings are assigned to. */
export function Units() {
  const { refreshSummary } = useLive();
  const [units, setUnits] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Vehicle | "new" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const offerUndo = useUndo();

  const load = useCallback(
    () =>
      api<Vehicle[]>("/vehicles").then(
        (list) => {
          setUnits(list);
          setError(null);
        },
        (err) => setError(errorText(err, "Couldn't load the units.")),
      ),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const changed = () => {
    void load();
    refreshSummary();
  };
  useRestoredEvents(
    useCallback(() => {
      void load();
      refreshSummary();
    }, [load, refreshSummary]),
  );

  const setStatus = async (v: Vehicle, status: UnitStatus) => {
    setBusyId(v.id);
    try {
      await api(`/vehicles/${v.id}`, { method: "PUT", body: { status } });
      changed();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  };

  const shown = pageSlice(units ?? [], page);
  const counts = Object.fromEntries(UNIT_STATUSES.map((s) => [s, (units ?? []).filter((u) => u.status === s).length])) as Record<UnitStatus, number>;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Your actual cars, by plate number. Assign them to bookings; approving a booking marks its car as Booked until
          it&apos;s returned.
        </p>
        <Button variant="ink" size="md" onClick={() => setEditing("new")}>
          <Plus /> Add car
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {UNIT_STATUSES.map((s) => (
          <div key={s} className="rounded-xl border border-line bg-white px-3 py-2">
            <p className="text-xs text-muted-foreground">{s}</p>
            <p className="font-display text-xl font-extrabold">{units ? counts[s] : "…"}</p>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {!units ? (
        !error && <Loader2 className="mx-auto my-12 size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : units.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-12 text-center text-sm text-muted-foreground">
          No cars yet. Add your first one.
        </p>
      ) : (
        <ul className="grid gap-2">
          {shown.items.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3 sm:flex-nowrap">
              <button onClick={() => setEditing(v)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Edit ${v.plateNumber}`}>
                <UnitPhoto src={v.image} className="h-14 w-20 rounded-xl" />
                <span className="min-w-0">
                  <span className="block truncate font-bold">
                    {v.brand} {v.model} <span className="font-mono text-sm font-semibold text-muted-foreground">{v.plateNumber}</span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {v.vehicleType} · {v.year} · {v.color} · {v.transmission} · {v.seats} seats
                  </span>
                </span>
              </button>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <select
                  aria-label={`Availability of ${v.plateNumber}`}
                  value={v.status}
                  disabled={busyId === v.id}
                  onChange={(e) => void setStatus(v, e.target.value as UnitStatus)}
                  className={cn(selectClass, "h-10 flex-1 sm:w-40")}
                >
                  {UNIT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="md" aria-label={`Edit ${v.plateNumber}`} onClick={() => setEditing(v)} className="h-10 rounded-xl border-line">
                  <Pencil />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {units && <Pagination page={shown.page} limit={shown.limit} total={shown.total} onPage={setPage} />}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className={sheetClass} onOpenAutoFocus={(e) => e.preventDefault()}>
          {editing && (
            <UnitForm
              key={editing === "new" ? "new" : editing.id}
              unit={editing === "new" ? null : editing}
              onDone={(deleted) => {
                setEditing(null);
                changed();
                if (deleted) {
                  offerUndo(`${deleted.brand} ${deleted.model} (${deleted.plateNumber}) deleted`, () => api(`/vehicles/${deleted.id}/restore`, { method: "POST" }));
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function UnitForm({ unit, onDone }: { unit: Vehicle | null; onDone: (deleted?: Vehicle) => void }) {
  const [d, setD] = useState<Draft>(unit ? draftOf(unit) : empty);
  const [busy, setBusy] = useState<"save" | "delete" | "upload" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (key: keyof Draft) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [key]: e.target.value }));

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy("upload");
    setError(null);
    try {
      const url = await uploadCarPhoto(file, (form) => api<{ url: string }>("/uploads/image", { form }));
      setD((x) => ({ ...x, image: url }));
    } catch (err) {
      setError(err instanceof Error && !("status" in err) ? err.message : errorText(err, "Couldn't upload the photo."));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    const year = Number(d.year);
    const seats = Number(d.seats);
    const rate = Number(d.dailyRate);
    if ((["brand", "model", "plateNumber", "color"] as const).some((k) => !d[k].trim())) {
      return setError("Fill in the brand, model, plate number and color.");
    }
    if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1) return setError("Enter a valid year.");
    if (!Number.isInteger(seats) || seats < 1 || seats > 30) return setError("Enter the number of seats.");
    if (d.dailyRate === "" || !(rate >= 0)) return setError("Enter the daily rate (₱).");
    setBusy("save");
    setError(null);
    const body = {
      brand: d.brand.trim(),
      model: d.model.trim(),
      plateNumber: d.plateNumber.trim().toUpperCase(),
      vehicleType: d.vehicleType,
      year,
      color: d.color.trim(),
      transmission: d.transmission,
      fuelType: d.fuelType,
      seats,
      dailyRate: rate,
      status: d.status,
      image: d.image,
      description: d.description.trim(),
    };
    try {
      await api(unit ? `/vehicles/${unit.id}` : "/vehicles/create", { method: unit ? "PUT" : "POST", body });
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!unit || !window.confirm(`Delete ${unit.brand} ${unit.model} (${unit.plateNumber})? You can undo this right after, or restore it later from the Activity log.`)) return;
    setBusy("delete");
    try {
      await api(`/vehicles/${unit.id}`, { method: "DELETE" });
      onDone(unit);
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  };

  const input = "h-11 rounded-xl bg-white";
  return (
    <>
      <DialogHeader className="pr-8 text-left">
        <div className="flex items-center gap-2">
          {unit && <StatusBadge status={unit.status} />}
        </div>
        <DialogTitle className="font-display text-2xl font-extrabold tracking-tight">{unit ? `${unit.brand} ${unit.model}` : "Add a car"}</DialogTitle>
        <DialogDescription>{unit ? unit.plateNumber : "A car you own and can assign to bookings."}</DialogDescription>
      </DialogHeader>

      {/* Photo */}
      <section className="grid gap-3 sm:grid-cols-[14rem_1fr] sm:items-center">
        <UnitPhoto src={d.image} className="aspect-[16/10] w-full rounded-2xl border border-line" />
        <div className="grid gap-2">
          <p className="text-sm font-bold">Photo</p>
          <p className="text-xs text-muted-foreground">A clear photo of this exact car. Phone photos are fine; they&apos;re resized before upload.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" disabled={!!busy} onClick={() => fileRef.current?.click()} className="rounded-xl border-line">
              {busy === "upload" ? <Loader2 className="animate-spin" /> : <ImagePlus />} {d.image ? "Change photo" : "Upload photo"}
            </Button>
            {d.image && (
              <Button variant="outline" size="md" disabled={!!busy} onClick={() => setD((x) => ({ ...x, image: null }))} className="rounded-xl border-line text-red-600">
                <Trash2 /> Remove
              </Button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
        </div>
      </section>

      {/* Details */}
      <section className="grid gap-3">
        <h3 className="text-sm font-bold">Details</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field id="u-brand" label="Brand">
            <Input id="u-brand" value={d.brand} onChange={set("brand")} placeholder="Toyota" className={input} />
          </Field>
          <Field id="u-model" label="Model">
            <Input id="u-model" value={d.model} onChange={set("model")} placeholder="Vios" className={input} />
          </Field>
          <Field id="u-plate" label="Plate number">
            <Input id="u-plate" value={d.plateNumber} onChange={set("plateNumber")} placeholder="ABC 1234" autoCapitalize="characters" className={input} />
          </Field>
          <Field id="u-color" label="Color">
            <Input id="u-color" value={d.color} onChange={set("color")} placeholder="White" className={input} />
          </Field>
          <Field id="u-type" label="Type">
            <select id="u-type" value={d.vehicleType} onChange={set("vehicleType")} className={selectClass}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field id="u-year" label="Year">
            <Input id="u-year" inputMode="numeric" value={d.year} onChange={set("year")} className={input} />
          </Field>
          <Field id="u-trans" label="Transmission">
            <select id="u-trans" value={d.transmission} onChange={set("transmission")} className={selectClass}>
              {TRANSMISSIONS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field id="u-fuel" label="Fuel">
            <select id="u-fuel" value={d.fuelType} onChange={set("fuelType")} className={selectClass}>
              {FUELS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field id="u-seats" label="Seats">
            <Input id="u-seats" inputMode="numeric" value={d.seats} onChange={set("seats")} className={input} />
          </Field>
          <Field id="u-rate" label="Daily rate (₱)">
            <Input id="u-rate" inputMode="decimal" value={d.dailyRate} onChange={set("dailyRate")} placeholder="1300" className={input} />
          </Field>
        </div>
      </section>

      {/* Availability */}
      <section className="grid gap-2">
        <h3 className="text-sm font-bold">Availability</h3>
        <div role="radiogroup" aria-label="Availability" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {UNIT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={d.status === s}
              onClick={() => setD((x) => ({ ...x, status: s }))}
              className={cn("rounded-xl border p-3 text-left transition", d.status === s ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/30")}
            >
              <span className="block text-sm font-bold">{s}</span>
              <span className={cn("block text-xs", d.status === s ? "text-white/70" : "text-muted-foreground")}>{STATUS_NOTE[s]}</span>
            </button>
          ))}
        </div>
      </section>

      <Field id="u-notes" label="Notes (optional)">
        <Textarea
          id="u-notes"
          rows={2}
          value={d.description}
          onChange={set("description")}
          placeholder="e.g. New tires Oct 2026, dashcam installed"
          className="rounded-xl bg-white"
        />
      </Field>

      <SheetActions>
        {error && (
          <p role="alert" className="w-full text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
        {unit ? (
          <Button variant="outline" size="md" disabled={!!busy} onClick={() => void remove()} className="rounded-xl border-line text-red-600">
            {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
          </Button>
        ) : (
          <span />
        )}
        <Button variant="brand-light" size="md" disabled={!!busy} onClick={() => void save()} className="max-sm:flex-1">
          {busy === "save" && <Loader2 className="animate-spin" />} {unit ? "Save" : "Add car"}
        </Button>
      </SheetActions>
    </>
  );
}
