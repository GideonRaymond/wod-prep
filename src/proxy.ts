import { NextResponse, type NextRequest } from "next/server";
import { APP_NAME } from "@/constants/brand";

/**
 * Keeps the whole site behind one shared password while it's a preview: set SITE_PASSWORD and the
 * browser asks for it (any username), then sends it with every request, the API included, so
 * nobody else can spend the API keys. Without SITE_PASSWORD (like in development) it's open.
 * Uses only Web Crypto, so it runs wherever the host puts the proxy.
 */
export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password || (await givesPassword(request.headers.get("authorization"), password))) {
    return NextResponse.next();
  }
  return new NextResponse(`${APP_NAME} is a preview for now. Ask for the password.`, {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${APP_NAME}", charset="UTF-8"` },
  });
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
