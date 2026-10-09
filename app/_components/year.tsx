"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Current year, read on the client so the prerendered shell never goes stale. */
export function Year() {
  const year = useSyncExternalStore(subscribe, () => new Date().getFullYear(), () => null);
  return <>{year}</>;
}
