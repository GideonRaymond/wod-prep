// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Welcome } from "./Welcome";
import { WOD_STEPS } from "@/constants/flow";

describe("Welcome", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the app and walks through the three steps", () => {
    render(<Welcome />);
    expect(screen.getByRole("heading", { level: 1, name: "Chalkup" })).toBeInTheDocument();
    const steps = within(screen.getByRole("list", { name: "How it works" })).getAllByRole(
      "listitem",
    );
    expect(steps).toHaveLength(3);
    WOD_STEPS.forEach((step, i) => {
      expect(steps[i]).toHaveTextContent(step.label);
      expect(steps[i]).toHaveTextContent(step.summary);
    });
  });
});
