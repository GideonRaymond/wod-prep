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

  it.each([
    ["deep", "bg-purple-800"],
    ["mid", "bg-purple-300"],
    ["pale", "bg-purple-100"],
  ] as const)("supports the %s tone", (tone, color) => {
    render(<Badge tone={tone}>weightlifting</Badge>);
    expect(screen.getByText("weightlifting")).toHaveClass(color);
  });
});
