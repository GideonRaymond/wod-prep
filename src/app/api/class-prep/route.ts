import { PrepRequestSchema } from "@/schemas/classPrep";
import { claudeErrorResponse, missingApiKeyResponse } from "@/server/apiErrors";
import { mockLoad } from "@/server/mockLoad";
import { cachePrep, getCachedPrep, planPrep } from "@/server/classPrep";
import { rateLimit } from "@/server/rateLimit";

/** Netlify gives a request at most 60 seconds; this asks for 60 wherever it can be set. */
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = PrepRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That workout can't be planned." }, { status: 400 });
  }

  const cached = await getCachedPrep(parsed.data);
  if (cached) {
    await mockLoad("prep");
    return Response.json({ prep: cached }, { headers: { "X-Cache": "HIT" } });
  }

  // Past the cache, this reaches Claude: count it against the visitor's hourly limit.
  const limited = await rateLimit(request, "plan");
  if (limited) return limited;

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKeyResponse();

  try {
    const prep = await planPrep(parsed.data);
    await cachePrep(parsed.data, prep);
    return Response.json({ prep }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return claudeErrorResponse(err, "Something went wrong planning the warm-up.");
  }
}
