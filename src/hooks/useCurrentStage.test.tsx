// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCurrentStage } from "./useCurrentStage";

describe("useCurrentStage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("starts at the first stage", () => {
    const { result } = renderHook(() => useCurrentStage(["pre", "board"]));
    expect(result.current).toBe("pre");
  });

  it("follows the stage that scrolls into the top of the screen", () => {
    let report: IntersectionObserverCallback = () => {};
    const observe = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          report = callback;
        }
        observe = observe;
        disconnect() {}
      },
    );
    document.body.innerHTML =
      '<section id="stage-pre"></section><section id="stage-board"></section>';
    const { result, rerender } = renderHook(() => useCurrentStage(["pre", "board"]));
    expect(observe).toHaveBeenCalledTimes(2);

    act(() =>
      report(
        [{ isIntersecting: true, target: document.getElementById("stage-board")! }] as never,
        {} as IntersectionObserver,
      ),
    );
    rerender();
    expect(result.current).toBe("board");
  });
});
