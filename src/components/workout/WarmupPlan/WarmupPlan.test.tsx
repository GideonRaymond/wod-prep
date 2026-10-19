// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WarmupPlan } from "./WarmupPlan";
import { classPrep } from "@/test/fixtures";

const warmup = classPrep.warmup!;

describe("WarmupPlan", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the focus, the rounds and each drill with its dose", () => {
    render(<WarmupPlan warmup={warmup} />);
    expect(screen.getByText(warmup.focus)).toBeInTheDocument();
    expect(screen.getByText("2 rounds, not for time")).toBeInTheDocument();
    const drills = screen.getAllByRole("listitem");
    expect(drills.map((d) => d.textContent)).toEqual([
      "Easy row2 min",
      "World's greatest stretch3 each side",
      "Empty-bar thruster",
    ]);
  });

  it("leaves out the rounds when there are none", () => {
    render(<WarmupPlan warmup={{ ...warmup, rounds: null }} />);
    expect(screen.queryByText(/rounds/)).not.toBeInTheDocument();
  });
});
