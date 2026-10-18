// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  afterEach(() => {
    cleanup();
  });

  it("is announced to screen readers", () => {
    render(<Alert>Something broke.</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Something broke.");
  });
});
