import "server-only";

/** The value of SITE_PASSWORD that lets everyone break down new workouts on purpose. */
export const OPEN_SITE = "off";

/** The cookie that says this browser gave the password. */
export const LOGIN_COOKIE = "chalkup-login";

/** How long a login lasts. */
export const LOGIN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * How the site is set up: "open" lets everyone call Claude and YouTube; "password" asks for
 * SITE_PASSWORD first; "unconfigured" (production without SITE_PASSWORD) lets nobody, so a
 * forgotten variable can't open it. Development without one is open. Cached results are open to
 * everyone in every case.
 */
export function siteGate(): "open" | "password" | "unconfigured" {
  const password = process.env.SITE_PASSWORD;
  if (password === OPEN_SITE) return "open";
  if (password) return "password";
  return process.env.NODE_ENV === "production" ? "unconfigured" : "open";
}

/**
 * What the login cookie holds: a keyed hash of the password, never the password itself, so it
 * can't be read back from the cookie, and changing the password logs everyone out.
 */
export async function loginToken(password: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("chalkup login"));
  return Buffer.from(signature).toString("base64url");
}

/** Whether this request may reach Claude or YouTube: the site is open, or it carries the login. */
export async function isLoggedIn(request: Request) {
  const gate = siteGate();
  if (gate !== "password") return gate === "open";
  const given = cookieOf(request, LOGIN_COOKIE);
  return given !== null && sameText(given, await loginToken(process.env.SITE_PASSWORD!));
}

/**
 * Answers 401 with `login: true` (the page then asks for the password, or offers the example)
 * unless the request may reach Claude or YouTube; null when it may. Routes call it after a cache
 * miss, before the rate limit, so cached results stay open to everyone.
 */
export async function requireLogin(request: Request, error: string): Promise<Response | null> {
  if (await isLoggedIn(request)) return null;
  return Response.json({ error, login: true }, { status: 401 });
}

/** Whether `given` is the site password, compared in the same time whatever it holds. */
export async function isPassword(given: string) {
  const password = process.env.SITE_PASSWORD;
  if (siteGate() !== "password" || !password) return false;
  return sameText(given, password);
}

/** The Set-Cookie header that logs this browser in. */
export async function loginCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const token = await loginToken(process.env.SITE_PASSWORD!);
  return `${LOGIN_COOKIE}=${token}; Path=/; Max-Age=${LOGIN_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

function cookieOf(request: Request, name: string) {
  for (const part of request.headers.get("cookie")?.split(";") ?? []) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

/** Compares two strings in the same time whatever they hold, so the timing gives nothing away. */
async function sameText(a: string, b: string) {
  const digest = async (text: string) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let difference = 0;
  for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}
