import "server-only";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { WodSchema, type Wod } from "@/schemas/wod";
import { anthropic, MODEL } from "./anthropic";
import { UnusableResultError } from "./apiErrors";
import { mergeDuplicateMovements } from "@/utils/mergeDuplicateMovements";

const SYSTEM = `You parse CrossFit workouts (WODs) into structured data.
A WOD can have several parts, often labelled A, B, C, or with headings like "Strength", "Metcon" or "Cool-down". Return each part separately, in order, with its label as written (e.g. "A", "B", "Cool-down"). If there's only one workout, return a single part with label null. Everything below applies to each part.
List each distinct movement once, in the order it first appears, using its standard CrossFit name.
If the same movement at the same load appears more than once (e.g. Murph starts and ends with a 1 mile run), combine it into one entry and add up the reps (Murph's run is "2 miles"). Keep the same movement at different loads as separate entries.
Keep loads and reps as written (e.g. "95/65 lb" means male/female). Do not invent movements, loads or reps that aren't in the text.
Always describe the intended stimulus as a coach would brief the class: the energy system, how heavy or light it should feel, the target time or pace, and whether to go unbroken or break early.
Rate the intended intensity from 1 to 10: 1-3 easy (cool-downs, mobility, recovery), 4-6 moderate (skill work, steady aerobic), 7-8 hard (heavy strength, longer metcons), 9-10 all-out (short sprints like Fran).`;

export class WodParseError extends UnusableResultError {}

export async function parseWod(text: string): Promise<Wod> {
  const response = await anthropic.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: betaZodOutputFormat(WodSchema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: text }],
  });

  if (response.stop_reason === "refusal") {
    throw new WodParseError("The model declined to parse this text.");
  }
  if (!response.parsed_output) {
    throw new WodParseError("Couldn't read that as a workout. Try rephrasing it.");
  }
  // Safety net in case the model still lists a movement twice within a part.
  const { parts } = response.parsed_output;
  return {
    parts: parts.map((part) => ({ ...part, movements: mergeDuplicateMovements(part.movements) })),
  };
}
