// @vitest-environment jsdom
import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TextArea } from "./TextArea";

describe("TextArea", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("can never be resized by the user", () => {
    render(<TextArea aria-label="Notes" />);
    expect(screen.getByLabelText("Notes")).toHaveClass("resize-none");
  });

  it("uses the given rows when not auto-resizing", () => {
    render(<TextArea aria-label="Notes" rows={7} />);
    expect(screen.getByLabelText("Notes")).toHaveAttribute("rows", "7");
  });

  it("fits its content when auto-resizing", () => {
    vi.spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get").mockReturnValue(48);
    render(<TextArea aria-label="Notes" autoResize rows={7} value="a" readOnly />);
    const textarea = screen.getByLabelText("Notes");
    expect(textarea).toHaveAttribute("rows", "1");
    expect(textarea.style.height).toBe("48px");
    expect(textarea).toHaveClass("overflow-hidden");
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<TextArea aria-label="Notes" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText("Notes"));
  });

  it("shows the invalid state", () => {
    render(<TextArea aria-label="Notes" invalid />);
    expect(screen.getByLabelText("Notes")).toHaveAttribute("aria-invalid", "true");
  });
});
