import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "./proxy";

const basic = (credentials: string) =>
  `Basic ${btoa(String.fromCharCode(...new TextEncoder().encode(credentials)))}`;
const request = (path: string, authorization?: string) =>
  new NextRequest(`http://localhost${path}`, {
    headers: authorization ? { authorization } : {},
  });
const passes = (res: Response) => res.headers.get("x-middleware-next") === "1";

describe("proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lets everything through without a SITE_PASSWORD", async () => {
    vi.stubEnv("SITE_PASSWORD", "");
    expect(passes(await proxy(request("/")))).toBe(true);
  });

  it("asks for the password, for pages and the API alike", async () => {
    vi.stubEnv("SITE_PASSWORD", "chalk up");
    for (const path of ["/", "/workout", "/api/parse"]) {
      const res = await proxy(request(path));
      expect(res.status).toBe(401);
      expect(res.headers.get("WWW-Authenticate")).toBe('Basic realm="Chalkup", charset="UTF-8"');
    }
  });

  it("lets in the right password with any username", async () => {
    vi.stubEnv("SITE_PASSWORD", "chalk up");
    expect(passes(await proxy(request("/", basic("coach:chalk up"))))).toBe(true);
    expect(passes(await proxy(request("/", basic(":chalk up"))))).toBe(true);
  });

  it("keeps out a wrong or garbled one", async () => {
    vi.stubEnv("SITE_PASSWORD", "chalk up");
    expect((await proxy(request("/", basic("coach:chalk")))).status).toBe(401);
    expect(await proxy(request("/", "Basic not-base64!!"))).toHaveProperty("status", 401);
    expect(await proxy(request("/", "Bearer chalk up"))).toHaveProperty("status", 401);
  });

  it("takes passwords beyond plain ASCII", async () => {
    vi.stubEnv("SITE_PASSWORD", "krijt öp");
    expect(passes(await proxy(request("/", basic("coach:krijt öp"))))).toBe(true);
  });

  it("leaves out the built assets and icons", () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    for (const path of ["/_next/static/chunk.js", "/_next/image", "/favicon.ico", "/icon.svg"]) {
      expect(pattern.test(path)).toBe(false);
    }
    expect(pattern.test("/workout")).toBe(true);
    expect(pattern.test("/api/parse")).toBe(true);
  });
});
