import { describe, expect, it, vi } from "vitest";
import { createLoginStore } from "./loginStore";

describe("loginStore", () => {
  it("starts closed", () => {
    expect(createLoginStore().get()).toEqual({ open: false, reason: null, exampleWanted: false });
  });

  it("opens with the reason and resolves with how it ended", async () => {
    const store = createLoginStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const outcome = store.request("Log in to break down a new workout.");
    expect(store.get()).toMatchObject({
      open: true,
      reason: "Log in to break down a new workout.",
    });
    expect(listener).toHaveBeenCalled();
    store.finish("in");
    await expect(outcome).resolves.toBe("in");
    expect(store.get().open).toBe(false);
  });

  it("shares one popup between requests made at the same time", async () => {
    const store = createLoginStore();
    const first = store.request("a");
    const second = store.request("b");
    expect(store.get().reason).toBe("a");
    store.finish("cancel");
    await expect(Promise.all([first, second])).resolves.toEqual(["cancel", "cancel"]);
    // A later request opens it again.
    void store.request("c");
    expect(store.get()).toMatchObject({ open: true, reason: "c" });
  });

  it("keeps the example wanted until it's taken, once", async () => {
    const store = createLoginStore();
    const outcome = store.request("a");
    store.finish("example");
    await expect(outcome).resolves.toBe("example");
    expect(store.get().exampleWanted).toBe(true);
    expect(store.takeExample()).toBe(true);
    expect(store.takeExample()).toBe(false);
  });

  it("can want the example without a request open", () => {
    const store = createLoginStore();
    store.finish("example");
    expect(store.takeExample()).toBe(true);
  });
});
