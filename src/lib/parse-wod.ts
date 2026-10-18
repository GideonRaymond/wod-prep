import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { WodSchema, type Wod } from "./wod";

const client = new Anthropic();

const SYSTEM = `You parse CrossFit workouts (WODs) into structured data.
List each distinct movement once, in the order it appears, using its standard CrossFit name.
Keep loads and reps as written (e.g. "95/65 lb" means male/female). Do not invent movements, loads or reps that aren't in the text.
Always describe the intended stimulus as a coach would brief the class: the energy system, how heavy or light it should feel, the target time or pace, and whether to go unbroken or break early.`;

export class WodParseError extends Error {}

export async function parseWod(text: string): Promise<Wod> {
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
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
  return response.parsed_output;
}
