// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { mockVideos, mockArticles, mockPrep } = vi.hoisted(() => ({
  mockVideos: vi.fn(),
  mockArticles: vi.fn(),
  mockPrep: vi.fn(),
}));
vi.mock("@/services/videosApi", () => ({ requestMovementVideos: mockVideos }));
vi.mock("@/services/articlesApi", () => ({ requestArticles: mockArticles }));
vi.mock("@/services/classPrepApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/classPrepApi")>()),
  requestClassPrep: mockPrep,
}));

import { WorkoutPage } from "./WorkoutPage";
import { WodProvider } from "@/providers/WodProvider";
import { WOD_STORAGE_KEY } from "@/stores/wodStore";
import type { WodState } from "@/types/wod";
import { classPrep, fran, strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

function renderPage(wod: WodState | null) {
  render(
    <WodProvider initialWod={wod}>
      <WorkoutPage />
    </WodProvider>,
  );
}

const stageToggle = (name: string | RegExp) =>
  within(screen.getByRole("region", { name })).getAllByRole("button")[0];

describe("WorkoutPage", () => {
  beforeEach(() => {
    mockVideos.mockReset().mockResolvedValue([]);
    mockArticles.mockReset().mockResolvedValue([]);
    mockPrep.mockReset().mockResolvedValue({ warmup: null, skills: [] });
  });
  afterEach(() => {
    cleanup();
  });

  it("runs the class in order: Before class, Whiteboard, the parts, then Cool-down", () => {
    renderPage(toWodState(strengthAndMetcon));
    expect(screen.getByRole("heading", { level: 1, name: "Your workout" })).toBeInTheDocument();
    expect(screen.getAllByRole("region").map((r) => r.getAttribute("id"))).toHaveLength(5);
    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.querySelector("[id]")?.textContent);
    expect(names).toEqual(["Before class", "Whiteboard", "Heavy Back Squats", "Fran", "Cool-down"]);
  });

  it("marks Before class with a lightbulb", () => {
    renderPage(toWodState(strengthAndMetcon));
    const stage = screen.getByRole("region", { name: "Before class" });
    expect(stage.querySelector("svg.lucide-lightbulb")).toBeInTheDocument();
  });

  it("opens Before class and the whiteboard, and folds the rest", () => {
    renderPage(toWodState(strengthAndMetcon));
    expect(stageToggle("Before class")).toHaveAttribute("aria-expanded", "true");
    expect(stageToggle("Whiteboard")).toHaveAttribute("aria-expanded", "true");
    expect(stageToggle("Heavy Back Squats")).toHaveAttribute("aria-expanded", "false");
    expect(stageToggle("Fran")).toHaveAttribute("aria-expanded", "false");
    expect(stageToggle("Cool-down")).toHaveAttribute("aria-expanded", "false");
  });

  it("shows when each stage starts, after the whiteboard", () => {
    renderPage(toWodState(strengthAndMetcon));
    for (const when of ["Before", "0′", "5′", "20′", "32′"]) {
      expect(screen.getByText(when)).toBeInTheDocument();
    }
    expect(screen.getByText(/Starts at 20′/)).toBeInTheDocument();
  });

  it("briefs the stimulus and lists the day's equipment on the whiteboard", () => {
    renderPage(toWodState(strengthAndMetcon));
    const board = screen.getByRole("region", { name: "Whiteboard" });
    expect(within(board).getAllByRole("meter", { name: "Intensity" })).toHaveLength(2);
    expect(within(board).getByRole("list", { name: "Equipment today" })).toHaveTextContent(
      "BarbellSquat rackPlatesPull-up barRower",
    );
  });

  it("plans a warm-up and puts each skill right before the part that uses it", async () => {
    mockPrep.mockResolvedValue(classPrep);
    renderPage(toWodState(strengthAndMetcon));

    expect(await screen.findByRole("region", { name: "Skill: Pull-up" })).toBeInTheDocument();
    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.querySelector("[id]")?.textContent);
    expect(names).toEqual([
      "Before class",
      "Whiteboard",
      "Warm-up",
      "Heavy Back Squats",
      "Skill: Pull-up",
      "Fran",
      "Cool-down",
    ]);
    // 10 min warm-up, 15 min squats, then 11 min of pull-up practice before Fran.
    expect(screen.getByText("Starts at 5′ · 10 min")).toBeInTheDocument();
    expect(screen.getByText("Starts at 30′ · 11 min · 2 progressions")).toBeInTheDocument();
    expect(screen.getByText("Kip swing → Kipping pull-up")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("opens the planned warm-up and the skill practice", async () => {
    const user = userEvent.setup();
    mockPrep.mockResolvedValue(classPrep);
    renderPage(toWodState(strengthAndMetcon));

    await user.click(await screen.findByRole("button", { name: /^Warm-up/ }));
    const warmup = screen.getByRole("region", { name: "Warm-up" });
    expect(within(warmup).getByText(classPrep.warmup!.focus)).toBeVisible();
    expect(within(warmup).getByRole("list", { name: "You'll need" })).toHaveTextContent(
      "RowerBarbell",
    );

    await user.click(stageToggle("Skill: Pull-up"));
    const skill = screen.getByRole("region", { name: "Skill: Pull-up" });
    expect(within(skill).getByText("Move on after: 8 tight swings")).toBeVisible();
  });

  it("adds the warm-up and skill equipment to the whiteboard", async () => {
    mockPrep.mockResolvedValue(classPrep);
    renderPage(toWodState(strengthAndMetcon));
    await screen.findByRole("region", { name: "Skill: Pull-up" });
    const board = screen.getByRole("region", { name: "Whiteboard" });
    expect(within(board).getByRole("list", { name: "Equipment today" })).toHaveTextContent(
      "RowerBarbellPull-up barResistance bandSquat rackPlates",
    );
  });

  it("explains when the warm-up can't be planned", async () => {
    mockPrep.mockRejectedValue(new Error("Rate limited. Try again in a moment."));
    renderPage(toWodState(strengthAndMetcon));
    expect(await screen.findByText("Rate limited. Try again in a moment.")).toBeInTheDocument();
  });

  it("suggests stretches in a cool-down of their own, if time allows", async () => {
    const user = userEvent.setup();
    renderPage(toWodState(fran));

    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.querySelector("[id]")?.textContent);
    expect(names.at(-1)).toBe("Cool-down");
    expect(screen.getByText("If time allows · suggested stretches")).toBeInTheDocument();
    // Fran ends 12 minutes after the whiteboard.
    expect(screen.getByText("17′")).toBeInTheDocument();

    await user.click(stageToggle("Cool-down"));
    const cooldown = screen.getByRole("region", { name: "Cool-down" });
    const links = within(cooldown).getAllByRole("link", { name: /^Watch / });
    expect(links.length).toBeGreaterThanOrEqual(3);
    expect(links[0]).toHaveAttribute("href", expect.stringMatching(/youtube\.com\/watch/));
  });

  it("adds suggested stretches under a programmed cool-down", async () => {
    const user = userEvent.setup();
    renderPage(toWodState(strengthAndMetcon));
    expect(screen.getAllByRole("region", { name: "Cool-down" })).toHaveLength(1);

    await user.click(stageToggle("Cool-down"));
    const cooldown = screen.getByRole("region", { name: "Cool-down" });
    expect(within(cooldown).getByText("Stretches if time allows")).toBeVisible();
    expect(within(cooldown).getByRole("heading", { name: "Row" })).toBeInTheDocument();
  });

  it("shows the edited stimulus", () => {
    const wod = toWodState(strengthAndMetcon);
    wod.parts[1] = { ...wod.parts[1], stimulus: { ...wod.parts[1].stimulus, description: "Go!" } };
    renderPage(wod);
    expect(
      within(screen.getByRole("region", { name: "Whiteboard" })).getByText("Go!"),
    ).toBeVisible();
  });

  it("opens a part to show what you need and each movement", async () => {
    const user = userEvent.setup();
    renderPage(toWodState(strengthAndMetcon));
    await user.click(stageToggle("Fran"));
    const part = screen.getByRole("region", { name: "Fran" });
    expect(within(part).getByRole("list", { name: "You'll need" })).toBeVisible();
    expect(within(part).getByRole("heading", { name: "Thruster" })).toBeVisible();
    expect(within(part).getAllByRole("button", { name: "Points of performance" })).toHaveLength(2);
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
    expect(screen.getAllByRole("region")).toHaveLength(5);
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

  it("finds videos: the workout's own under Before class, each movement's as its Watch link", async () => {
    const user = userEvent.setup();
    mockVideos.mockImplementation(async (name: string, kind: string) => {
      if (kind === "workout")
        return [{ title: "Fran explained", url: "https://example.com/fran", duration: "3:40" }];
      if (name === "Thruster") {
        return [
          { title: "How to Thruster", url: "https://www.youtube.com/watch?v=t", duration: "3:05" },
        ];
      }
      return [];
    });
    renderPage(toWodState(fran));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Finding videos and reading · Planning the warm-up…",
    );

    expect(await screen.findByRole("link", { name: /Fran explained/ })).toBeVisible();
    expect(screen.getByText("Video · 3:40 · Fran")).toBeInTheDocument();

    await user.click(stageToggle("Fran"));
    const watch = await screen.findByRole("link", { name: /Watch Thruster/ });
    expect(watch).toHaveAttribute("href", "https://www.youtube.com/watch?v=t");
    expect(screen.queryByText("Finding videos…")).not.toBeInTheDocument();
  });

  it("explains when videos can't be found", async () => {
    mockVideos.mockRejectedValue(new Error("Videos need a YouTube API key."));
    renderPage(toWodState(fran));
    expect(await screen.findByText("Videos need a YouTube API key.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Fran" })).toBeInTheDocument();
  });

  it("finds reading for each part and lists it under Before class", async () => {
    mockArticles.mockResolvedValue([
      {
        title: "Fooling Around with Fran",
        url: "https://library.crossfit.com/free/pdf/31_05_fooling_with_fran.pdf",
        source: "CrossFit Journal",
        minutes: 11,
        reason: "Why thrusters and pull-ups.",
      },
    ]);
    renderPage(toWodState(fran));

    expect(await screen.findByRole("link", { name: /Fooling Around with Fran/ })).toBeVisible();
    expect(screen.getByText("Why thrusters and pull-ups.")).toBeInTheDocument();
    expect(mockArticles).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("explains when reading can't be found", async () => {
    mockArticles.mockRejectedValue(new Error("Set ANTHROPIC_API_KEY in .env.local."));
    renderPage(toWodState(fran));
    expect(await screen.findByText("Set ANTHROPIC_API_KEY in .env.local.")).toBeInTheDocument();
  });

  it("marks a single-part workout as WOD and keeps part labels otherwise", () => {
    renderPage(toWodState(fran));
    expect(screen.getAllByText("WOD").length).toBeGreaterThan(0);
    cleanup();

    renderPage(toWodState(strengthAndMetcon));
    expect(screen.queryByText("WOD")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Cool-down" })).toBeInTheDocument();
  });

  it("jumps to a stage from the menu, opening it", async () => {
    const user = userEvent.setup();
    renderPage(toWodState(strengthAndMetcon));
    await user.click(screen.getByRole("button", { name: /Jump to/ }));
    await user.click(screen.getByRole("button", { name: /B · Fran/ }));
    expect(stageToggle("Fran")).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("dialog", { name: "Jump to" })).not.toBeInTheDocument();
  });

  it("expands and collapses every stage from the menu", async () => {
    const user = userEvent.setup();
    renderPage(toWodState(strengthAndMetcon));
    await user.click(screen.getByRole("button", { name: /Jump to/ }));
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    for (const name of ["Before class", "Whiteboard", "Heavy Back Squats", "Fran", "Cool-down"]) {
      expect(stageToggle(name)).toHaveAttribute("aria-expanded", "true");
    }
    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(stageToggle("Whiteboard")).toHaveAttribute("aria-expanded", "false");
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
