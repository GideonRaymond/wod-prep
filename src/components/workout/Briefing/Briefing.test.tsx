// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Briefing } from "./Briefing";
import { strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const [squats, fran] = toWodState(strengthAndMetcon).parts;

describe("Briefing", () => {
  afterEach(() => {
    cleanup();
  });

  it("briefs the stimulus and intensity of each part", () => {
    render(
      <Briefing parts={[squats, fran]} notes={[]} equipment={[]} markerFor={(p) => p.label} />,
    );
    expect(screen.getByRole("heading", { name: "Heavy Back Squats" })).toBeInTheDocument();
    expect(screen.getByText(fran.stimulus.description)).toBeInTheDocument();
    const meters = screen.getAllByRole("meter", { name: "Intensity" });
    expect(meters.map((m) => m.getAttribute("aria-valuenow"))).toEqual(["7", "9"]);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("lists notes for members and the day's equipment", () => {
    render(
      <Briefing
        parts={[fran]}
        notes={[{ part: "Fran", text: "Scale to ring rows." }]}
        equipment={["Barbell", "Pull-up bar"]}
        markerFor={() => "WOD"}
      />,
    );
    expect(screen.getByRole("list", { name: "Notes" })).toHaveTextContent(
      "Fran: Scale to ring rows.",
    );
    expect(screen.getByRole("list", { name: "Equipment today" })).toHaveTextContent(
      "BarbellPull-up bar",
    );
  });

  it("leaves out notes and equipment when there are none", () => {
    render(<Briefing parts={[fran]} notes={[]} equipment={[]} markerFor={() => null} />);
    expect(screen.queryByRole("list", { name: "Notes" })).not.toBeInTheDocument();
    expect(screen.queryByText("Equipment today")).not.toBeInTheDocument();
  });
});
