"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Pencil, RotateCcw, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { FieldError } from "@/components/shared/FieldError";
import { IntensityGauge } from "@/components/shared/IntensityGauge";
import { TextArea } from "@/components/shared/TextArea";
import { TextInput } from "@/components/shared/TextInput";
import type { useUndoableText } from "@/hooks/useUndoableText";
import { useUndoShortcuts } from "@/hooks/useUndoShortcuts";
import { describeIntensity } from "@/utils/describeIntensity";
import { stimulusMismatch } from "@/utils/stimulusMismatch";

const MIN_INTENSITY = 1;
const MAX_INTENSITY = 10;

/** The intensity typed in, when it's a whole number from 1 to 10. */
function parseIntensity(text: string) {
  const value = Number(text);
  return text.trim() && Number.isInteger(value) && value >= MIN_INTENSITY && value <= MAX_INTENSITY
    ? value
    : null;
}

export type StimulusCardProps = {
  /** The stimulus description as parsed, used by Revert. */
  original: string;
  /** Intended intensity, 1-10. */
  intensity: number;
  /** The intensity as parsed, used by Revert; missing on workouts saved before it was kept. */
  originalIntensity?: number;
  /** A new intensity, a whole number from 1 to 10. */
  onIntensityChange: (intensity: number) => void;
  /** Editable stimulus with undo history, owned by the parent so it can use the current value. */
  stimulus: ReturnType<typeof useUndoableText>;
};

/**
 * The stimulus of a part: its intensity on a gauge and the coach's description of it, both
 * editable (the description in a text box, the intensity in a 1-10 field beside the gauge). What's
 * set here is taken as the truth for planning the class. When the words and the number clearly
 * disagree ("super hard" at 1), a note asks which is right; it never blocks confirming.
 */
export function StimulusCard({
  original,
  intensity,
  originalIntensity = intensity,
  onIntensityChange,
  stimulus,
}: StimulusCardProps) {
  const [editing, setEditing] = useState(false);
  const [before, setBefore] = useState({ value: stimulus.value, intensity });
  // The intensity as typed, which can be briefly empty or out of range while it's changed.
  const [typed, setTyped] = useState(String(intensity));
  const intensityId = useId();
  const missing = !stimulus.value.trim();
  const badIntensity = parseIntensity(typed) === null;
  const edited = stimulus.value !== original || intensity !== originalIntensity;
  const mismatch = stimulusMismatch(stimulus.value, intensity);

  function startEditing() {
    setBefore({ value: stimulus.value, intensity });
    setTyped(String(intensity));
    setEditing(true);
  }

  function setIntensity(value: number) {
    setTyped(String(value));
    onIntensityChange(value);
  }

  function typeIntensity(text: string) {
    setTyped(text);
    const value = parseIntensity(text);
    if (value !== null) onIntensityChange(value);
  }

  function cancel() {
    stimulus.replace(before.value);
    setIntensity(before.intensity);
    setEditing(false);
  }

  function revert() {
    stimulus.replace(original);
    setIntensity(originalIntensity);
  }

  const revertButton = edited && (
    <Button
      variant="secondary"
      size="xs"
      icon={RotateCcw}
      onClick={revert}
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

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <IntensityGauge value={intensity} />
        {editing && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor={intensityId}>Intensity</label>
            <TextInput
              id={intensityId}
              type="number"
              inputMode="numeric"
              min={MIN_INTENSITY}
              max={MAX_INTENSITY}
              step={1}
              value={typed}
              onChange={(e) => typeIntensity(e.target.value)}
              invalid={badIntensity}
              aria-describedby={badIntensity ? `${intensityId}-error` : undefined}
              className="w-16 tabular-nums"
            />
            <span className="text-subtle">/ {MAX_INTENSITY}</span>
          </div>
        )}
      </div>
      {editing && badIntensity && (
        <FieldError id={`${intensityId}-error`}>
          Use a whole number from {MIN_INTENSITY} to {MAX_INTENSITY}.
        </FieldError>
      )}
      {mismatch && (
        <p className="mt-2 flex gap-2 text-sm text-amber-800 dark:text-amber-200">
          <TriangleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            {mismatch === "hard" ? "This stimulus sounds hard" : "This stimulus sounds easy"}, but
            its intensity is {intensity} ({describeIntensity(intensity).toLowerCase()}). Which is
            right? The class is planned with the harder of the two, to be safe.
          </span>
        </p>
      )}

      {editing ? (
        <>
          <StimulusTextArea stimulus={stimulus} missing={missing} />
          {missing && <FieldError id="stimulus-error">Stimulus is required.</FieldError>}
          <div role="group" aria-label="Stimulus actions" className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              icon={Check}
              onClick={() => setEditing(false)}
              disabled={missing || badIntensity}
            >
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
