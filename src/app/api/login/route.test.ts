import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rateLimit } = vi.hoisted(() => ({ rateLimit: vi.fn(async () => null as Response | null) }));
vi.mock("@/server/rateLimit", () => ({ rateLimit }));

import { POST } from "./route";
import { LOGIN_COOKIE, loginToken } from "@/server/login";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/login", { method: "POST", body: JSON.stringify(body) }),
  );
}

describe("POST /api/login", () => {
  beforeEach(() => {
    vi.stubEnv("SITE_PASSWORD", "chalk");
    rateLimit.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets the login cookie for the right password", async () => {
    const res = await post({ password: "chalk" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Set-Cookie")).toContain(`${LOGIN_COOKIE}=${await loginToken("chalk")}`);
    expect(rateLimit).toHaveBeenCalledWith(expect.any(Request), "login");
  });

  it("turns away the wrong password without a cookie", async () => {
    const res = await post({ password: "board" });
    expect(res.status).toBe(401);
    expect(res.headers.get("Set-Cookie")).toBeNull();
    await expect(res.json()).resolves.toEqual({ error: "That's not the password." });
  });

  it("asks for a password when there's none", async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    expect(rateLimit).not.toHaveBeenCalled();
  });

  it("stops after too many tries, before checking the password", async () => {
    rateLimit.mockResolvedValueOnce(Response.json({ error: "Slow down." }, { status: 429 }));
    const res = await post({ password: "chalk" });
    expect(res.status).toBe(429);
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });

  it("can't log in when production has no password set up", async () => {
    vi.stubEnv("SITE_PASSWORD", "");
    vi.stubEnv("NODE_ENV", "production");
    const res = await post({ password: "anything" });
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining("example") });
  });

  it("needs no login when the site is open", async () => {
    vi.stubEnv("SITE_PASSWORD", "off");
    const res = await post({ password: "anything" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });
});
