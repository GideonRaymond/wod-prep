import { WodStateSchema } from "@/schemas/wodState";
import type { WodState } from "@/types/wod";

/** Bump when WodState changes shape, so older saved workouts are ignored. */
export const WOD_STORAGE_KEY = "wod-prep:wod:v1";

export type WodStore = {
  get: () => WodState | null;
  set: (wod: WodState | null) => void;
  subscribe: (listener: () => void) => () => void;
};

/**
 * Holds the current WOD in memory and writes every change through to sessionStorage, so a page
 * refresh restores it (closing the tab clears it). Saving on every change rather than on unmount
 * or `beforeunload` is deliberate: a refresh doesn't unmount React, and `beforeunload` isn't
 * reliable on mobile. If storage is unavailable (e.g. blocked), the WOD still lives in memory.
 *
 * Shaped for `useSyncExternalStore`. Storage is read lazily on the first `get`, which only
 * happens in the browser.
 */
export function createWodStore(initial?: WodState | null): WodStore {
  let current = initial;
  const listeners = new Set<() => void>();

  return {
    get() {
      if (current === undefined) current = load();
      return current;
    },
    set(wod) {
      current = wod;
      save(wod);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function load(): WodState | null {
  try {
    const raw = sessionStorage.getItem(WOD_STORAGE_KEY);
    if (!raw) return null;
    const result = WodStateSchema.safeParse(JSON.parse(raw));
    if (result.success) return result.data;
    sessionStorage.removeItem(WOD_STORAGE_KEY);
  } catch {
    // Unreadable or invalid JSON: start without a saved workout.
  }
  return null;
}

function save(wod: WodState | null) {
  try {
    if (wod) sessionStorage.setItem(WOD_STORAGE_KEY, JSON.stringify(wod));
    else sessionStorage.removeItem(WOD_STORAGE_KEY);
  } catch {
    // Storage full or blocked: keep the WOD in memory only.
  }
}
