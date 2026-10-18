// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { mockVideos } = vi.hoisted(() => ({ mockVideos: vi.fn() }));
vi.mock("@/services/videosApi", () => ({ requestMovementVideos: mockVideos }));

import { WorkoutPage } from "./WorkoutPage";
import { WodProvider } from "@/providers/WodProvider";
import { WOD_STORAGE_KEY } from "@/stores/wodStore";
import type { WodState } from "@/types/wod";
import { fran, strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

function renderPage(wod: WodState | null) {
  render(
    <WodProvider initialWod={wod}>
      <WorkoutPage />
    </WodProvider>,
  );
}

describe("WorkoutPage", () => {
  beforeEach(() => {
    mockVideos.mockReset().mockResolvedValue([]);
  });
  afterEach(() => {
    cleanup();
  });

  it("shows every part of the confirmed workout", () => {
    renderPage(toWodState(strengthAndMetcon));
    expect(screen.getByRole("heading", { level: 1, name: "Your workout" })).toBeInTheDocument();
    expect(screen.getAllByRole("region")).toHaveLength(3);
    expect(screen.getByRole("region", { name: "Fran" })).toBeInTheDocument();
  });

  it("opens the first part and folds the rest, on one rail", () => {
    renderPage(toWodState(strengthAndMetcon));
    const toggles = screen.getAllByRole("button", { expanded: true });
    expect(toggles).toHaveLength(1);
    expect(toggles[0]).toHaveTextContent("Heavy Back Squats");
    expect(screen.getAllByRole("button", { expanded: false }).length).toBeGreaterThanOrEqual(2);
  });

  it("restores the workout after a page refresh", () => {
    sessionStorage.setItem(
      WOD_STORAGE_KEY,
      JSON.stringify({ text: "A) squats B) Fran", wod: toWodState(strengthAndMetcon) }),
    );
    render(
      <WodProvider>
        <WorkoutPage />
      </WodProvider>,
    );
    expect(screen.getAllByRole("region")).toHaveLength(3);
  });

  it("doesn't render the empty state on the server, so a refresh doesn't flash it", () => {
    const html = renderToString(
      <WodProvider>
        <WorkoutPage />
      </WodProvider>,
    );
    expect(html).toContain("Your workout");
    expect(html).not.toContain("no workout to show");
  });

  it("finds videos for the movements and lists them under Before class", async () => {
    mockVideos.mockImplementation(async (name: string) =>
      name === "Thruster"
        ? [{ title: "How to Thruster", url: "https://www.youtube.com/watch?v=t", duration: "3:05" }]
        : [],
    );
    renderPage(toWodState(fran));
    expect(screen.getByRole("status")).toHaveTextContent("Finding videos…");

    const link = await screen.findByRole("link", { name: /How to Thruster/ });
    expect(link).toHaveAttribute("href", "https://www.youtube.com/watch?v=t");
    expect(screen.getByText("Video · 3:05 · Thruster")).toBeInTheDocument();
    expect(screen.queryByText("Finding videos…")).not.toBeInTheDocument();
  });

  it("explains when videos can't be found", async () => {
    mockVideos.mockRejectedValue(new Error("Videos need a YouTube API key."));
    renderPage(toWodState(fran));
    expect(await screen.findByText("Videos need a YouTube API key.")).toBeInTheDocument();
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
