"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { builtInDriverRate, builtInFleet, builtInModels, peso, type CatalogOverrides, type Vehicle } from "@/lib/site";
import { errorText } from "../../_lib/api";
import { fromDraft, RatesEditor, saveCatalog, toDraft } from "./fleet-shared";

export function Prices({ overrides, onSaved }: { overrides: CatalogOverrides; onSaved: (o: CatalogOverrides) => void }) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Self-drive prices per day for each kind of car, by where the customer is going. A car with custom prices (set in
        Website cars) uses its own instead. Leave a box empty for “On request”.
      </p>
      {builtInFleet.map((v) => (
        <ClassPrices key={v.id} vehicle={v} overrides={overrides} onSaved={onSaved} />
      ))}
      <DriverPrice overrides={overrides} onSaved={onSaved} />
    </div>
  );
}

function ClassPrices({ vehicle, overrides, onSaved }: { vehicle: Vehicle; overrides: CatalogOverrides; onSaved: (o: CatalogOverrides) => void }) {
  const saved = overrides.classes[vehicle.id]?.rates;
  const [draft, setDraft] = useState(toDraft(saved ?? vehicle.rates));
  const [busy, setBusy] = useState<"save" | "reset" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const ownPriced = builtInModels.filter((m) => m.category === vehicle.id && (m.rates || overrides.models[m.id]?.rates)).map((m) => m.name);
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(saved ?? vehicle.rates));

  const run = async (kind: "save" | "reset") => {
    const parsed = fromDraft(draft);
    if (kind === "save" && typeof parsed === "string") return setMessage({ ok: false, text: parsed });
    setBusy(kind);
    setMessage(null);
    try {
      const o = kind === "save" ? await saveCatalog(`classes/${vehicle.id}`, "PUT", { rates: parsed }) : await saveCatalog(`classes/${vehicle.id}`, "DELETE");
      onSaved(o);
      if (kind === "reset") setDraft(toDraft(vehicle.rates));
      setMessage({ ok: true, text: kind === "save" ? "Saved. The website is updated." : "Back to the standard prices." });
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-bold">
          {vehicle.name} <span className="text-sm font-normal text-muted-foreground">· {vehicle.seats}</span>
        </h3>
        {saved && <span className="text-xs font-semibold text-brand-700">Custom prices</span>}
      </div>
      <RatesEditor idPrefix={`class-${vehicle.id}`} value={draft} onChange={setDraft} />
      {ownPriced.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Uses its own prices instead: {ownPriced.join(", ")}.</p>}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {message && <p className={message.ok ? "mr-auto text-sm font-semibold text-emerald-700" : "mr-auto text-sm font-semibold text-red-600"}>{message.text}</p>}
        {saved && (
          <Button variant="outline" size="md" disabled={!!busy} onClick={() => void run("reset")} className="rounded-xl border-line">
            {busy === "reset" ? <Loader2 className="animate-spin" /> : <RotateCcw />} Reset
          </Button>
        )}
        <Button variant="brand-light" size="md" disabled={!dirty || !!busy} onClick={() => void run("save")}>
          {busy === "save" && <Loader2 className="animate-spin" />} Save
        </Button>
      </div>
    </section>
  );
}

function DriverPrice({ overrides, onSaved }: { overrides: CatalogOverrides; onSaved: (o: CatalogOverrides) => void }) {
  const current = overrides.driverRate ?? builtInDriverRate;
  const [value, setValue] = useState(String(current));
  const [busy, setBusy] = useState<"save" | "reset" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (kind: "save" | "reset") => {
    if (kind === "save" && !/^\d{1,7}$/.test(value)) return setMessage({ ok: false, text: "Enter a whole peso amount." });
    setBusy(kind);
    setMessage(null);
    try {
      onSaved(await saveCatalog("settings", "PUT", { driverRate: kind === "save" ? Number(value) : null }));
      if (kind === "reset") setValue(String(builtInDriverRate));
      setMessage({ ok: true, text: kind === "save" ? "Saved. The website is updated." : "Back to the standard fee." });
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <h3 className="font-bold">Driver fee</h3>
      <p className="text-xs text-muted-foreground">Added per day to “With driver” bookings, any destination. Standard: {peso(builtInDriverRate)}.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative w-40">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
          <Input
            aria-label="Driver fee per day"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
            className="h-11 rounded-xl bg-white pl-7"
          />
        </div>
        <span className="text-sm text-muted-foreground">per day</span>
        <div className="ml-auto flex gap-2">
          {overrides.driverRate != null && (
            <Button variant="outline" size="md" disabled={!!busy} onClick={() => void run("reset")} className="rounded-xl border-line">
              {busy === "reset" ? <Loader2 className="animate-spin" /> : <RotateCcw />} Reset
            </Button>
          )}
          <Button variant="brand-light" size="md" disabled={value === String(current) || !!busy} onClick={() => void run("save")}>
            {busy === "save" && <Loader2 className="animate-spin" />} Save
          </Button>
        </div>
      </div>
      {message && <p className={message.ok ? "mt-2 text-sm font-semibold text-emerald-700" : "mt-2 text-sm font-semibold text-red-600"}>{message.text}</p>}
    </section>
  );
}
