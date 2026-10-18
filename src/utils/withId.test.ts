import { describe, expect, it } from "vitest";
import { withId } from "./withId";

describe("withId", () => {
  it("adds a unique id without changing the original", () => {
    const item = { name: "Thruster" };
    const a = withId(item);
    const b = withId(item);

    expect(a).toEqual({ name: "Thruster", id: expect.any(String) });
    expect(a.id).not.toBe(b.id);
    expect(item).toEqual({ name: "Thruster" });
  });
});
