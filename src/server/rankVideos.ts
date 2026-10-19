import "server-only";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { VideoKind } from "@/schemas/videos";
import { anthropic, MODEL } from "./anthropic";
import { UnusableResultError } from "./apiErrors";

/** A video found on YouTube, with what Claude needs to judge it. */
export type VideoCandidate = {
  id: string;
  title: string;
  channel: string;
  description: string;
  seconds: number;
  views: number | null;
};

export type VideoPick = { id: string; reason: string };

const PicksSchema = z.object({
  picks: z.array(
    z.object({
      id: z.string().describe("The id of a candidate video"),
      reason: z.string().describe("What the video is good for, in at most 12 words"),
    }),
  ),
});

const SYSTEM = `You are an experienced CrossFit coach choosing YouTube videos for athletes and coaches preparing for a class. You get a movement (or a named workout) and candidate videos found on YouTube. Pick the most useful ones, best first, at most 3.
- For a movement: prefer clear technique demos and teaching of its points of performance, from credible coaches; the official CrossFit channel is a strong signal. Avoid vlogs, challenges, compilations, competition footage, product reviews, and videos about a different variation (like a dumbbell version when the barbell movement is asked for) unless nothing better exists.
- For a named workout: prefer strategy, pacing, scaling and standards for that workout. Avoid stories, vlogs and "I did it every day" videos.
- When you pick more than one, pick different angles (a demo and a common-faults video), not near-duplicates.
For each pick, give the candidate's id and what it's good for in at most 12 words. Return an empty list if none of the candidates would help.`;

/** Asks Claude to pick the most useful videos from YouTube's results, best first. */
export async function rankVideos(
  name: string,
  kind: VideoKind,
  candidates: VideoCandidate[],
): Promise<VideoPick[]> {
  const response = await anthropic.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(PicksSchema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          [kind]: name,
          candidates: candidates.map(({ description, ...candidate }) => ({
            ...candidate,
            description: description.slice(0, 300),
          })),
        }),
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new UnusableResultError("The model declined to rank these videos.");
  }
  if (!response.parsed_output) {
    throw new UnusableResultError("Couldn't read the model's video picks.");
  }
  return response.parsed_output.picks;
}
