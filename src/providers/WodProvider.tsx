"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { WodState } from "@/types/wod";

type WodContextValue = {
  /** The parsed (and possibly edited) WOD, shared by the review and workout pages. */
  wod: WodState | null;
  setWod: (wod: WodState | null) => void;
};

const WodContext = createContext<WodContextValue | null>(null);

/**
 * Keeps the current WOD in app-wide state so it survives navigating between pages
 * (e.g. confirming, then going back to edit). It's not saved: a full reload clears it.
 */
export function WodProvider({
  children,
  initialWod = null,
}: {
  children: ReactNode;
  initialWod?: WodState | null;
}) {
  const [wod, setWod] = useState(initialWod);
  return <WodContext.Provider value={{ wod, setWod }}>{children}</WodContext.Provider>;
}

export function useWod() {
  const context = useContext(WodContext);
  if (!context) throw new Error("useWod must be used inside <WodProvider>.");
  return context;
}
