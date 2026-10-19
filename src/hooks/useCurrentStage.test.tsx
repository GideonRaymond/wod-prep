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
    expect(result.current.current).toBe("pre");
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
    expect(result.current.current).toBe("board");
  });

  it("keeps a picked stage current while the page scrolls there, until the person scrolls", async () => {
    let report: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          report = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    document.body.innerHTML =
      '<section id="stage-pre"></section><section id="stage-board"></section><section id="stage-end"></section>';
    const { result } = renderHook(() => useCurrentStage(["pre", "board", "end"]));
    const scrollPast = (id: string) =>
      act(() =>
        report(
          [{ isIntersecting: true, target: document.getElementById(`stage-${id}`)! }] as never,
          {} as IntersectionObserver,
        ),
      );

    act(() => result.current.pin("end"));
    expect(result.current.current).toBe("end");
    // The jump's own scroll passes other stages on the way.
    scrollPast("board");
    expect(result.current.current).toBe("end");

    await act(() => new Promise((resolve) => setTimeout(resolve)));
    act(() => {
      window.dispatchEvent(new Event("wheel"));
    });
    scrollPast("board");
    expect(result.current.current).toBe("board");
  });
});
