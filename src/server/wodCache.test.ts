import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_VERSION, cacheWod, getCachedWod, normalizeWodText } from "./wodCache";
import { fran, franPart, strengthAndMetcon } from "@/test/fixtures";

const EXAMPLE = `"Fran"
21-15-9 for time:
Thrusters (95/65 lb)
Pull-ups`;

describe("normalizeWodText", () => {
  it("ignores case, punctuation, quotes and line breaks", () => {
    expect(normalizeWodText(EXAMPLE)).toBe(
      normalizeWodText("fran 21-15-9 for time thrusters 95/65lb pullups"),
    );
  });

  it("treats hyphenated and joined words the same", () => {
    expect(normalizeWodText("Pull-ups")).toBe(normalizeWodText("pullups"));
    expect(normalizeWodText("Toes-to-bar")).toBe(normalizeWodText("toes to bar"));
  });

  it("keeps separate numbers separate", () => {
    expect(normalizeWodText("21-15-9")).not.toBe(normalizeWodText("21159"));
    expect(normalizeWodText("1 5 rounds")).not.toBe(normalizeWodText("15 rounds"));
  });

  it("still tells different workouts apart", () => {
    expect(normalizeWodText("21-15-9 thrusters pull-ups")).not.toBe(
      normalizeWodText("21-15-9 thrusters push-ups"),
    );
  });
});

describe("WOD cache", () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "wod-cache-"));
    file = path.join(dir, "nested", "parsed-wods.json");
    vi.stubEnv("WOD_CACHE", "on");
    vi.stubEnv("WOD_CACHE_DIR", path.join(dir, "nested"));
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it("misses when nothing is cached", async () => {
    await expect(getCachedWod(EXAMPLE)).resolves.toBeNull();
  });

  it("returns a cached WOD for the same text, however it's formatted", async () => {
    await cacheWod(EXAMPLE, fran);
    await expect(getCachedWod(EXAMPLE)).resolves.toEqual(fran);
    await expect(
      getCachedWod("FRAN 21-15-9 for time: thrusters 95/65 lb, pullups"),
    ).resolves.toEqual(fran);
  });

  it("also finds the WOD by its name", async () => {
    await cacheWod(EXAMPLE, fran);
    await expect(getCachedWod("Fran")).resolves.toEqual(fran);
    await expect(getCachedWod('"fran"')).resolves.toEqual(fran);
  });

  it("doesn't store a made-up title as a name", async () => {
    const couplet = { parts: [{ ...franPart, title: "Intense Couplet", named: false }] };
    await cacheWod("21-15-9 thrusters and pull-ups", couplet);
    await expect(getCachedWod("Intense Couplet")).resolves.toBeNull();
  });

  describe("multi-part WODs", () => {
    const DAY =
      "A) Back Squat 5x5 B) 21-15-9 Thrusters (95/65 lb), Pull-ups Cool-down: 5 min easy row";
    const [squats, franB, coolDown] = strengthAndMetcon.parts;

    it("are found again as a whole", async () => {
      await cacheWod(DAY, strengthAndMetcon);
      await expect(getCachedWod(DAY)).resolves.toEqual(strengthAndMetcon);
    });

    it("store each part on its own under that part's text", async () => {
      await cacheWod(DAY, strengthAndMetcon);
      for (const part of [squats, franB, coolDown]) {
        await expect(getCachedWod(part.sourceText)).resolves.toEqual({
          parts: [{ ...part, label: null }],
        });
      }
    });

    it("store a part with a real name under that name, as a single workout", async () => {
      await cacheWod(DAY, strengthAndMetcon);
      await expect(getCachedWod("Fran")).resolves.toEqual({ parts: [{ ...franB, label: null }] });
      await expect(getCachedWod("Heavy Back Squats")).resolves.toBeNull();
      await expect(getCachedWod("Easy Flush")).resolves.toBeNull();
    });

    it("don't replace a name that's already cached", async () => {
      await cacheWod("Fran", fran);
      await cacheWod(DAY, strengthAndMetcon);
      await expect(getCachedWod("Fran")).resolves.toEqual(fran);
    });
  });

  it("keeps the first WOD stored under a name", async () => {
    await cacheWod(EXAMPLE, fran);
    const heavy = {
      parts: [{ ...franPart, movements: [{ ...franPart.movements[0], load: "135/95 lb" }] }],
    };
    await cacheWod('"Fran" heavy: 21-15-9 thrusters 135/95, pull-ups', heavy);

    await expect(getCachedWod("Fran")).resolves.toEqual(fran);
    await expect(getCachedWod('"Fran" heavy: 21-15-9 thrusters 135/95, pull-ups')).resolves.toEqual(
      heavy,
    );
  });

  it("creates the cache file and versions its keys", async () => {
    await cacheWod("Fran", fran);
    const stored = JSON.parse(await readFile(file, "utf8"));
    expect(Object.keys(stored)).toEqual([`v${CACHE_VERSION}:fran`]);
  });

  it("ignores entries from another cache version", async () => {
    await cacheWod("Fran", fran);
    await writeFile(file, JSON.stringify({ [`v${CACHE_VERSION - 1}:fran`]: fran }));
    await expect(getCachedWod("Fran")).resolves.toBeNull();
  });

  it("ignores entries that no longer match the schema", async () => {
    await cacheWod("Fran", fran);
    await writeFile(file, JSON.stringify({ [`v${CACHE_VERSION}:fran`]: { title: "Fran" } }));
    await expect(getCachedWod("Fran")).resolves.toBeNull();
  });

  it("ignores a corrupt cache file", async () => {
    await cacheWod("Fran", fran);
    await writeFile(file, "{not json");
    await expect(getCachedWod("Fran")).resolves.toBeNull();
  });

  it("does nothing when turned off", async () => {
    await cacheWod("Fran", fran);
    vi.stubEnv("WOD_CACHE", "off");
    await cacheWod("Grace", { parts: [{ ...franPart, title: "Grace" }] });

    await expect(getCachedWod("Fran")).resolves.toBeNull();
    vi.stubEnv("WOD_CACHE", "on");
    await expect(getCachedWod("Grace")).resolves.toBeNull();
  });
});
