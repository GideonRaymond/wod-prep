// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WodSummary } from "./WodSummary";
import type { Wod } from "@/schemas/wod";
import type { WodState } from "@/types/wod";
import { fran, strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

function Harness({ wod }: { wod: Wod }) {
  const [state, setState] = useState<WodState>(() => toWodState(wod));
  return <WodSummary wod={state} onChange={setState} />;
}

describe("WodSummary", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows a single-part WOD as one section", () => {
    render(<Harness wod={fran} />);
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(screen.getAllByRole("meter")).toHaveLength(1);
  });

  it("shows each part of a multi-part WOD with its own stimulus and movements", () => {
    render(<Harness wod={strengthAndMetcon} />);
    const [a, b, coolDown] = screen.getAllByRole("region");

    expect(a).toHaveAccessibleName("Heavy Back Squats");
    expect(b).toHaveAccessibleName("Fran");
    expect(coolDown).toHaveAccessibleName("Easy Flush");

    expect(within(a).getByRole("meter")).toHaveAttribute("aria-valuenow", "7");
    expect(within(b).getByRole("meter")).toHaveAttribute("aria-valuenow", "9");
    expect(within(coolDown).getByRole("meter")).toHaveAttribute("aria-valuenow", "2");

    expect(within(a).getAllByRole("listitem")).toHaveLength(1);
    expect(within(b).getAllByRole("listitem")).toHaveLength(2);
    expect(within(coolDown).getByRole("heading", { name: "Row" })).toBeInTheDocument();
  });

  it("changes only the part that was edited", async () => {
    render(<Harness wod={strengthAndMetcon} />);
    const [a, b] = screen.getAllByRole("region");
    await userEvent.click(within(b).getByRole("button", { name: "Remove Thruster" }));

    expect(within(b).getAllByRole("listitem")).toHaveLength(1);
    expect(within(a).getAllByRole("listitem")).toHaveLength(1);
    expect(within(a).getByRole("heading", { name: "Back Squat" })).toBeInTheDocument();
  });

  it("checks for duplicates only within the same part", async () => {
    const user = userEvent.setup();
    render(<Harness wod={strengthAndMetcon} />);
    const a = screen.getAllByRole("region")[0];

    await user.click(within(a).getByRole("button", { name: "Add movement" }));
    await user.type(within(a).getByPlaceholderText(/Movement/), "Thruster");
    await user.click(within(a).getByRole("button", { name: "Add" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(a).getAllByRole("listitem")).toHaveLength(2);
  });
});
