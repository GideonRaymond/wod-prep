import type { PartOutline, Wod } from "@/schemas/wod";
import type { ParseEvent } from "@/types/parse";
import { stageKind } from "@/utils/classPlan";

/** The events the parse route streams for a workout: its outline, each part, then done. */
export function parseEvents(wod: Wod): ParseEvent[] {
  return [
    {
      type: "outline",
      parts: wod.parts.map(({ label, title, named, sourceText, board }) => ({
        label,
        title,
        named,
        sourceText,
        board,
        kind: stageKind({ label }),
      })),
    },
    ...wod.parts.map((part, index) => ({ type: "part" as const, index, part })),
    { type: "done", wod },
  ];
}

/** A streamed parse response, as newline-delimited JSON split into the given chunks. */
export function streamResponse(events: ParseEvent[], chunkSize = Infinity): Response {
  const text = events.map((event) => `${JSON.stringify(event)}\n`).join("");
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < text.length; i += Math.min(chunkSize, text.length)) {
        controller.enqueue(encoder.encode(text.slice(i, i + chunkSize)));
      }
      controller.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "application/x-ndjson" } });
}

/** The outline the parse route streams first for a workout. */
export function outlineOf(wod: Wod): PartOutline[] {
  const [first] = parseEvents(wod);
  return first.type === "outline" ? first.parts : [];
}
