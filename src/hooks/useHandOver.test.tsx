// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_MS, useHandOver } from "./useHandOver";

const reducedMotion = (matches: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matches && query.includes("reduce"),
  }));

describe("useHandOver", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reducedMotion(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("waits for the workout before deciding", () => {
    const { result } = renderHook(() => useHandOver({ workout: null, building: true }));
    expect(result.current.phase).toBe("deciding");
  });

  it("shows the class straight away when nothing needs building", () => {
    const { result } = renderHook(() => useHandOver({ workout: "fran", building: false }));
    expect(result.current.phase).toBe("class");
  });

  it("shows the loading screen while building, even once it's done, until opened", () => {
    const { result, rerender } = renderHook((props) => useHandOver(props), {
      initialProps: { workout: "fran", building: true },
    });
    expect(result.current.phase).toBe("loading");
    rerender({ workout: "fran", building: false });
    expect(result.current.phase).toBe("loading");
  });

  it("fades the loading screen out, then opens the class", () => {
    const { result } = renderHook(() => useHandOver({ workout: "fran", building: true }));
    act(() => result.current.open());
    expect(result.current.phase).toBe("leaving");
    act(() => vi.advanceTimersByTime(LEAVE_MS));
    expect(result.current.phase).toBe("opened");
  });

  it("opens at once with reduced motion", () => {
    reducedMotion(true);
    const { result } = renderHook(() => useHandOver({ workout: "fran", building: true }));
    act(() => result.current.open());
    expect(result.current.phase).toBe("opened");
  });

  it("decides afresh for a new or edited workout, even after opening the last one", () => {
    reducedMotion(true);
    const { result, rerender } = renderHook((props) => useHandOver(props), {
      initialProps: { workout: "fran", building: true },
    });
    act(() => result.current.open());
    expect(result.current.phase).toBe("opened");

    rerender({ workout: "murph", building: true });
    expect(result.current.phase).toBe("loading");
    rerender({ workout: "murph", building: false });
    expect(result.current.phase).toBe("loading");

    rerender({ workout: "cindy", building: false });
    expect(result.current.phase).toBe("class");
  });

  it("goes back to deciding while there's no workout", () => {
    const { result, rerender } = renderHook((props) => useHandOver(props), {
      initialProps: { workout: "fran" as string | null, building: false },
    });
    rerender({ workout: null, building: false });
    expect(result.current.phase).toBe("deciding");
  });

  it("doesn't go back to the loading screen for the same workout", () => {
    const { result, rerender } = renderHook((props) => useHandOver(props), {
      initialProps: { workout: "fran", building: false },
    });
    rerender({ workout: "fran", building: true });
    act(() => result.current.open());
    expect(result.current.phase).toBe("class");
  });
});
