// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWodStore, WOD_STORAGE_KEY } from "./wodStore";
import { fran, strengthAndMetcon } from "@/test/fixtures";
import type { SavedWod, WodState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

const saved = () => JSON.parse(sessionStorage.getItem(WOD_STORAGE_KEY) ?? "null");
const withText = (wod: WodState, text = "Fran"): SavedWod => ({ text, wod });

describe("createWodStore", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts empty when nothing is saved", () => {
    expect(createWodStore().get()).toBeNull();
  });

  it("restores a saved WOD with its text", () => {
    const value = withText(toWodState(strengthAndMetcon), "A) squats B) Fran");
    sessionStorage.setItem(WOD_STORAGE_KEY, JSON.stringify(value));
    expect(createWodStore().get()).toEqual(value);
  });

  it("returns the same object on every read, as useSyncExternalStore needs", () => {
    sessionStorage.setItem(WOD_STORAGE_KEY, JSON.stringify(withText(toWodState(fran))));
    const store = createWodStore();
    expect(store.get()).toBe(store.get());
  });

  it("drops a saved WOD that doesn't match the schema", () => {
    sessionStorage.setItem(
      WOD_STORAGE_KEY,
      JSON.stringify({ text: "Fran", wod: { parts: [{ title: "Fran" }] } }),
    );
    expect(createWodStore().get()).toBeNull();
    expect(sessionStorage.getItem(WOD_STORAGE_KEY)).toBeNull();
  });

  it("drops a WOD saved in the old shape, without its text", () => {
    sessionStorage.setItem(WOD_STORAGE_KEY, JSON.stringify(toWodState(fran)));
    expect(createWodStore().get()).toBeNull();
  });

  it("ignores saved text that isn't JSON", () => {
    sessionStorage.setItem(WOD_STORAGE_KEY, "{not json");
    expect(createWodStore().get()).toBeNull();
  });

  it("saves every change and clears storage when the WOD is cleared", () => {
    const store = createWodStore();
    const wod = toWodState(fran);
    store.set(withText(wod));
    expect(saved()).toEqual(withText(wod));

    const edited = withText({
      parts: [{ ...wod.parts[0], movements: wod.parts[0].movements.slice(1) }],
    });
    store.set(edited);
    expect(saved()).toEqual(edited);

    store.set(null);
    expect(sessionStorage.getItem(WOD_STORAGE_KEY)).toBeNull();
  });

  it("notifies subscribers until they unsubscribe", () => {
    const store = createWodStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set(withText(toWodState(fran)));
    unsubscribe();
    store.set(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("uses the initial WOD instead of the saved one", () => {
    sessionStorage.setItem(WOD_STORAGE_KEY, JSON.stringify(withText(toWodState(fran))));
    expect(createWodStore(null).get()).toBeNull();
  });

  it("keeps working in memory when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const store = createWodStore();
    expect(store.get()).toBeNull();

    const value = withText(toWodState(fran));
    store.set(value);
    expect(store.get()).toBe(value);
  });
});
