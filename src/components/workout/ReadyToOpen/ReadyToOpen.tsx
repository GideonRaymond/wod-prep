"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";

/** Seconds before the class opens on its own. */
export const OPEN_COUNTDOWN_SECONDS = 3;

export type ReadyToOpenProps = {
  onOpen: () => void;
  /** Someone is reading the links: hold the countdown. */
  paused?: boolean;
  /** Count down and open the class on its own; off, it only opens from the button. */
  autoOpen?: boolean;
};

/**
 * "Your class is ready", with a button to open it and a short countdown that opens it anyway. The
 * countdown waits while `paused` (someone is reading the links), then carries on.
 */
export function ReadyToOpen({ onOpen, paused = false, autoOpen = true }: ReadyToOpenProps) {
  const [left, setLeft] = useState(OPEN_COUNTDOWN_SECONDS);

  useEffect(() => {
    if (paused || !autoOpen) return;
    if (left <= 0) {
      onOpen();
      return;
    }
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, paused, autoOpen, onOpen]);

  return (
    <div className="motion-safe:animate-rise-in mt-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium">Your class is ready</span>
      <Button size="sm" onClick={onOpen}>
        Open your class
      </Button>
      {autoOpen && (
        <span className="text-subtle text-xs tabular-nums">
          {paused ? "Waiting for you" : `Opening in ${Math.max(left, 1)}…`}
        </span>
      )}
    </div>
  );
}
