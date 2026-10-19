// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StretchList } from "./StretchList";
import { STRETCHES } from "@/data/stretches";

const couch = STRETCHES.find((s) => s.name === "Couch stretch")!;
const bandedLat = STRETCHES.find((s) => s.name === "Banded lat stretch")!;

describe("StretchList", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows each stretch with its dose, areas and a demo", () => {
    render(<StretchList stretches={[couch, bandedLat]} />);
    const [first, second] = screen.getAllByRole("listitem");

    expect(within(first).getByRole("heading", { name: "Couch stretch" })).toBeInTheDocument();
    expect(within(first).getByText("45-60 s each side")).toBeInTheDocument();
    expect(within(first).getByText("hip flexors, quads")).toBeInTheDocument();
    const link = within(first).getByRole("link", { name: /Watch Couch stretch/ });
    expect(link).toHaveAttribute("href", couch.video.url);
    expect(link).toHaveAttribute("target", "_blank");

    expect(within(second).getByText("45-60 s each side · Resistance band")).toBeInTheDocument();
  });
});
