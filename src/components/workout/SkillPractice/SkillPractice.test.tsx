// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SkillPractice } from "./SkillPractice";
import { classPrep } from "@/test/fixtures";

const skill = classPrep.skills[0];

describe("SkillPractice", () => {
  afterEach(() => {
    cleanup();
  });

  it("explains why and lists the progressions in order", () => {
    render(<SkillPractice skill={skill} />);
    expect(screen.getByText("A good kip keeps the sets big.")).toBeInTheDocument();
    expect(screen.getByText("Includes 2 min to set up.")).toBeInTheDocument();

    const steps = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(steps.map((s) => within(s).getByRole("heading").textContent)).toEqual([
      "Kip swing",
      "Kipping pull-up",
    ]);
    expect(within(steps[0]).getByText("4 min")).toBeInTheDocument();
    expect(within(steps[0]).getByText("3 × 8 swings")).toBeInTheDocument();
    expect(within(steps[0]).getByText("Swing from the shoulders.")).toBeInTheDocument();
    expect(within(steps[0]).getByText("Move on after: 8 tight swings")).toBeInTheDocument();
    expect(within(steps[1]).queryByText(/Move on after/)).not.toBeInTheDocument();
  });

  it("doesn't mention setup when there's none", () => {
    render(<SkillPractice skill={{ ...skill, setupMinutes: 0 }} />);
    expect(screen.queryByText(/to set up/)).not.toBeInTheDocument();
  });

  it("puts each step's number above it on phones, and beside it from sm up", () => {
    render(<SkillPractice skill={classPrep.skills[0]} />);
    for (const step of screen.getAllByRole("listitem")) {
      expect(step).toHaveClass("flex-col", "sm:flex-row");
    }
  });
});
