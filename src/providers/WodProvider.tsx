"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createWodStore } from "@/stores/wodStore";
import type { WodState } from "@/types/wod";

type WodContextValue = {
  /** The parsed (and possibly edited) WOD, shared by the review and workout pages. */
  wod: WodState | null;
  /** The text the WOD was parsed from. */
  sourceText: string | null;
  /** Replaces the WOD with an edited version, keeping its source text; `null` clears both. */
  setWod: (wod: WodState | null) => void;
  /** Stores a freshly parsed WOD with the text it came from. */
  loadWod: (text: string, wod: WodState) => void;
  /**
   * False while the server render is being hydrated, before the saved WOD has been read.
   * Use it to avoid flashing an empty state on refresh.
   */
  restored: boolean;
};

const WodContext = createContext<WodContextValue | null>(null);

const noSubscribe = () => () => {};
const getServerSaved = () => null;

/**
 * Keeps the current WOD in app-wide state so it survives navigating between pages
 * (e.g. confirming, then going back to edit), and in sessionStorage so it survives a refresh.
 */
export function WodProvider({
  children,
  initialWod,
  initialText = "",
}: {
  children: ReactNode;
  /** Starts with this WOD instead of the saved one (for tests). */
  initialWod?: WodState | null;
  initialText?: string;
}) {
  const [store] = useState(() =>
    createWodStore(
      initialWod === undefined ? undefined : initialWod && { text: initialText, wod: initialWod },
    ),
  );
  const saved = useSyncExternalStore(store.subscribe, store.get, getServerSaved);
  const restored = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  const setWod = useCallback(
    (wod: WodState | null) => store.set(wod && { text: store.get()?.text ?? "", wod }),
    [store],
  );
  const loadWod = useCallback((text: string, wod: WodState) => store.set({ text, wod }), [store]);

  return (
    <WodContext.Provider
      value={{
        wod: saved?.wod ?? null,
        sourceText: saved?.text ?? null,
        setWod,
        loadWod,
        restored,
      }}
    >
      {children}
    </WodContext.Provider>
  );
}

export function useWod() {
  const context = useContext(WodContext);
  if (!context) throw new Error("useWod must be used inside <WodProvider>.");
  return context;
}
