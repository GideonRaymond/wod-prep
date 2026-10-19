"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { List } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/utils/cn";

export type JumpStage = { key: string; label: string; marker: ReactNode };

export type JumpToProps = {
  stages: JumpStage[];
  /** The stage on screen now, highlighted in the menu and named on the button. */
  current?: string;
  onJump: (key: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

/**
 * A floating "Jump to" button for phones (hidden from the sm breakpoint, where the rail is
 * enough). It opens a menu of the class stages, plus Expand all / Collapse all.
 */
export function JumpTo({ stages, current, onJump, onExpandAll, onCollapseAll }: JumpToProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const currentLabel = stages.find((s) => s.key === current)?.label;

  useEffect(() => {
    if (!open) return;
    const menu = document.getElementById(menuId);
    (
      menu?.querySelector<HTMLElement>("[aria-current='true']") ?? menu?.querySelector("button")
    )?.focus();
    function onPointerDown(e: PointerEvent) {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, menuId]);

  function close() {
    setOpen(false);
    toggle.current?.focus();
  }

  return (
    <div
      ref={wrapper}
      className="fixed right-4 bottom-4 z-40 sm:hidden"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          close();
        }
      }}
    >
      {open && (
        <div
          id={menuId}
          role="dialog"
          aria-label="Jump to"
          className="absolute right-0 bottom-full mb-2 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          <ul>
            {stages.map((stage) => (
              <li key={stage.key}>
                <button
                  type="button"
                  aria-current={stage.key === current}
                  onClick={() => {
                    setOpen(false);
                    onJump(stage.key);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-purple-600 dark:hover:bg-zinc-800 dark:focus-visible:outline-purple-400",
                    stage.key === current &&
                      "bg-accent-faint font-medium text-purple-800 dark:text-purple-200",
                  )}
                >
                  {stage.marker}
                  {stage.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex justify-between border-t border-zinc-100 pt-1 dark:border-zinc-800">
            <Button variant="secondary" size="xs" onClick={onExpandAll}>
              Expand all
            </Button>
            <Button variant="secondary" size="xs" onClick={onCollapseAll}>
              Collapse all
            </Button>
          </div>
        </div>
      )}

      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 dark:bg-zinc-100 dark:text-zinc-900 dark:focus-visible:outline-purple-400"
      >
        <List size={16} aria-hidden />
        Jump to
        {currentLabel && <span className="font-normal opacity-70">· {currentLabel}</span>}
      </button>
    </div>
  );
}
