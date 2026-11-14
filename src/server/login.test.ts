import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LOGIN_COOKIE,
  isLoggedIn,
  isPassword,
  loginCookie,
  loginToken,
  requireLogin,
  siteGate,
} from "./login";

const request = (cookie?: string) =>
  new Request("http://localhost/api/parse", { headers: cookie ? { cookie } : {} });

describe("login", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is open in development without a SITE_PASSWORD, and with SITE_PASSWORD=off anywhere", () => {
    vi.stubEnv("SITE_PASSWORD", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(siteGate()).toBe("open");
    vi.stubEnv("SITE_PASSWORD", "off");
    vi.stubEnv("NODE_ENV", "production");
    expect(siteGate()).toBe("open");
  });

  it("fails closed in production without a SITE_PASSWORD: nobody gets in", async () => {
    vi.stubEnv("SITE_PASSWORD", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(siteGate()).toBe("unconfigured");
    await expect(isLoggedIn(request())).resolves.toBe(false);
    await expect(isPassword("")).resolves.toBe(false);
  });

  it("lets in only requests with the login cookie when there's a password", async () => {
    vi.stubEnv("SITE_PASSWORD", "chalk");
    const token = await loginToken("chalk");
    await expect(isLoggedIn(request())).resolves.toBe(false);
    await expect(isLoggedIn(request(`${LOGIN_COOKIE}=nope`))).resolves.toBe(false);
    await expect(isLoggedIn(request(`a=1; ${LOGIN_COOKIE}=${token}`))).resolves.toBe(true);
    // A new password logs everyone out.
    vi.stubEnv("SITE_PASSWORD", "board");
    await expect(isLoggedIn(request(`${LOGIN_COOKIE}=${token}`))).resolves.toBe(false);
  });

  it("never puts the password itself in the cookie", async () => {
    vi.stubEnv("SITE_PASSWORD", "hunter2");
    vi.stubEnv("NODE_ENV", "production");
    const cookie = await loginCookie();
    expect(cookie).not.toContain("hunter2");
    expect(cookie).toContain(`${LOGIN_COOKIE}=${await loginToken("hunter2")}`);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it("checks the password", async () => {
    vi.stubEnv("SITE_PASSWORD", "chalk");
    await expect(isPassword("chalk")).resolves.toBe(true);
    await expect(isPassword("Chalk")).resolves.toBe(false);
  });

  it("answers 401 asking for a login, or nothing when logged in", async () => {
    vi.stubEnv("SITE_PASSWORD", "chalk");
    const res = await requireLogin(request(), "Log in first.");
    expect(res?.status).toBe(401);
    await expect(res?.json()).resolves.toEqual({ error: "Log in first.", login: true });
    const cookie = `${LOGIN_COOKIE}=${await loginToken("chalk")}`;
    await expect(requireLogin(request(cookie), "Log in first.")).resolves.toBeNull();
  });
});
