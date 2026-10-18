// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CategoryBadge } from "./CategoryBadge";

describe("CategoryBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["weightlifting", "bg-purple-800"],
    ["gymnastics", "bg-purple-300"],
    ["monostructural", "bg-purple-100"],
    ["other", "bg-zinc-100"],
  ] as const)("shows %s in its color", (category, color) => {
    render(<CategoryBadge category={category} />);
    expect(screen.getByText(category)).toHaveClass(color);
  });

  it("can show a movement name in its category's shade, naming the category on hover", () => {
    render(<CategoryBadge category="gymnastics" label="Pull-up" />);
    const badge = screen.getByText("Pull-up");
    expect(badge).toHaveClass("bg-purple-300");
    expect(badge).toHaveAttribute("title", "gymnastics");
  });
});
