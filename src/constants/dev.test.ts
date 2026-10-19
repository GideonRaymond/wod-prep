import { afterEach, describe, expect, it, vi } from "vitest";

describe("MOCK_LOAD", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is on only for MOCK_LOAD=true", async () => {
    vi.stubEnv("MOCK_LOAD", "true");
    expect((await import("./dev")).MOCK_LOAD).toBe(true);

    vi.resetModules();
    vi.stubEnv("MOCK_LOAD", "");
    expect((await import("./dev")).MOCK_LOAD).toBe(false);
  });
});
