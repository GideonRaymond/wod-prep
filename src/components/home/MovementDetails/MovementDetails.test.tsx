// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MovementDetails } from "./MovementDetails";
import { fran } from "@/test/fixtures";

const [thruster, pullUp] = fran.movements;

describe("MovementDetails", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows reps and load with icons", () => {
    render(<MovementDetails movement={thruster} />);
    expect(screen.getByTitle("Reps")).toHaveTextContent("21-15-9");
    expect(screen.getByTitle("Load")).toHaveTextContent("95/65 lb");
    expect(screen.getByTitle("Load").querySelector("svg")).not.toBeNull();
  });

  it("hides the load when there is none", () => {
    render(<MovementDetails movement={pullUp} />);
    expect(screen.getByTitle("Reps")).toBeInTheDocument();
    expect(screen.queryByTitle("Load")).not.toBeInTheDocument();
  });

  it("falls back to the original text when there are no reps or load", () => {
    render(<MovementDetails movement={{ ...pullUp, reps: null, originalText: "Rest 2 min" }} />);
    expect(screen.getByText("Rest 2 min")).toBeInTheDocument();
  });
});
