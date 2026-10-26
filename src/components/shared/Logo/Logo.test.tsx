// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Logo } from "./Logo";

describe("Logo", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the app and links home, with the mark hidden from screen readers", () => {
    const { container } = render(<Logo />);
    const link = screen.getByRole("link", { name: "Chalkup" });
    expect(link).toHaveAttribute("href", "/");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden");
  });
});
