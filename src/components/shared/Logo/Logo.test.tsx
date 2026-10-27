// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandTransition, Logo } from "./Logo";

// Shows the view transition's props in the DOM, so the shared-element setup can be checked.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ViewTransition: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
    <div
      data-testid="vt"
      {...Object.fromEntries(Object.entries(props).map(([k, v]) => [`data-${k}`, v]))}
    >
      {children}
    </div>
  ),
}));

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

  it("draws the mark in chalk: four hand-drawn strokes and a slash, roughened by a filter", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg")!;
    const paths = svg.querySelectorAll("path");
    expect(paths).toHaveLength(5);
    paths.forEach((path) => expect(path).toHaveAttribute("stroke-dasharray"));
    const filter = svg.querySelector("filter")!;
    expect(svg.querySelector("g")).toHaveAttribute("filter", `url(#${filter.id})`);
    expect(filter.querySelectorAll("feTurbulence")).toHaveLength(2);
  });

  it("is the shared brand element, so it moves between the home heading and the header", () => {
    render(<Logo />);
    const vt = screen.getByTestId("vt");
    expect(vt).toHaveAttribute("data-name", "brand");
    expect(vt).toHaveAttribute("data-share", "brand-morph");
    expect(vt).toHaveAttribute("data-enter", "brand-in");
    expect(vt).toContainElement(screen.getByRole("link", { name: "Chalkup" }));
  });

  it("wraps whatever else shows the brand in the same transition", () => {
    render(
      <BrandTransition>
        <span>Big brand</span>
      </BrandTransition>,
    );
    expect(screen.getByTestId("vt")).toHaveAttribute("data-name", "brand");
  });
});
