// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CategoryBadge } from "./CategoryBadge";

describe("CategoryBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["weightlifting", "bg-amber-100"],
    ["gymnastics", "bg-sky-100"],
    ["monostructural", "bg-emerald-100"],
    ["other", "bg-zinc-100"],
  ] as const)("shows %s in its color", (category, color) => {
    render(<CategoryBadge category={category} />);
    expect(screen.getByText(category)).toHaveClass(color);
  });
});
