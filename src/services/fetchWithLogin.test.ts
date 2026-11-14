import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLoginStore } from "@/stores/loginStore";
import { LoginNeededError, fetchWithLogin, logIn } from "./fetchWithLogin";

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) => Response.json(body, { status });
const needsLogin = () => json({ error: "Log in to break down a new workout.", login: true }, 401);

describe("fetchWithLogin", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes other answers straight through, without the popup", async () => {
    const store = createLoginStore();
    fetchMock.mockResolvedValueOnce(json({ ok: true })).mockResolvedValueOnce(json({}, 401));
    expect((await fetchWithLogin("/api/x", {}, store)).status).toBe(200);
    expect((await fetchWithLogin("/api/x", {}, store)).status).toBe(401);
    expect(store.get().open).toBe(false);
  });

  it("asks for a login, then asks the API again once logged in", async () => {
    const store = createLoginStore();
    fetchMock.mockResolvedValueOnce(needsLogin()).mockResolvedValueOnce(json({ ok: true }));
    const res = fetchWithLogin("/api/parse", { method: "POST" }, store);
    await vi.waitFor(() => expect(store.get().open).toBe(true));
    expect(store.get().reason).toBe("Log in to break down a new workout.");
    store.finish("in");
    expect((await res).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/parse", { method: "POST" });
  });

  it("throws with the API's message when the popup is closed or the example chosen", async () => {
    for (const outcome of ["cancel", "example"] as const) {
      const store = createLoginStore();
      fetchMock.mockResolvedValueOnce(needsLogin());
      const res = fetchWithLogin("/api/parse", {}, store);
      await vi.waitFor(() => expect(store.get().open).toBe(true));
      store.finish(outcome);
      const err = await res.catch((e: unknown) => e);
      expect(err).toBeInstanceOf(LoginNeededError);
      expect(err).toMatchObject({ message: "Log in to break down a new workout.", outcome });
    }
  });
});

describe("logIn", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the password and resolves to null once logged in", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));
    await expect(logIn("chalk")).resolves.toBeNull();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ password: "chalk" });
  });

  it("resolves to the API's error otherwise", async () => {
    fetchMock.mockResolvedValue(json({ error: "That's not the password." }, 401));
    await expect(logIn("nope")).resolves.toBe("That's not the password.");
  });
});
