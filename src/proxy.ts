import { NextResponse, type NextRequest } from "next/server";
import { APP_NAME } from "@/constants/brand";

/** The value of SITE_PASSWORD that opens the site to everyone on purpose. */
export const OPEN_SITE = "off";

/**
 * Keeps the whole site behind one shared password while it's a preview: set SITE_PASSWORD and the
 * browser asks for it once a session (any username), then sends it with every request, the API
 * included, so nobody else can spend the API keys.
 *
 * It fails closed: in production without SITE_PASSWORD, the site says it isn't set up rather than
 * opening, so a forgotten variable can't leave it open. SITE_PASSWORD=off opens it on purpose.
 * Development and tests stay open without one. Every response says which it was in X-Site-Gate
 * (on, off or unconfigured), to check from outside that the gate runs on the host.
 * Uses only Web Crypto, so it runs wherever the host puts the proxy.
 */
export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;

  if (password === OPEN_SITE) return pass("off");
  if (!password) {
    if (process.env.NODE_ENV !== "production") return pass("off");
    return new NextResponse(
      `${APP_NAME} isn't set up yet: set SITE_PASSWORD, or SITE_PASSWORD=${OPEN_SITE} to open it to everyone.`,
      { status: 503, headers: { "X-Site-Gate": "unconfigured" } },
    );
  }

  if (await givesPassword(request.headers.get("authorization"), password)) return pass("on");
  return new NextResponse(`${APP_NAME} is a preview for now. Ask for the password.`, {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${APP_NAME}", charset="UTF-8"`,
      "X-Site-Gate": "on",
    },
  });
}

/** Lets the request through, saying how the gate is set. */
function pass(gate: "on" | "off") {
  const response = NextResponse.next();
  response.headers.set("X-Site-Gate", gate);
  return response;
}

/** Whether a Basic Authorization header carries the password (whatever the username). */
async function givesPassword(header: string | null, password: string) {
  if (!header?.startsWith("Basic ")) return false;
  let credentials: string;
  try {
    const bytes = Uint8Array.from(atob(header.slice("Basic ".length)), (c) => c.charCodeAt(0));
    credentials = new TextDecoder().decode(bytes);
  } catch {
    return false;
  }
  const given = credentials.slice(credentials.indexOf(":") + 1);
  return sameText(given, password);
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

export const config = {
  // Everything but the built assets and icons, which the password prompt itself may need.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"],
};
