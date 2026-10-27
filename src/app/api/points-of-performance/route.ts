import { MAX_MOVEMENT_NAME_LENGTH } from "@/constants/wod";
import { mockLoad } from "@/server/mockLoad";
import { claudeErrorResponse, missingApiKeyResponse } from "@/server/apiErrors";
import {
  cachePoints,
  findCuratedPoints,
  generatePoints,
  getCachedPoints,
} from "@/server/pointsOfPerformance";
import { rateLimit } from "@/server/rateLimit";

/** Usually a few seconds; this caps it well within any host's limit. */
export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return Response.json({ error: "Which movement?" }, { status: 400 });
  }
  if (name.length > MAX_MOVEMENT_NAME_LENGTH) {
    return Response.json({ error: "That movement name is too long." }, { status: 400 });
  }

  const curated = findCuratedPoints(name);
  if (curated) {
    await mockLoad("points");
    return Response.json({ points: curated, source: "curated" });
  }

  const cached = await getCachedPoints(name);
  if (cached) {
    await mockLoad("points");
    return Response.json({ points: cached, source: "ai" }, { headers: { "X-Cache": "HIT" } });
  }

  // Past the cache, this reaches Claude: count it against the visitor's hourly limit.
  const limited = await rateLimit(request, "lookup");
  if (limited) return limited;

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKeyResponse();

  try {
    const points = await generatePoints(name);
    await cachePoints(name, points);
    return Response.json({ points, source: "ai" }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return claudeErrorResponse(err, "Something went wrong looking up this movement.");
  }
}
