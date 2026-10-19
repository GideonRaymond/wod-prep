import { PrepRequestSchema } from "@/schemas/classPrep";
import { claudeErrorResponse, missingApiKeyResponse } from "@/server/apiErrors";
import { cachePrep, getCachedPrep, planPrep } from "@/server/classPrep";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = PrepRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That workout can't be planned." }, { status: 400 });
  }

  const cached = await getCachedPrep(parsed.data);
  if (cached) return Response.json({ prep: cached }, { headers: { "X-Cache": "HIT" } });

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKeyResponse();

  try {
    const prep = await planPrep(parsed.data);
    await cachePrep(parsed.data, prep);
    return Response.json({ prep }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return claudeErrorResponse(err, "Something went wrong planning the warm-up.");
  }
}
