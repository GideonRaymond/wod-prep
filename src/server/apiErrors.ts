import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** Thrown when Claude answers but the result can't be used; the message is shown to the user. */
export class UnusableResultError extends Error {}

export function missingApiKeyResponse() {
  return Response.json({ error: "Set ANTHROPIC_API_KEY in .env.local." }, { status: 500 });
}

/** Turns an error from a Claude-backed route into a JSON error response with a clear message. */
export function claudeErrorResponse(err: unknown, fallbackMessage: string) {
  if (err instanceof UnusableResultError) {
    return Response.json({ error: err.message }, { status: 422 });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return Response.json({ error: "Missing or invalid ANTHROPIC_API_KEY." }, { status: 500 });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return Response.json({ error: "Rate limited. Try again in a moment." }, { status: 429 });
  }
  console.error(err);
  return Response.json({ error: fallbackMessage }, { status: 500 });
}
