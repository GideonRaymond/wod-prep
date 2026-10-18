// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WorkoutMovementCard } from "./WorkoutMovementCard";
import { franPart } from "@/test/fixtures";

describe("WorkoutMovementCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the movement, its category, reps and load, and points of performance", () => {
    render(
      <ul>
        <WorkoutMovementCard movement={franPart.movements[0]} />
      </ul>,
    );
    expect(screen.getByRole("heading", { name: "Thruster" })).toBeInTheDocument();
    expect(screen.getByText("weightlifting")).toBeInTheDocument();
    expect(screen.getByTitle("Load")).toHaveTextContent("95/65 lb");
    expect(screen.getByRole("button", { name: "Points of performance" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
