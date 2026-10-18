// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MovementCard } from "./MovementCard";
import type { Movement } from "@/schemas/wod";
import { fran } from "@/test/fixtures";

const [thruster, pullUp] = fran.movements;

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

  it("shows reps and load with icons", () => {
    renderCard(thruster);
    expect(screen.getByTitle("Reps")).toHaveTextContent("21-15-9");
    expect(screen.getByTitle("Load")).toHaveTextContent("95/65 lb");
    expect(screen.getByTitle("Load").querySelector("svg")).not.toBeNull();
  });

  it("hides the load when there is none", () => {
    renderCard(pullUp);
    expect(screen.getByTitle("Reps")).toBeInTheDocument();
    expect(screen.queryByTitle("Load")).not.toBeInTheDocument();
  });

  it("falls back to the original text when there are no reps or load", () => {
    renderCard({ ...pullUp, reps: null, originalText: "Rest 2 min" });
    expect(screen.getByText("Rest 2 min")).toBeInTheDocument();
  });

  it("calls onRemove", async () => {
    const onRemove = renderCard(thruster);
    await userEvent.click(screen.getByRole("button", { name: "Remove Thruster" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
