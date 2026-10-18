"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/shared/Button";
import { CharacterCount } from "@/components/shared/CharacterCount";
import { TextArea } from "@/components/shared/TextArea";
import { EXAMPLE_WOD, MAX_WOD_LENGTH } from "@/constants/wod";

export type WodInputFormProps = {
  loading: boolean;
  onSubmit: (text: string) => void;
};

export function WodInputForm({ loading, onSubmit }: WodInputFormProps) {
  const [text, setText] = useState("");
  const tooLong = text.trim().length > MAX_WOD_LENGTH;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(text);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <TextArea
        aria-label="Workout"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={EXAMPLE_WOD}
        rows={7}
        maxLength={MAX_WOD_LENGTH}
        aria-describedby="wod-length"
        className="font-mono"
      />
      <CharacterCount id="wod-length" length={text.length} max={MAX_WOD_LENGTH} className="-mt-2" />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !text.trim() || tooLong}>
          {loading ? "Parsing…" : "Break it down"}
        </Button>
        {!text && (
          <Button variant="secondary" onClick={() => setText(EXAMPLE_WOD)}>
            Use example
          </Button>
        )}
      </div>
    </form>
  );
}
