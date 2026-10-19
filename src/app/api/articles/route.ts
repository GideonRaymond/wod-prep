import { ArticleRequestSchema } from "@/schemas/articles";
import { claudeErrorResponse, missingApiKeyResponse } from "@/server/apiErrors";
import { cacheArticles, findArticles, getCachedArticles } from "@/server/articles";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ArticleRequestSchema.safeParse(body?.part);
  if (!parsed.success) {
    return Response.json({ error: "That workout part can't be searched." }, { status: 400 });
  }
  const part = parsed.data;

  const cached = await getCachedArticles(part);
  if (cached) return Response.json({ articles: cached }, { headers: { "X-Cache": "HIT" } });

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKeyResponse();

  try {
    const articles = await findArticles(part);
    await cacheArticles(part, articles);
    return Response.json({ articles }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return claudeErrorResponse(err, "Something went wrong finding reading for this workout.");
  }
}
