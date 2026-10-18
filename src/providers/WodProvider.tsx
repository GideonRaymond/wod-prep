"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { createWodStore } from "@/stores/wodStore";
import type { WodState } from "@/types/wod";

type WodContextValue = {
  /** The parsed (and possibly edited) WOD, shared by the review and workout pages. */
  wod: WodState | null;
  setWod: (wod: WodState | null) => void;
  /**
   * False while the server render is being hydrated, before the saved WOD has been read.
   * Use it to avoid flashing an empty state on refresh.
   */
  restored: boolean;
};

const WodContext = createContext<WodContextValue | null>(null);

const noSubscribe = () => () => {};
const getServerWod = () => null;

/**
 * Keeps the current WOD in app-wide state so it survives navigating between pages
 * (e.g. confirming, then going back to edit), and in sessionStorage so it survives a refresh.
 */
export function WodProvider({
  children,
  initialWod,
}: {
  children: ReactNode;
  /** Starts with this WOD instead of the saved one (for tests). */
  initialWod?: WodState | null;
}) {
  const [store] = useState(() => createWodStore(initialWod));
  const wod = useSyncExternalStore(store.subscribe, store.get, getServerWod);
  const restored = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  return (
    <WodContext.Provider value={{ wod, setWod: store.set, restored }}>
      {children}
    </WodContext.Provider>
  );
}

export function useWod() {
  const context = useContext(WodContext);
  if (!context) throw new Error("useWod must be used inside <WodProvider>.");
  return context;
}
