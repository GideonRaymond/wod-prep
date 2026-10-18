import { MAX_MOVEMENT_NAME_LENGTH } from "@/constants/wod";
import { claudeErrorResponse, missingApiKeyResponse } from "@/server/apiErrors";
import {
  cachePoints,
  findCuratedPoints,
  generatePoints,
  getCachedPoints,
} from "@/server/pointsOfPerformance";

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
  if (curated) return Response.json({ points: curated, source: "curated" });

  const cached = await getCachedPoints(name);
  if (cached) {
    return Response.json({ points: cached, source: "ai" }, { headers: { "X-Cache": "HIT" } });
  }

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKeyResponse();

  try {
    const points = await generatePoints(name);
    await cachePoints(name, points);
    return Response.json({ points, source: "ai" }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return claudeErrorResponse(err, "Something went wrong looking up this movement.");
  }
}
