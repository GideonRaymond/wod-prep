// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WorkoutPage } from "./WorkoutPage";
import { WodProvider } from "@/providers/WodProvider";
import type { WodState } from "@/types/wod";
import { strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

function renderPage(wod: WodState | null) {
  render(
    <WodProvider initialWod={wod}>
      <WorkoutPage />
    </WodProvider>,
  );
}

describe("WorkoutPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows every part of the confirmed workout", () => {
    renderPage(toWodState(strengthAndMetcon));
    expect(screen.getByRole("heading", { level: 1, name: "Your workout" })).toBeInTheDocument();
    expect(screen.getAllByRole("region")).toHaveLength(3);
    expect(screen.getByRole("region", { name: "Fran" })).toBeInTheDocument();
  });

  it("shows the edited stimulus", () => {
    const wod = toWodState(strengthAndMetcon);
    wod.parts[1] = { ...wod.parts[1], stimulus: { ...wod.parts[1].stimulus, description: "Go!" } };
    renderPage(wod);
    expect(
      within(screen.getByRole("region", { name: "Fran" })).getByText("Go!"),
    ).toBeInTheDocument();
  });

  it("links back to the review page", () => {
    renderPage(toWodState(strengthAndMetcon));
    expect(screen.getByRole("link", { name: "Back to edit" })).toHaveAttribute("href", "/");
  });

  it("explains when there's no workout yet", () => {
    renderPage(null);
    expect(screen.getByText("There's no workout to show yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Paste a workout" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});
