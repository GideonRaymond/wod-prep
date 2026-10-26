// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { mockVideos, mockArticles, mockPrep, mockBoards } = vi.hoisted(() => ({
  mockVideos: vi.fn(),
  mockArticles: vi.fn(),
  mockPrep: vi.fn(),
  mockBoards: vi.fn(),
}));
vi.mock("@/services/videosApi", () => ({ requestMovementVideos: mockVideos }));
vi.mock("@/services/articlesApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/articlesApi")>()),
  requestArticles: mockArticles,
}));
vi.mock("@/services/classPrepApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/classPrepApi")>()),
  requestClassPrep: mockPrep,
}));
vi.mock("@/services/boardApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/boardApi")>()),
  requestBoards: mockBoards,
}));

import { WorkoutPage } from "./WorkoutPage";
import { useWod, WodProvider } from "@/providers/WodProvider";
import { WOD_STORAGE_KEY } from "@/stores/wodStore";
import type { ClassPrep } from "@/schemas/classPrep";
import { prepKey } from "@/services/classPrepApi";
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

/** A workout with everything already found and planned, so the class shows straight away. */
function built(wod: WodState, plan: ClassPrep = { warmup: null, skills: [] }): WodState {
  const done: WodState = {
    parts: wod.parts.map((part) => ({
      ...part,
      articles: part.articles ?? [],
      ...(part.named && { videos: part.videos ?? [] }),
      movements: part.movements.map((m) => ({ ...m, videos: m.videos ?? [] })),
    })),
  };
  return { ...done, prep: { key: prepKey(done), plan } };
}

/** Opens a workout that still needs building: the loading screen, then Open your class. */
async function renderAndOpen(wod: WodState) {
  renderPage(wod);
  await userEvent.click(await screen.findByRole("button", { name: "Open your class" }));
  await screen.findByRole("heading", { level: 1, name: "Your workout" });
}

const boardLink = (name: RegExp) =>
  within(screen.getByRole("list", { name: "Chalkboard" })).getByRole("button", { name });

const stageToggle = (name: string | RegExp) =>
  within(screen.getByRole("region", { name })).getAllByRole("button")[0];

