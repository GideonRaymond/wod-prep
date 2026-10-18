// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a div by default", () => {
    render(<Card data-testid="card">Hello</Card>);
    expect(screen.getByTestId("card").tagName).toBe("DIV");
    expect(screen.getByTestId("card")).toHaveTextContent("Hello");
  });

  it("can render as another element", () => {
    render(
      <ul>
        <Card as="li">Item</Card>
      </ul>,
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("Item");
  });

  it("merges custom classes", () => {
    render(<Card data-testid="card" className="mt-4 p-6" />);
    expect(screen.getByTestId("card")).toHaveClass("mt-4", "p-6", "rounded-lg");
    expect(screen.getByTestId("card")).not.toHaveClass("p-4");
  });
});
