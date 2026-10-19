// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMeasuredHeight } from "./useMeasuredHeight";

describe("useMeasuredHeight", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is null where it can't be measured", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() => useMeasuredHeight({ current: element }));
    expect(result.current).toBeNull();
  });

  it("follows the element's height as it changes, and stops when unmounted", () => {
    let resized: () => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resized = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const element = document.createElement("div");
    let height = 120;
    Object.defineProperty(element, "scrollHeight", { get: () => height });
    const { result, unmount } = renderHook(() => useMeasuredHeight({ current: element }));

    act(() => resized());
    expect(result.current).toBe(120);
    height = 300;
    act(() => resized());
    expect(result.current).toBe(300);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
