import { SavedWodSchema } from "@/schemas/wodState";
import type { SavedWod } from "@/types/wod";

/** Bump when SavedWod changes shape, so older saved workouts are ignored. */
export const WOD_STORAGE_KEY = "wod-prep:wod:v2";

export type WodStore = {
  get: () => SavedWod | null;
  set: (saved: SavedWod | null) => void;
  subscribe: (listener: () => void) => () => void;
};

/**
 * Holds the current WOD (and the text it was parsed from) in memory and writes every change through to sessionStorage, so a page
 * refresh restores it (closing the tab clears it). Saving on every change rather than on unmount
 * or `beforeunload` is deliberate: a refresh doesn't unmount React, and `beforeunload` isn't
 * reliable on mobile. If storage is unavailable (e.g. blocked), the WOD still lives in memory.
 *
 * Shaped for `useSyncExternalStore`. Storage is read lazily on the first `get`, which only
 * happens in the browser.
 */
export function createWodStore(initial?: SavedWod | null): WodStore {
  let current = initial;
  const listeners = new Set<() => void>();

  return {
    get() {
      if (current === undefined) current = load();
      return current;
    },
    set(saved) {
      current = saved;
      save(saved);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function load(): SavedWod | null {
  try {
    const raw = sessionStorage.getItem(WOD_STORAGE_KEY);
    if (!raw) return null;
    const result = SavedWodSchema.safeParse(JSON.parse(raw));
    if (result.success) return result.data;
    sessionStorage.removeItem(WOD_STORAGE_KEY);
  } catch {
    // Unreadable or invalid JSON: start without a saved workout.
  }
  return null;
}

function save(saved: SavedWod | null) {
  try {
    if (saved) sessionStorage.setItem(WOD_STORAGE_KEY, JSON.stringify(saved));
    else sessionStorage.removeItem(WOD_STORAGE_KEY);
  } catch {
    // Storage full or blocked: keep the WOD in memory only.
  }
}
