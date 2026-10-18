import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFileCache, isCacheEnabled } from "./fileCache";

const Schema = z.object({ n: z.number() });

describe("createFileCache", () => {
  let dir: string;
  const cache = createFileCache("things", Schema);

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "file-cache-"));
    vi.stubEnv("WOD_CACHE", "on");
    vi.stubEnv("WOD_CACHE_DIR", path.join(dir, "nested"));
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it("stores and reads entries in <dir>/<name>.json", async () => {
    await expect(cache.get("a")).resolves.toBeNull();
    await cache.set("a", { n: 1 });
    await cache.set("b", { n: 2 });

    await expect(cache.get("a")).resolves.toEqual({ n: 1 });
    const stored = JSON.parse(await readFile(path.join(dir, "nested", "things.json"), "utf8"));
    expect(stored).toEqual({ a: { n: 1 }, b: { n: 2 } });
  });

  it("overwrites with set but not with setIfMissing", async () => {
    await cache.set("a", { n: 1 });
    await cache.setIfMissing("a", { n: 2 });
    await expect(cache.get("a")).resolves.toEqual({ n: 1 });

    await cache.set("a", { n: 3 });
    await expect(cache.get("a")).resolves.toEqual({ n: 3 });

    await cache.setIfMissing("b", { n: 4 });
    await expect(cache.get("b")).resolves.toEqual({ n: 4 });
  });

  it("treats entries that don't match the schema as a miss", async () => {
    await cache.set("a", { n: 1 });
    await writeFile(path.join(dir, "nested", "things.json"), JSON.stringify({ a: { n: "x" } }));
    await expect(cache.get("a")).resolves.toBeNull();
  });

  it("treats a corrupt file as empty", async () => {
    await cache.set("a", { n: 1 });
    await writeFile(path.join(dir, "nested", "things.json"), "{not json");
    await expect(cache.get("a")).resolves.toBeNull();
  });

  it("doesn't throw when the file can't be written", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await writeFile(path.join(dir, "blocker"), "");
    vi.stubEnv("WOD_CACHE_DIR", path.join(dir, "blocker"));

    await expect(cache.set("a", { n: 1 })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it("does nothing when turned off", async () => {
    await cache.set("a", { n: 1 });
    vi.stubEnv("WOD_CACHE", "off");
    await cache.set("b", { n: 2 });
    await expect(cache.get("a")).resolves.toBeNull();

    vi.stubEnv("WOD_CACHE", "on");
    await expect(cache.get("b")).resolves.toBeNull();
  });
});

describe("isCacheEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is on in development and off in production by default", () => {
    vi.stubEnv("WOD_CACHE", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(isCacheEnabled()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(isCacheEnabled()).toBe(false);
  });

  it("can be forced on or off", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WOD_CACHE", "on");
    expect(isCacheEnabled()).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("WOD_CACHE", "off");
    expect(isCacheEnabled()).toBe(false);
  });
});
