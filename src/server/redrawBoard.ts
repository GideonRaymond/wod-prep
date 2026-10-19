import "server-only";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { RedrawnBoardsSchema, type BoardRequest } from "@/schemas/board";
import { anthropic, FAST_MODEL } from "./anthropic";
import { UnusableResultError } from "./apiErrors";
import { createFileCache } from "./fileCache";
import { normalizeWodText } from "./wodCache";

/** Bump when the prompt changes, so old boards are redrawn. */
export const BOARD_CACHE_VERSION = 2;

const CacheEntrySchema = z.array(z.array(z.string()));
const cache = createFileCache("boards", CacheEntrySchema);

const SYSTEM = `You keep a CrossFit gym's whiteboard up to date. For each part you get the board as it was written, and the part as the coach has since edited it (its label, title, format, scheme, notes and movements with reps and loads).
Rewrite each board so it matches the edited part: change only the lines that are now wrong, add lines for new movements where they belong and remove lines for movements that are gone. Keep everything else, including the line order, wording and style, exactly as it was. The first line stays the heading. Each movement is listed once with its total for the part: one written on the board more than once is added up (Murph's two "1 mile run" lines are a single run of "2 miles"). So a total that matches the board's lines added up hasn't changed; leave those lines alone.
Return one board per part, in the order given.`;

export function boardCacheKey(request: BoardRequest) {
  return `v${BOARD_CACHE_VERSION}:${normalizeWodText(JSON.stringify(request.parts))}`;
}

/** Redraws the whiteboard of each edited part, keeping as much of the old board as still fits. */
export async function redrawBoards(request: BoardRequest): Promise<string[][]> {
  const response = await anthropic.beta.messages.parse({
    model: FAST_MODEL,
    max_tokens: 8000,
    output_config: { effort: "low", format: betaZodOutputFormat(RedrawnBoardsSchema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(request) }],
  });
  if (response.stop_reason === "refusal") {
    throw new UnusableResultError("The model declined to redraw the whiteboard.");
  }
  const boards = response.parsed_output?.parts.map((part) => part.board);
  if (!boards || boards.length !== request.parts.length || boards.some((b) => b.length === 0)) {
    throw new UnusableResultError("Couldn't read the redrawn whiteboard.");
  }
  return boards;
}

export const getCachedBoards = (request: BoardRequest) => cache.get(boardCacheKey(request));

export const cacheBoards = (request: BoardRequest, boards: string[][]) =>
  cache.set(boardCacheKey(request), boards);
