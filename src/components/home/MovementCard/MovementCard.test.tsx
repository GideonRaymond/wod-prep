// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MovementCard } from "./MovementCard";
import type { Movement } from "@/schemas/wod";
import { fran } from "@/test/fixtures";

const [thruster] = fran.movements;

function renderCard(movement: Movement, onRemove = vi.fn()) {
  render(
    <ul>
      <MovementCard movement={movement} onRemove={onRemove} />
    </ul>,
  );
  return onRemove;
}

describe("MovementCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the name and category", () => {
    renderCard(thruster);
    expect(screen.getByRole("heading", { name: "Thruster" })).toBeInTheDocument();
    expect(screen.getByText("weightlifting")).toHaveClass("bg-amber-100");
  });

  it("shows the reps and load", () => {
    renderCard(thruster);
    expect(screen.getByTitle("Reps")).toHaveTextContent("21-15-9");
    expect(screen.getByTitle("Load")).toHaveTextContent("95/65 lb");
  });

  it("calls onRemove", async () => {
    const onRemove = renderCard(thruster);
    await userEvent.click(screen.getByRole("button", { name: "Remove Thruster" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("has a collapsed points of performance section", () => {
    renderCard(thruster);
    expect(screen.getByRole("button", { name: "Points of performance" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
