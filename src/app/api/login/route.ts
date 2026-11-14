import { isPassword, loginCookie, siteGate } from "@/server/login";
import { rateLimit } from "@/server/rateLimit";

/** A quick check; this caps it well within any host's limit. */
export const maxDuration = 10;

/**
 * Logs this browser in with the shared password, so it can break down new workouts (cached ones
 * are open to everyone). Every try counts against the visitor's hourly limit, so the password
 * can't be guessed.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return Response.json({ error: "Enter the password." }, { status: 400 });

  const gate = siteGate();
  if (gate === "open") return Response.json({ ok: true });
  if (gate === "unconfigured") {
    return Response.json(
      { error: "Logging in isn't set up yet. Try the example workout instead." },
      { status: 503 },
    );
  }

  const limited = await rateLimit(request, "login");
  if (limited) return limited;

  if (!(await isPassword(password))) {
    return Response.json({ error: "That's not the password." }, { status: 401 });
  }
  return Response.json({ ok: true }, { headers: { "Set-Cookie": await loginCookie() } });
}
