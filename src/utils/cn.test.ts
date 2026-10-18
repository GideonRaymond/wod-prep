import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins class names and skips falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("lets later Tailwind classes win", () => {
    expect(cn("px-4 py-2", "px-2")).toBe("py-2 px-2");
  });
});
