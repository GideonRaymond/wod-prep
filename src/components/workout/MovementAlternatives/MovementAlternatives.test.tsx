// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { classPrep } from "@/test/fixtures";
import { MovementAlternatives, PregnancyBadge } from "./MovementAlternatives";

const [thruster, pullUp] = classPrep.alternatives;

describe("MovementAlternatives", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the similar and the different alternative, each with why", () => {
    render(<MovementAlternatives alternatives={pullUp} />);
    expect(screen.getByRole("heading", { name: "Alternatives" })).toBeInTheDocument();
    const [similar, different] = screen.getAllByRole("listitem");
    expect(similar).toHaveTextContent(
      "Similar Jumping pull-up Keeps the reps fast so the sprint stays a sprint.",
    );
    expect(different).toHaveTextContent(
      "Can't do it Ring row Pulls the same muscles with the feet down.",
    );
  });

  it("says why to avoid it when pregnant", () => {
    render(<MovementAlternatives alternatives={pullUp} />);
    expect(screen.getByText(/Avoid when pregnant/).closest("p")).toHaveTextContent(
      "Avoid when pregnant: Kipping strains the core. Use an alternative.",
    );
  });

  it("says nothing about pregnancy when the movement is fine", () => {
    render(<MovementAlternatives alternatives={thruster} />);
    expect(screen.queryByText(/pregnant/)).not.toBeInTheDocument();
  });
});

describe("PregnancyBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("marks a movement to avoid when pregnant, with why on hover", () => {
    render(<PregnancyBadge alternatives={pullUp} />);
    expect(screen.getByText("Not when pregnant")).toHaveAttribute(
      "title",
      "Kipping strains the core",
    );
  });

  it("shows nothing for a movement that's fine, or without a plan", () => {
    const { container } = render(
      <>
        <PregnancyBadge alternatives={thruster} />
        <PregnancyBadge alternatives={null} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
