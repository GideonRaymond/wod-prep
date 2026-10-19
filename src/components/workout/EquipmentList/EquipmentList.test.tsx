// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EquipmentLine, EquipmentList } from "./EquipmentList";

describe("EquipmentList", () => {
  afterEach(() => {
    cleanup();
  });

  it("lists each item under its label", () => {
    render(<EquipmentList items={["Rower", "Resistance band"]} />);
    const list = screen.getByRole("list", { name: "You'll need" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Rower", "Resistance band"]);
  });

  it("takes another label", () => {
    render(<EquipmentList items={["Barbell"]} label="Equipment today" />);
    expect(screen.getByRole("list", { name: "Equipment today" })).toBeInTheDocument();
  });

  it("renders nothing without equipment", () => {
    const { container } = render(<EquipmentList items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("EquipmentLine", () => {
  afterEach(() => {
    cleanup();
  });

  it("joins the items on one line", () => {
    render(<EquipmentLine items={["Barbell", "Plates"]} />);
    expect(screen.getByText("Barbell · Plates")).toBeInTheDocument();
  });
});
