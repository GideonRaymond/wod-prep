import type { PartOutline, Wod, WorkoutPart } from "@/schemas/wod";
import type { ParseEvent } from "@/types/parse";

export type ParseHandlers = {
  /** The workout's structure, as soon as it's read. */
  onOutline?: (parts: PartOutline[]) => void;
  /** Each part once it's read, in whatever order they finish. */
  onPart?: (index: number, part: WorkoutPart) => void;
};

/**
 * Sends WOD text to the parse API and follows its streamed progress, calling the handlers as the
 * structure and each part arrive. Resolves with the whole workout; throws an Error with a
 * user-facing message on failure.
 */
export async function requestParseWod(text: string, handlers: ParseHandlers = {}): Promise<Wod> {
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Something went wrong.");
  }

  for await (const event of readEvents(res.body)) {
    if (event.type === "outline") handlers.onOutline?.(event.parts);
    if (event.type === "part") handlers.onPart?.(event.index, event.part);
    if (event.type === "error") throw new Error(event.error);
    if (event.type === "done") return event.wod;
  }
  throw new Error("The connection closed before the workout was read. Try again.");
}

/** Splits a newline-delimited JSON stream into events, however the chunks fall. */
async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<ParseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = done ? "" : lines.pop()!;
    for (const line of lines) if (line.trim()) yield JSON.parse(line) as ParseEvent;
    if (done) return;
  }
}
