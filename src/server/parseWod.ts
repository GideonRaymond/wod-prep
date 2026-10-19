import "server-only";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import {
  PartDetailsSchema,
  WodOutlineSchema,
  type PartDetails,
  type PartOutline,
  type Wod,
  type WorkoutPart,
} from "@/schemas/wod";
import { anthropic, FAST_MODEL, MODEL } from "./anthropic";
import { UnusableResultError } from "./apiErrors";
import { stageKind } from "@/utils/classPlan";
import { fillMissingLabels } from "@/utils/fillMissingLabels";
import { mergeDuplicateMovements } from "@/utils/mergeDuplicateMovements";

const OUTLINE_SYSTEM = `You read CrossFit workouts (WODs) and find their structure.
A WOD can have several parts, often labelled A, B, C, or with headings like "Strength", "Metcon", "Warm-up" or "Cool-down". Return each part separately, in order, with its label as written (e.g. "A", "B", "Cool-down"). If there's only one workout, return a single part with label null. Copy the lines that belong to each part into its sourceText, exactly as written.
Give every part a title. Use its real name when it has one (a benchmark like "Fran", or a name given in the text) and set named to true. Otherwise make up a short, descriptive 2-4 word title from its type and feel, like "Heavy Back Squats", "Intense Couplet" or "Easy Flush", and set named to false. Never use the label ("Part A") as the title.
Set kind to warmup for a warm-up, cooldown for a cool-down, stretching or mobility part, and part for everything else.
Also write each part up for the whiteboard, as a coach would before class: a heading line with its label and name, then short, clean lines for the format and each movement. Write a named workout like Murph or Cindy out in full, even when the text only gives its name, and drop filler words. Don't change any reps, loads or movements.`;

const DETAILS_SYSTEM = `You parse one part of a CrossFit workout (WOD) into structured data. You get the whole workout for context and the part to describe; describe only that part.
List each distinct movement once, in the order it first appears, using its standard CrossFit name.
If the same movement at the same load appears more than once (e.g. Murph starts and ends with a 1 mile run), combine it into one entry and add up the reps (Murph's run is "2 miles"). Keep the same movement at different loads as separate entries.
Keep loads and reps as written (e.g. "95/65 lb" means male/female). Do not invent movements, loads or reps that aren't in the text.
Always describe the intended stimulus as a coach would brief the class: the energy system, how heavy or light it should feel, the target time or pace, and whether to go unbroken or break early.
Rate the intended intensity from 1 to 10: 1-3 easy (cool-downs, mobility, recovery), 4-6 moderate (skill work, steady aerobic), 7-8 hard (heavy strength, longer metcons), 9-10 all-out (short sprints like Fran).
Estimate how many minutes of class the part takes, including setup and rest between sets: use its time cap or duration when it has one, otherwise a coach's estimate.
List the equipment members need for the part (e.g. "Barbell", "Plates", "Pull-up bar", "Rower", "Box", "Resistance band"), using one name per item. Bodyweight-only parts need none.`;

export class WodParseError extends UnusableResultError {}

export type ParseProgress = {
  /** The structure, as soon as the quick first read finds it. */
  onOutline?: (parts: PartOutline[]) => void;
  /** Each part once its details are read, in whatever order they finish. */
  onPart?: (index: number, part: WorkoutPart) => void;
};

async function ask<T>(model: string, system: string, content: string, schema: z.ZodType<T>) {
  const response = await anthropic.beta.messages.parse({
    model,
    max_tokens: 16000,
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") {
    throw new WodParseError("The model declined to parse this text.");
  }
  if (!response.parsed_output) {
    throw new WodParseError("Couldn't read that as a workout. Try rephrasing it.");
  }
  return response.parsed_output as T;
}

/**
 * The quick first read: each part's label, title, kind and lines. A warm-up or cool-down gets a
 * label that says so (the class page places parts by label), and if some parts are lettered and
 * others aren't, they're lettered A, B, C… in order.
 */
export async function readOutline(text: string): Promise<PartOutline[]> {
  const { parts } = await ask(FAST_MODEL, OUTLINE_SYSTEM, text, WodOutlineSchema);
  return fillMissingLabels(
    parts.map((part) => {
      if (part.kind === "warmup" && stageKind(part) !== "warmup") {
        return { ...part, label: "Warm-up" };
      }
      if (part.kind === "cooldown" && stageKind(part) !== "cooldown") {
        return { ...part, label: "Cool-down" };
      }
      return part;
    }),
  );
}

/** The slower second read of one part: its format, movements, stimulus, length and equipment. */
export async function readPartDetails(text: string, outline: PartOutline): Promise<PartDetails> {
  const content = JSON.stringify({
    workout: text,
    part: { label: outline.label, title: outline.title, lines: outline.sourceText },
  });
  const details = await ask(MODEL, DETAILS_SYSTEM, content, PartDetailsSchema);
  // A safety net in case the model still lists a movement twice.
  return { ...details, movements: mergeDuplicateMovements(details.movements) };
}

/**
 * Parses WOD text in two steps, so the structure is known within seconds: a quick read of the
 * parts, then every part's details at once. `progress` hears about each step as it finishes.
 */
export async function parseWod(text: string, progress: ParseProgress = {}): Promise<Wod> {
  const outline = await readOutline(text);
  progress.onOutline?.(outline);

  const parts = await Promise.all(
    outline.map(async (head, index) => {
      const { label, title, named, sourceText, board } = head;
      const details = await readPartDetails(text, head);
      const part: WorkoutPart = { label, title, named, sourceText, board, ...details };
      progress.onPart?.(index, part);
      return part;
    }),
  );
  return { parts };
}
