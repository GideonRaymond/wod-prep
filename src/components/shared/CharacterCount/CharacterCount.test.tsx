// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CharacterCount } from "./CharacterCount";

describe("CharacterCount", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the count", () => {
    render(<CharacterCount length={12} max={100} />);
    expect(screen.getByText("12 / 100")).toHaveClass("text-zinc-500");
  });

  it("warns at the limit", () => {
    render(<CharacterCount length={100} max={100} />);
    expect(screen.getByText("Maximum length reached (100 characters)")).toHaveClass("text-red-600");
  });
});
