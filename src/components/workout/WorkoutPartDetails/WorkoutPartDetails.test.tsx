// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WorkoutPartDetails } from "./WorkoutPartDetails";
import { strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const [squats, fran] = toWodState(strengthAndMetcon).parts;
const toggle = (name: RegExp) => screen.getByRole("button", { name });

describe("WorkoutPartDetails", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the label, title, format line and intensity in the header", () => {
    render(<WorkoutPartDetails part={squats} />);
    expect(screen.getByRole("region", { name: "Heavy Back Squats" })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Strength · 5x5 · 15 min")).toBeInTheDocument();
    expect(toggle(/Heavy Back Squats/)).toHaveTextContent("7/10Hard");
  });

  it("starts collapsed with a chip per movement, and opens from the header", async () => {
    const user = userEvent.setup();
    render(<WorkoutPartDetails part={fran} />);
    expect(toggle(/Fran/)).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTitle("weightlifting")).toHaveTextContent("Thruster");
    expect(screen.getByTitle("gymnastics")).toHaveTextContent("Pull-up");
    expect(screen.queryByRole("meter", { name: "Intensity" })).not.toBeInTheDocument();

    await user.click(toggle(/Fran/));
    expect(toggle(/Fran/)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("meter", { name: "Intensity" })).toBeVisible();
    expect(screen.queryByTitle("weightlifting")).not.toBeInTheDocument();
  });

  it("shows the stimulus read-only with its intensity when open", () => {
    render(<WorkoutPartDetails part={fran} defaultOpen />);
    expect(screen.getByText(fran.stimulus.description)).toBeVisible();
    expect(screen.getByRole("meter", { name: "Intensity" })).toHaveAttribute("aria-valuenow", "9");
    expect(screen.queryByRole("button", { name: "Edit stimulus" })).not.toBeInTheDocument();
  });

  it("shows each movement with its points of performance and no way to remove it", () => {
    render(<WorkoutPartDetails part={fran} defaultOpen />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Points of performance" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });

  it("has no Before class panel without reference material", () => {
    render(<WorkoutPartDetails part={fran} defaultOpen />);
    expect(screen.queryByRole("button", { name: /Before class/ })).not.toBeInTheDocument();
  });

  it("counts reference material when collapsed and lists it under Before class when open", async () => {
    const user = userEvent.setup();
    const part = {
      ...fran,
      articles: [{ title: "How to pace Fran", url: "https://example.com/pace" }],
      movements: [
        {
          ...fran.movements[0],
          videos: [{ title: "Thruster technique", url: "https://example.com/t" }],
        },
        fran.movements[1],
      ],
    };
    render(<WorkoutPartDetails part={part} />);
    expect(screen.getByText("1 video · 1 article")).toBeInTheDocument();

    await user.click(toggle(/Fran/));
    expect(screen.getByRole("button", { name: /Before class/ })).toBeVisible();
    expect(screen.getByRole("link", { name: "How to pace Fran" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Thruster technique" })).toBeVisible();
  });
});
