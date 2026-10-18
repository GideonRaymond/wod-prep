// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WorkoutPartDetails } from "./WorkoutPartDetails";
import { strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const [squats, fran] = toWodState(strengthAndMetcon).parts;

describe("WorkoutPartDetails", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the label, title and format line", () => {
    render(<WorkoutPartDetails part={squats} />);
    expect(screen.getByRole("region", { name: "Heavy Back Squats" })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Strength · 5x5 · 15 min")).toBeInTheDocument();
  });

  it("shows the stimulus read-only with its intensity", () => {
    render(<WorkoutPartDetails part={fran} />);
    expect(screen.getByText(fran.stimulus.description)).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Intensity" })).toHaveAttribute("aria-valuenow", "9");
    expect(screen.queryByRole("button", { name: "Edit stimulus" })).not.toBeInTheDocument();
  });

  it("shows each movement with its points of performance and no way to remove it", () => {
    render(<WorkoutPartDetails part={fran} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Points of performance" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });
});
