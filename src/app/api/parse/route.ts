import Anthropic from "@anthropic-ai/sdk";
import { MAX_WOD_LENGTH } from "@/constants/wod";
import { parseWod, WodParseError } from "@/server/parseWod";
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Set ANTHROPIC_API_KEY in .env.local." }, { status: 500 });
  }

  try {
    const wod = await parseWod(text);
    await cacheWod(text, wod);
    return Response.json({ wod }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    if (err instanceof WodParseError) {
      return Response.json({ error: err.message }, { status: 422 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "Missing or invalid ANTHROPIC_API_KEY." }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Rate limited. Try again in a moment." }, { status: 429 });
    }
    console.error(err);
    return Response.json({ error: "Something went wrong parsing the workout." }, { status: 500 });
  }
}