describe("WorkoutPage", () => {
  beforeEach(() => {
    mockVideos.mockReset().mockResolvedValue([]);
    mockArticles.mockReset().mockResolvedValue([]);
    mockPrep.mockReset().mockResolvedValue({ warmup: null, skills: [] });
    mockBoards.mockReset();
    // Hand over to the class at once instead of fading out.
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("runs the class in order: Before class, Briefing, the parts, then Cool-down", () => {
    renderPage(built(toWodState(strengthAndMetcon)));
    expect(screen.getByRole("heading", { level: 1, name: "Your workout" })).toBeInTheDocument();
    expect(screen.getAllByRole("region").map((r) => r.getAttribute("id"))).toHaveLength(5);
    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.querySelector("[id]")?.textContent);
    expect(names).toEqual(["Before class", "Briefing", "Heavy Back Squats", "Fran", "Cool-down"]);
  });

  it("builds the class on the loading screen, then hands over to it", async () => {
    let finishPrep: (plan: ClassPrep) => void = () => {};
    mockPrep.mockReturnValue(new Promise((resolve) => (finishPrep = resolve)));
    renderPage(toWodState(strengthAndMetcon));

    expect(screen.getByRole("heading", { level: 1, name: "Building your class" })).toBeVisible();
    const checklist = screen.getByRole("list", { name: "Getting it ready" });
    expect(within(checklist).getByText("Warm-up")).toBeInTheDocument();
    expect(within(checklist).getByText("Heavy Back Squats")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Briefing" })).not.toBeInTheDocument();

    act(() => finishPrep(classPrep));
    expect(await screen.findByRole("button", { name: "Open your class" })).toBeVisible();
    expect(within(checklist).getByText("Timing the class")).toBeInTheDocument();
    expect(within(checklist).getByText("Pull-up")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open your class" }));
    const heading = await screen.findByRole("heading", { level: 1, name: "Your workout" });
    expect(heading).toHaveFocus();
    expect(screen.getByRole("region", { name: "Briefing" })).toHaveClass(
      "motion-safe:animate-settle",
    );
  });

  it("builds the next workout on the loading screen too, though the page stays alive", async () => {
    let wodContext: ReturnType<typeof useWod> | null = null;
    function Capture() {
      wodContext = useWod();
      return null;
    }
    render(
      <WodProvider initialWod={built(toWodState(fran))}>
        <Capture />
        <WorkoutPage />
      </WodProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Your workout" })).toBeInTheDocument();

    act(() => wodContext!.loadWod("A) squats B) Fran", toWodState(strengthAndMetcon)));
    expect(screen.getByRole("heading", { level: 1, name: "Building your class" })).toBeVisible();
    await userEvent.click(await screen.findByRole("button", { name: "Open your class" }));
    expect(await screen.findByRole("region", { name: "Heavy Back Squats" })).toBeInTheDocument();
  });

  it("skips the loading screen when the class is already built", () => {
    renderPage(built(toWodState(strengthAndMetcon)));
    expect(screen.queryByText("Building your class")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Briefing" })).not.toHaveClass(
      "motion-safe:animate-settle",
    );
  });

  it("marks Before class with a lightbulb", () => {
    renderPage(built(toWodState(strengthAndMetcon)));
    const stage = screen.getByRole("region", { name: "Before class" });
    expect(stage.querySelector("svg.lucide-lightbulb")).toBeInTheDocument();
  });

  it("opens Before class and the chalkboard, and folds the rest", () => {
    renderPage(built(toWodState(strengthAndMetcon)));
    expect(stageToggle("Before class")).toHaveAttribute("aria-expanded", "true");
    expect(stageToggle("Briefing")).toHaveAttribute("aria-expanded", "true");
    expect(stageToggle("Heavy Back Squats")).toHaveAttribute("aria-expanded", "false");
    expect(stageToggle("Fran")).toHaveAttribute("aria-expanded", "false");
    expect(stageToggle("Cool-down")).toHaveAttribute("aria-expanded", "false");
  });

  it("shows when each stage starts, after the chalkboard", () => {
    renderPage(built(toWodState(strengthAndMetcon)));
    for (const when of ["Before", "0′", "5′", "20′", "32′"]) {
      expect(screen.getByText(when)).toBeInTheDocument();
    }
    expect(screen.getByText(/Starts at 20′/)).toBeInTheDocument();
  });

  it("briefs the stimulus and lists the day's equipment on the chalkboard", () => {
    renderPage(built(toWodState(strengthAndMetcon)));
    const board = screen.getByRole("region", { name: "Briefing" });
    expect(within(board).getAllByRole("meter", { name: "Intensity" })).toHaveLength(2);
    expect(within(board).getByRole("list", { name: "Equipment today" })).toHaveTextContent(
      "BarbellSquat rackPlatesPull-up barRower",
    );
  });

  it("plans a warm-up and puts each skill right before the part that uses it", async () => {
    mockPrep.mockResolvedValue(classPrep);
    await renderAndOpen(toWodState(strengthAndMetcon));

    expect(await screen.findByRole("region", { name: "Skill: Pull-up" })).toBeInTheDocument();
    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.querySelector("[id]")?.textContent);
    expect(names).toEqual([
      "Before class",
      "Briefing",
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
    await renderAndOpen(toWodState(strengthAndMetcon));

    await screen.findByRole("region", { name: "Warm-up" });
    await user.click(stageToggle("Warm-up"));
    const warmup = screen.getByRole("region", { name: "Warm-up" });
    expect(within(warmup).getByText(classPrep.warmup!.focus)).toBeVisible();
    expect(within(warmup).getByRole("list", { name: "You'll need" })).toHaveTextContent(
      "RowerBarbell",
    );

    await user.click(stageToggle("Skill: Pull-up"));
    const skill = screen.getByRole("region", { name: "Skill: Pull-up" });
    expect(within(skill).getByText("Move on after: 8 tight swings")).toBeVisible();
  });

  it("adds the warm-up and skill equipment to the chalkboard", async () => {
    mockPrep.mockResolvedValue(classPrep);
    await renderAndOpen(toWodState(strengthAndMetcon));
    await screen.findByRole("region", { name: "Skill: Pull-up" });
    const board = screen.getByRole("region", { name: "Briefing" });
    expect(within(board).getByRole("list", { name: "Equipment today" })).toHaveTextContent(
      "RowerBarbellPull-up barResistance bandSquat rackPlates",
    );
  });

  it("explains when the warm-up can't be planned", async () => {
    mockPrep.mockRejectedValue(new Error("Rate limited. Try again in a moment."));
    await renderAndOpen(toWodState(strengthAndMetcon));
    expect(await screen.findByText("Rate limited. Try again in a moment.")).toBeInTheDocument();
  });

  it("suggests stretches in a cool-down of their own, if time allows", async () => {
    const user = userEvent.setup();
    renderPage(built(toWodState(fran)));

    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.querySelector("[id]")?.textContent);
    expect(names.at(-1)).toBe("Cool-down");
    expect(screen.getByText("If time allows · suggested stretches")).toBeInTheDocument();
    // Fran ends 12 minutes after the chalkboard.
    expect(screen.getByText("17′")).toBeInTheDocument();

    await user.click(stageToggle("Cool-down"));
    const cooldown = screen.getByRole("region", { name: "Cool-down" });
    const links = within(cooldown).getAllByRole("link", { name: /^Watch / });
    expect(links.length).toBeGreaterThanOrEqual(3);
    expect(links[0]).toHaveAttribute("href", expect.stringMatching(/youtube\.com\/watch/));
  });

  it("adds suggested stretches under a programmed cool-down", async () => {
    const user = userEvent.setup();
    renderPage(built(toWodState(strengthAndMetcon)));
    expect(screen.getAllByRole("region", { name: "Cool-down" })).toHaveLength(1);

    await user.click(stageToggle("Cool-down"));
    const cooldown = screen.getByRole("region", { name: "Cool-down" });
    expect(within(cooldown).getByText("Stretches if time allows")).toBeVisible();
    expect(within(cooldown).getByRole("heading", { name: "Row" })).toBeInTheDocument();
  });

  it("shows the edited stimulus", () => {
    const wod = toWodState(strengthAndMetcon);
    wod.parts[1] = { ...wod.parts[1], stimulus: { ...wod.parts[1].stimulus, description: "Go!" } };
    renderPage(built(wod));
    expect(within(screen.getByRole("region", { name: "Briefing" })).getByText("Go!")).toBeVisible();
  });

  it("opens a part to show what you need and each movement", async () => {
    const user = userEvent.setup();
    renderPage(built(toWodState(strengthAndMetcon)));
    await user.click(stageToggle("Fran"));
    const part = screen.getByRole("region", { name: "Fran" });
    expect(within(part).getByRole("list", { name: "You'll need" })).toBeVisible();
    expect(within(part).getByRole("heading", { name: "Thruster" })).toBeVisible();
    expect(within(part).getAllByRole("button", { name: "Points of performance" })).toHaveLength(2);
  });

  it("restores the workout after a page refresh", () => {
    sessionStorage.setItem(
      WOD_STORAGE_KEY,
      JSON.stringify({ text: "A) squats B) Fran", wod: built(toWodState(strengthAndMetcon)) }),
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
    await renderAndOpen(toWodState(fran));

    expect(await screen.findByRole("link", { name: /Fran explained/ })).toBeVisible();
    expect(screen.getByText("Video · 3:40 · Fran")).toBeInTheDocument();

    await user.click(stageToggle("Fran"));
    const watch = await screen.findByRole("link", { name: /Watch Thruster/ });
    expect(watch).toHaveAttribute("href", "https://www.youtube.com/watch?v=t");
    expect(screen.queryByText("Finding videos…")).not.toBeInTheDocument();
  });

  it("explains when videos can't be found", async () => {
    mockVideos.mockRejectedValue(new Error("Videos need a YouTube API key."));
    await renderAndOpen(toWodState(fran));
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
    await renderAndOpen(toWodState(fran));

    expect(await screen.findByRole("link", { name: /Fooling Around with Fran/ })).toBeVisible();
    expect(screen.getByText("Why thrusters and pull-ups.")).toBeInTheDocument();
    expect(mockArticles).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("explains when reading can't be found", async () => {
    mockArticles.mockRejectedValue(new Error("Set ANTHROPIC_API_KEY in .env.local."));
    await renderAndOpen(toWodState(fran));
    expect(await screen.findByText("Set ANTHROPIC_API_KEY in .env.local.")).toBeInTheDocument();
  });

  it("marks a single-part workout as WOD and keeps part labels otherwise", () => {
    renderPage(built(toWodState(fran)));
    expect(screen.getAllByText("WOD").length).toBeGreaterThan(0);
    cleanup();

    renderPage(built(toWodState(strengthAndMetcon)));
    expect(screen.queryByText("WOD")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Cool-down" })).toBeInTheDocument();
  });

  it("jumps to a stage from the chalkboard, opening it", async () => {
    const user = userEvent.setup();
    renderPage(built(toWodState(strengthAndMetcon)));
    expect(stageToggle("Fran")).toHaveAttribute("aria-expanded", "false");
    await user.click(boardLink(/^B\. Fran/));
    expect(stageToggle("Fran")).toHaveAttribute("aria-expanded", "true");

    // Before class and the briefing head the board, written on like the rest.
    expect(boardLink(/^Before class/)).toHaveTextContent("Before class");
    await user.click(stageToggle("Before class"));
    expect(stageToggle("Before class")).toHaveAttribute("aria-expanded", "false");
    await user.click(boardLink(/^Before class/));
    expect(stageToggle("Before class")).toHaveAttribute("aria-expanded", "true");
  });

  it("makes the picked block the current one, even one that can't scroll to the top", async () => {
    const user = userEvent.setup();
    renderPage(built(toWodState(strengthAndMetcon)));
    expect(boardLink(/^Cool-down/)).not.toHaveAttribute("aria-current");
    await user.click(boardLink(/^Cool-down/));
    expect(boardLink(/^Cool-down/)).toHaveAttribute("aria-current", "location");
    expect(stageToggle("Cool-down")).toHaveAttribute("aria-expanded", "true");
    expect(stageToggle("Cool-down")).toHaveFocus();
  });

  it("has no Jump to button of its own; the chalkboard does that", () => {
    renderPage(built(toWodState(strengthAndMetcon)));
    expect(screen.queryByRole("dialog", { name: "Jump to" })).not.toBeInTheDocument();
    // The only Jump to is the chalkboard folded into a bar on phones.
    expect(screen.getByRole("button", { name: /Jump to/ })).toHaveAttribute("aria-controls");
  });

  it("expands every stage from beside the heading, then collapses them all", async () => {
    const user = userEvent.setup();
    renderPage(built(toWodState(strengthAndMetcon)));
    const heading = screen.getByRole("heading", { level: 1, name: "Your workout" });
    const toggle = within(heading.parentElement!).getByRole("button", { name: "Expand all" });

    await user.click(toggle);
    for (const name of ["Before class", "Briefing", "Heavy Back Squats", "Fran", "Cool-down"]) {
      expect(stageToggle(name)).toHaveAttribute("aria-expanded", "true");
    }
    expect(toggle).toHaveTextContent("Collapse all");

    await user.click(toggle);
    for (const name of ["Before class", "Briefing", "Fran"]) {
      expect(stageToggle(name)).toHaveAttribute("aria-expanded", "false");
    }
    expect(toggle).toHaveTextContent("Expand all");
  });

  it("offers to expand all again once any stage is folded", async () => {
    const user = userEvent.setup();
    renderPage(built(toWodState(strengthAndMetcon)));
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    await user.click(stageToggle("Fran"));
    expect(screen.getByRole("button", { name: "Expand all" })).toBeInTheDocument();
  });

  it("is the last of three steps, with links back to the others", () => {
    renderPage(built(toWodState(strengthAndMetcon)));
    const progress = screen.getByRole("navigation", { name: "Progress" });
    expect(within(progress).getByRole("link", { name: "Workout (done)" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(progress).getByRole("link", { name: "Check (done)" })).toHaveAttribute(
      "href",
      "/review",
    );
  });

  it("shows the chalkboard beside the class, with the warm-up and cool-down on one line each", () => {
    renderPage(built(toWodState(fran), classPrep));
    const headings = within(screen.getByRole("list", { name: "Chalkboard" }))
      .getAllByText(/./, { selector: ".font-permanent-marker" })
      .map((h) => h.textContent);
    expect(headings).toEqual([
      "Before class",
      "Briefing",
      "Warm-up – 10 min",
      "Skill: Pull-up – 11 min",
      "Fran",
      expect.stringMatching(/^Cool-down/),
    ]);
    expect(screen.queryByText("Easy row – 2 min")).not.toBeInTheDocument();
    const board = screen.getByText("Fran", { selector: ".font-permanent-marker" });
    expect(
      board.compareDocumentPosition(screen.getByRole("region", { name: "Before class" })),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("warns under the board when the planned class runs over, keeping the warm-up", () => {
    const [part] = toWodState(fran).parts;
    renderPage(built({ parts: [{ ...part, minutes: 70 }] }, classPrep));
    // 5 chalkboard + 10 warm-up + 11 pull-up practice + 70 + 5 wrap-up = 101
    // Under the board, and on phones (where the board is a bar) beside it instead.
    const notes = screen.getAllByText(/This class runs 41 min over the 60-minute class/);
    expect(notes).toHaveLength(2);
    expect(notes[0].closest(".max-md\\:hidden")).toBeInTheDocument();
    expect(notes[1].closest(".md\\:hidden")).toBeInTheDocument();
    expect(screen.getByText("Warm-up – 10 min")).toBeInTheDocument();
  });

  it("waits for the plan before warning, since only then is the class's length known", async () => {
    let plan: (prep: ClassPrep) => void = () => {};
    mockPrep.mockReturnValue(new Promise((resolve) => (plan = resolve)));
    const [part] = toWodState(fran).parts;
    renderPage({ parts: [{ ...part, minutes: 70 }] });
    await screen.findByRole("heading", { level: 1, name: "Building your class" });
    expect(screen.queryByText(/over the 60-minute class/)).not.toBeInTheDocument();

    await act(async () => plan(classPrep));
    expect((await screen.findAllByText(/This class runs 41 min over/)).length).toBeGreaterThan(0);
  });

  it("has no warning for a class that fits", () => {
    renderPage(built(toWodState(fran), classPrep));
    expect(screen.queryByText(/over the 60-minute class/)).not.toBeInTheDocument();
  });

  it("keeps the same board in place from the loading screen into the class", async () => {
    renderPage(toWodState(fran));
    const frame = () => screen.getByText("21-15-9 for time").closest(".min-h-80");
    const board = frame();
    await userEvent.click(await screen.findByRole("button", { name: "Open your class" }));
    await screen.findByRole("heading", { level: 1, name: "Your workout" });
    // The same board, now with every block a link to its section.
    expect(frame()).toBe(board);
    expect(boardLink(/^Fran/)).toBeInTheDocument();
  });

  it("shows links under the board while it builds, holding the countdown while they're read", async () => {
    mockArticles.mockResolvedValue([{ title: "Pacing Fran", url: "https://example.com/a" }]);
    renderPage(toWodState(fran));
    const links = await screen.findByRole("region", { name: "While you wait" });
    expect(await screen.findByText(/Opening in/)).toBeInTheDocument();

    fireEvent.pointerEnter(links);
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
    fireEvent.pointerLeave(links);
    expect(screen.getByText(/Opening in/)).toBeInTheDocument();
  });

  it("redraws edited parts on the loading screen before the class opens", async () => {
    let resolve: (boards: string[][]) => void = () => {};
    mockBoards.mockReturnValue(new Promise((r) => (resolve = r)));
    const [part] = built(toWodState(fran)).parts;
    const edited = built({ parts: [{ ...part, rounds: "15-12-9" }] });
    renderPage(edited);

    expect(await screen.findByText("Redrawing it with your changes")).toBeInTheDocument();
    expect(mockBoards.mock.calls[0][0].map((p: { id: string }) => p.id)).toEqual([part.id]);
    await act(async () => resolve([["Fran", "15-12-9 for time"]]));
    expect(await screen.findByText("Redrawn with your changes")).toBeInTheDocument();
    expect(screen.getByText("15-12-9 for time")).toBeInTheDocument();
  });

  it("explains when there's no workout yet", () => {
    renderPage(null);
    expect(screen.getByText("There's no workout to show yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Paste a workout" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});
