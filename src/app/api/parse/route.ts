import { MAX_WOD_LENGTH } from "@/constants/wod";
import { claudeErrorResponse, missingApiKeyResponse } from "@/server/apiErrors";
import { parseWod } from "@/server/parseWod";
import { cacheWod, getCachedWod } from "@/server/wodCache";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return Response.json({ error: "Paste a workout first." }, { status: 400 });
  }
  if (text.length > MAX_WOD_LENGTH) {
    return Response.json({ error: "That's too long for one workout." }, { status: 400 });
  }

  const cached = await getCachedWod(text);
  if (cached) {
    return Response.json({ wod: cached }, { headers: { "X-Cache": "HIT" } });
  }

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKeyResponse();

  try {
    const wod = await parseWod(text);
    await cacheWod(text, wod);
    return Response.json({ wod }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return claudeErrorResponse(err, "Something went wrong parsing the workout.");
  }
}
