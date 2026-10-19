import { MAX_WOD_LENGTH } from "@/constants/wod";
import { claudeErrorResponse, missingApiKeyResponse } from "@/server/apiErrors";
import { parseWod } from "@/server/parseWod";
import { cacheWod, getCachedWod } from "@/server/wodCache";
import type { PartOutline, Wod } from "@/schemas/wod";
import type { ParseEvent } from "@/types/parse";
import { stageKind } from "@/utils/classPlan";

const NDJSON = { "Content-Type": "application/x-ndjson; charset=utf-8" };

/**
 * Parses a workout and streams the progress as newline-delimited JSON (see ParseEvent), so the
 * page can show the structure within seconds and tick off each part as it's read. Bad input and a
 * missing API key are plain JSON errors with a status, before anything is streamed.
 */
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
    return new Response(eventsFor(cached).map(line).join(""), {
      headers: { ...NDJSON, "X-Cache": "HIT" },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKeyResponse();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ParseEvent) => controller.enqueue(encoder.encode(line(event)));
      try {
        const wod = await parseWod(text, {
          onOutline: (parts) => send({ type: "outline", parts }),
          onPart: (index, part) => send({ type: "part", index, part }),
        });
        await cacheWod(text, wod);
        send({ type: "done", wod });
      } catch (err) {
        const res = claudeErrorResponse(err, "Something went wrong parsing the workout.");
        send({ type: "error", error: (await res.json()).error });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { ...NDJSON, "X-Cache": "MISS" } });
}

const line = (event: ParseEvent) => `${JSON.stringify(event)}\n`;

/** The same events a fresh parse sends, all at once, for a cached workout. */
function eventsFor(wod: Wod): ParseEvent[] {
  const outline: PartOutline[] = wod.parts.map(({ label, title, named, sourceText }) => ({
    label,
    title,
    named,
    sourceText,
    kind: stageKind({ label }),
  }));
  return [
    { type: "outline", parts: outline },
    ...wod.parts.map((part, index) => ({ type: "part" as const, index, part })),
    { type: "done", wod },
  ];
}
