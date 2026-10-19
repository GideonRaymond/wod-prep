// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewPage } from "./ReviewPage";
import { WodProvider } from "@/providers/WodProvider";
import { WOD_STORAGE_KEY } from "@/stores/wodStore";
import { fran, franPart, strengthAndMetcon } from "@/test/fixtures";
import type { SavedWod, WodState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

/** The movement cards (the stepper's steps are list items too). */
const movementCards = () =>
  within(screen.getByRole("region", { name: "Fran" })).getAllByRole("listitem");

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function renderPage(wod: WodState | null = toWodState(fran)) {
  render(
    <WodProvider initialWod={wod} initialText="Fran">
      <ReviewPage />
    </WodProvider>,
  );
  return userEvent.setup();
}

describe("ReviewPage", () => {
  beforeEach(() => {
    push.mockReset();
  });
  afterEach(() => {
    cleanup();
  });

  it("is the second of three steps, with a way back to the first", () => {
    renderPage();
    const progress = screen.getByRole("navigation", { name: "Progress" });
    expect(within(progress).getByRole("link", { name: "Workout (done)" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(progress).getByText("Check").closest("[aria-current]")).toBeInTheDocument();
  });

  it("shows the whiteboard beside the summary, stimulus and movements", () => {
    renderPage();
    expect(screen.getByText("21-15-9 for time")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fran" })).toBeInTheDocument();
    expect(screen.getByText("For Time · 21-15-9")).toBeInTheDocument();
    expect(screen.getByText(franPart.stimulus.description)).toBeInTheDocument();
    const cards = movementCards();
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByRole("heading", { name: "Thruster" })).toBeInTheDocument();
  });

  it("splits a multi-part WOD into sections", () => {
    renderPage(toWodState(strengthAndMetcon));
    expect(screen.getByRole("region", { name: "Heavy Back Squats" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Fran" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Easy Flush" })).toBeInTheDocument();
  });

  it("keeps the board as read while editing, and says when it's redrawn", async () => {
    const user = renderPage();
    expect(screen.queryByText(/go on the board/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Thruster" }));

    expect(movementCards()).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Thruster" })).not.toBeInTheDocument();
    expect(screen.getByText("Thrusters 95/65 lb")).toBeInTheDocument();
    expect(screen.getByText("Your changes go on the board when you confirm.")).toBeInTheDocument();
  });

  it("warns under the board when the workout leaves no time for a warm-up", () => {
    renderPage(toWodState(fran));
    expect(screen.queryByText(/over the 60-minute class/)).not.toBeInTheDocument();
    cleanup();

    const [part] = toWodState(fran).parts;
    renderPage({ parts: [{ ...part, minutes: 70 }] });
    // 5 whiteboard + 8 warm-up + 70 + 5 wrap-up = 88
    expect(
      screen.getByText(/With a warm-up, this class runs at least 28 min over the 60-minute class/),
    ).toBeInTheDocument();
  });

  it("doesn't let the user resize any text box", async () => {
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Edit stimulus" }));
    const textareas = screen.getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA");
    expect(textareas.length).toBeGreaterThan(0);
    for (const textarea of textareas) expect(textarea).toHaveClass("resize-none");
  });

  it("doesn't show points of performance while checking", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: "Points of performance" })).not.toBeInTheDocument();
  });

  it("saves the edits, so a refresh restores them", async () => {
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Remove Thruster" }));
    await user.click(screen.getByRole("button", { name: "Edit stimulus" }));
    await user.type(screen.getByRole("textbox", { name: "Stimulus" }), " Go!");

    const saved: SavedWod = JSON.parse(sessionStorage.getItem(WOD_STORAGE_KEY)!);
    expect(saved.text).toBe("Fran");
    expect(saved.wod.parts[0].movements.map((m) => m.name)).toEqual(["Pull-up"]);
    expect(saved.wod.parts[0].stimulus.description).toBe(`${franPart.stimulus.description} Go!`);
  });

  it("goes to the class on Confirm", async () => {
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Confirm workout" }));
    expect(push).toHaveBeenCalledWith("/workout");
  });

  it("can't confirm while a stimulus is empty", async () => {
    const user = renderPage(toWodState(strengthAndMetcon));
    const partB = screen.getByRole("region", { name: "Fran" });

    await user.click(within(partB).getByRole("button", { name: "Edit stimulus" }));
    await user.clear(within(partB).getByRole("textbox", { name: "Stimulus" }));

    const confirm = screen.getByRole("button", { name: "Confirm workout" });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAccessibleDescription(
      "Every part needs a stimulus before you can confirm.",
    );

    await user.type(within(partB).getByRole("textbox", { name: "Stimulus" }), "Sprint.");
    expect(confirm).toBeEnabled();
  });

  it("sends you to paste a workout when there's none", () => {
    renderPage(null);
    expect(screen.getByText("There's no workout to check yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Paste a workout" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("button", { name: "Confirm workout" })).not.toBeInTheDocument();
  });
});
