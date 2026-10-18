import type { Wod } from "@/schemas/wod";

/** Sends WOD text to the parse API. Throws an Error with a user-facing message on failure. */
export async function requestParseWod(text: string): Promise<Wod> {
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data.wod;
}
