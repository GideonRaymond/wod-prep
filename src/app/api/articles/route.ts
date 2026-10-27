import { ArticleRequestSchema } from "@/schemas/articles";
import { claudeErrorResponse, missingApiKeyResponse } from "@/server/apiErrors";
import { mockLoad } from "@/server/mockLoad";
import { cacheArticles, findArticles, getCachedArticles } from "@/server/articles";
import { rateLimit } from "@/server/rateLimit";

/** Netlify gives a request at most 60 seconds; this asks for 60 wherever it can be set. */
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ArticleRequestSchema.safeParse(body?.part);
  if (!parsed.success) {
    return Response.json({ error: "That workout part can't be searched." }, { status: 400 });
  }
  const part = parsed.data;

  const cached = await getCachedArticles(part);
  if (cached) {
    await mockLoad("articles");
    return Response.json({ articles: cached }, { headers: { "X-Cache": "HIT" } });
  }

  // Past the cache, this reaches Claude: count it against the visitor's hourly limit.
  const limited = await rateLimit(request, "plan");
  if (limited) return limited;

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKeyResponse();

  try {
    const articles = await findArticles(part);
    await cacheArticles(part, articles);
    return Response.json({ articles }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return claudeErrorResponse(err, "Something went wrong finding reading for this workout.");
  }
}
