import { useCallback, type KeyboardEvent } from "react";

/**
 * Returns an onKeyDown handler for Ctrl/Cmd+Z (undo) and Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y (redo).
 */
export function useUndoShortcuts({ undo, redo }: { undo: () => void; redo: () => void }) {
  return useCallback(
    (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    },
    [undo, redo],
  );
}
