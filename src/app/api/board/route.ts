import { BoardRequestSchema } from "@/schemas/board";
import { claudeErrorResponse, missingApiKeyResponse } from "@/server/apiErrors";
import { mockLoad } from "@/server/mockLoad";
import { cacheBoards, getCachedBoards, redrawBoards } from "@/server/redrawBoard";
import { rateLimit } from "@/server/rateLimit";

/** Usually a few seconds; this caps it well within any host's limit. */
export const maxDuration = 30;

/** Redraws the whiteboard of each edited part, so it shows the workout as confirmed. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BoardRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That whiteboard can't be redrawn." }, { status: 400 });
  }

  const cached = await getCachedBoards(parsed.data);
  if (cached) {
    await mockLoad("board");
    return Response.json({ boards: cached }, { headers: { "X-Cache": "HIT" } });
  }

  // Past the cache, this reaches Claude: count it against the visitor's hourly limit.
  const limited = await rateLimit(request, "plan");
  if (limited) return limited;

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKeyResponse();

  try {
    const boards = await redrawBoards(parsed.data);
    await cacheBoards(parsed.data, boards);
    return Response.json({ boards }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return claudeErrorResponse(err, "Something went wrong redrawing the whiteboard.");
  }
}
