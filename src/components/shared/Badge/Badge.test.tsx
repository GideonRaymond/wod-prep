// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a neutral badge by default", () => {
    render(<Badge>edited</Badge>);
    expect(screen.getByText("edited")).toHaveClass("bg-zinc-100");
  });

  it("supports tones", () => {
    render(<Badge tone="amber">weightlifting</Badge>);
    expect(screen.getByText("weightlifting")).toHaveClass("bg-amber-100");
  });
});
