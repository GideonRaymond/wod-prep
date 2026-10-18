// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoResize } from "./use-auto-resize";

const LINE_HEIGHT = 20;
const BORDER = 2;

function AutoTextarea({ value }: { value: string }) {
  const ref = useAutoResize(value);
  return <textarea ref={ref} value={value} readOnly />;
}

describe("useAutoResize", () => {
  let lines: number;

  beforeEach(() => {
    lines = 1;
    // jsdom has no layout, so fake the sizes a browser would report.
    vi.spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get").mockImplementation(
      () => lines * LINE_HEIGHT,
    );
    vi.spyOn(HTMLTextAreaElement.prototype, "offsetHeight", "get").mockReturnValue(BORDER);
    vi.spyOn(HTMLTextAreaElement.prototype, "clientHeight", "get").mockReturnValue(0);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("sets the height to fit the content, including borders", () => {
    lines = 3;
    render(<AutoTextarea value={"a\nb\nc"} />);
    expect(screen.getByRole("textbox").style.height).toBe(`${3 * LINE_HEIGHT + BORDER}px`);
  });

  it("refits when the value changes", () => {
    const { rerender } = render(<AutoTextarea value="a" />);
    expect(screen.getByRole("textbox").style.height).toBe(`${LINE_HEIGHT + BORDER}px`);

    lines = 5;
    rerender(<AutoTextarea value={"a\nb\nc\nd\ne"} />);
    expect(screen.getByRole("textbox").style.height).toBe(`${5 * LINE_HEIGHT + BORDER}px`);

    lines = 2;
    rerender(<AutoTextarea value={"a\nb"} />);
    expect(screen.getByRole("textbox").style.height).toBe(`${2 * LINE_HEIGHT + BORDER}px`);
  });

  it("refits when the window is resized", () => {
    render(<AutoTextarea value="a long line that wraps on narrow screens" />);
    lines = 4;
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByRole("textbox").style.height).toBe(`${4 * LINE_HEIGHT + BORDER}px`);
  });

  it("stops listening for resizes after unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<AutoTextarea value="a" />);
    unmount();
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});
