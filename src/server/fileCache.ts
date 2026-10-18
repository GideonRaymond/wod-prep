import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";

/** On by default in development; set WOD_CACHE=on/off to override. */
export function isCacheEnabled() {
  if (process.env.WOD_CACHE === "on") return true;
  if (process.env.WOD_CACHE === "off") return false;
  return process.env.NODE_ENV !== "production";
}

function cacheDir() {
  return process.env.WOD_CACHE_DIR ?? path.join(process.cwd(), ".cache");
}

/**
 * A small JSON-file cache for development, stored in `.cache/<name>.json`. Entries are checked
 * against the schema when read, so stale or corrupt entries count as a miss. Write failures
 * (e.g. a read-only filesystem) are logged and otherwise ignored.
 */
export function createFileCache<T>(name: string, schema: z.ZodType<T>) {
  const file = () => path.join(cacheDir(), `${name}.json`);

  async function read(): Promise<Record<string, unknown>> {
    try {
      return JSON.parse(await readFile(file(), "utf8"));
    } catch {
      return {};
    }
  }

  async function write(key: string, value: T, keepExisting: boolean) {
    if (!isCacheEnabled()) return;
    try {
      const entries = await read();
      if (keepExisting && key in entries) return;
      entries[key] = value;
      await mkdir(path.dirname(file()), { recursive: true });
      await writeFile(file(), JSON.stringify(entries, null, 2));
    } catch (err) {
      console.warn(`Couldn't write the ${name} cache:`, err);
    }
  }

  return {
    async get(key: string): Promise<T | null> {
      if (!isCacheEnabled()) return null;
      const parsed = schema.safeParse((await read())[key]);
      return parsed.success ? parsed.data : null;
    },
    set: (key: string, value: T) => write(key, value, false),
    setIfMissing: (key: string, value: T) => write(key, value, true),
  };
}
