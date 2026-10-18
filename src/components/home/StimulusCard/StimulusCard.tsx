"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, RotateCcw } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { FieldError } from "@/components/shared/FieldError";
import { TextArea } from "@/components/shared/TextArea";
import type { useUndoableText } from "@/hooks/useUndoableText";
import { useUndoShortcuts } from "@/hooks/useUndoShortcuts";

export type StimulusCardProps = {
  /** The stimulus as parsed, used by Revert. */
  original: string;
  /** Editable stimulus with undo history, owned by the parent so it can use the current value. */
  stimulus: ReturnType<typeof useUndoableText>;
};

export function StimulusCard({ original, stimulus }: StimulusCardProps) {
  const [editing, setEditing] = useState(false);
  const [valueBeforeEdit, setValueBeforeEdit] = useState(stimulus.value);
  const missing = !stimulus.value.trim();
  const edited = stimulus.value !== original;

  function startEditing() {
    setValueBeforeEdit(stimulus.value);
    setEditing(true);
  }

  function cancel() {
    stimulus.replace(valueBeforeEdit);
    setEditing(false);
  }

  const revertButton = edited && (
    <Button
      variant="secondary"
      size="xs"
      icon={RotateCcw}
      onClick={() => stimulus.replace(original)}
      aria-label="Revert stimulus to original"
    >
      Revert
    </Button>
  );

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">
            {editing ? <label htmlFor="stimulus">Stimulus</label> : "Stimulus"}
          </h3>
          {edited && !editing && <Badge>edited</Badge>}
        </div>
        {!editing && (
          <div role="group" aria-label="Stimulus actions" className="flex items-center gap-1">
            {revertButton}
            <Button
              variant="secondary"
              size="xs"
              icon={Pencil}
              onClick={startEditing}
              aria-label="Edit stimulus"
            >
              Edit
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <>
          <StimulusTextArea stimulus={stimulus} missing={missing} />
          {missing && <FieldError id="stimulus-error">Stimulus is required.</FieldError>}
          <div role="group" aria-label="Stimulus actions" className="mt-2 flex items-center gap-2">
            <Button size="sm" icon={Check} onClick={() => setEditing(false)} disabled={missing}>
              Done
            </Button>
            <Button variant="secondary" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <div className="ml-auto">{revertButton}</div>
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
          {stimulus.value}
        </p>
      )}
    </Card>
  );
}

function StimulusTextArea({
  stimulus,
  missing,
}: {
  stimulus: StimulusCardProps["stimulus"];
  missing: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const onKeyDown = useUndoShortcuts(stimulus);

  // Focus with the cursor at the end when editing starts.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  return (
    <TextArea
      id="stimulus"
      ref={ref}
      autoResize
      value={stimulus.value}
      onChange={(e) => stimulus.edit(e.target.value)}
      onKeyDown={onKeyDown}
      required
      invalid={missing}
      aria-describedby={missing ? "stimulus-error" : undefined}
      className="mt-2"
    />
  );
}
