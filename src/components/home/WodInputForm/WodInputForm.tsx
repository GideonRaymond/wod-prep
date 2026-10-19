"use client";

import { useState, type FormEvent } from "react";
import { BoardFrame } from "@/components/shared/BoardFrame";
import { Button } from "@/components/shared/Button";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { CharacterCount } from "@/components/shared/CharacterCount";
import { TextArea } from "@/components/shared/TextArea";
import { handFont } from "@/components/shared/WodBoard";
import { EXAMPLE_WOD, MAX_WOD_LENGTH } from "@/constants/wod";
import { cn } from "@/utils/cn";

export type WodInputFormProps = {
  loading: boolean;
  /**
   * Text of the current workout. The form starts with it, and submitting it again is disabled
   * until the text changes.
   */
  parsedText?: string | null;
  /** Where to carry on with the current workout, offered while the text is unchanged. */
  continueTo?: string;
  onSubmit: (text: string) => void;
};

/**
 * Where the workout is written: a text box on the whiteboard, in handwriting, with the example
 * workout as its placeholder. Under the board: the length, Break it down and Use example.
 */
export function WodInputForm({ loading, parsedText, continueTo, onSubmit }: WodInputFormProps) {
  const [text, setText] = useState(parsedText ?? "");
  const tooLong = text.trim().length > MAX_WOD_LENGTH;
  const unchanged = parsedText != null && text.trim() === parsedText.trim();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(text);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <BoardFrame className="focus-within:border-purple-300">
        <TextArea
          aria-label="Workout"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE_WOD}
          rows={12}
          maxLength={MAX_WOD_LENGTH}
          aria-describedby="wod-length"
          className={cn(
            handFont.className,
            "rounded-none border-0 bg-transparent p-0 text-[17px] leading-[23px] text-purple-950 placeholder:text-zinc-400 dark:bg-transparent",
          )}
        />
      </BoardFrame>
      <CharacterCount id="wod-length" length={text.length} max={MAX_WOD_LENGTH} className="-mt-1" />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          disabled={loading || !text.trim() || tooLong || unchanged}
          aria-describedby={unchanged && !loading ? "wod-unchanged" : undefined}
        >
          {loading ? "Parsing…" : "Break it down"}
        </Button>
        {!text && (
          <Button variant="secondary" onClick={() => setText(EXAMPLE_WOD)}>
            Use example
          </Button>
        )}
        {unchanged && !loading && continueTo && (
          <ButtonLink href={continueTo} variant="secondary">
            Continue checking
          </ButtonLink>
        )}
        {unchanged && !loading && (
          <p id="wod-unchanged" className="text-subtle text-sm">
            Edit the workout to break it down again.
          </p>
        )}
      </div>
    </form>
  );
}
