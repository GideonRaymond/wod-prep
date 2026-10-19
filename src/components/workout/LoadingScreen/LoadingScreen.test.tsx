// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoadingScreen } from "./LoadingScreen";
import { classChecklist, type ClassProgress } from "./classChecklist";
import { classPrep, strengthAndMetcon } from "@/test/fixtures";
import type { WodState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

const base = toWodState(strengthAndMetcon);
const withReading: WodState = {
  parts: base.parts.map((part, i) =>
    i === 1
      ? { ...part, articles: [{ title: "Pacing Fran", url: "https://example.com/a" }] }
      : part,
  ),
};

const building: Omit<ClassProgress, "wod"> = {
  prep: null,
  prepLoading: true,
  articlesLoading: true,
  videosPending: new Set(),
};
const done: Omit<ClassProgress, "wod"> = {
  prep: classPrep,
  prepLoading: false,
  articlesLoading: false,
  videosPending: new Set(),
};

function renderScreen(wod: WodState, progress: Omit<ClassProgress, "wod">, onOpen = vi.fn()) {
  const view = render(
    <LoadingScreen wod={wod} checklist={classChecklist({ wod, ...progress })} onOpen={onOpen} />,
  );
  const update = (next: Omit<ClassProgress, "wod">) =>
    view.rerender(
      <LoadingScreen wod={wod} checklist={classChecklist({ wod, ...next })} onOpen={onOpen} />,
    );
  return { ...view, update };
}

const live = () => document.querySelector("[aria-live=polite]")!;

describe("LoadingScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the workout on the board and the checklist beside it", () => {
    renderScreen(withReading, building);
    expect(
      screen.getByRole("heading", { level: 1, name: "Building your class" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Your workout")).toBeInTheDocument();
    expect(screen.getByText(base.parts[0].sourceText.split("\n")[0])).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Getting it ready" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open your class" })).not.toBeInTheDocument();
  });

  it("shows the reading as soon as Before class is done", () => {
    const { update } = renderScreen(withReading, building);
    expect(screen.queryByRole("region", { name: "Maybe while you wait" })).not.toBeInTheDocument();
    update({ ...building, articlesLoading: false });
    expect(screen.getByRole("region", { name: "Maybe while you wait" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pacing Fran/ })).toBeInTheDocument();
  });

  it("announces each step as it finishes, then that the class is ready", () => {
    const { update } = renderScreen(withReading, building);
    expect(live()).toHaveTextContent("");
    update({ ...building, articlesLoading: false });
    expect(live()).toHaveTextContent("Before class ready");
    update(done);
    expect(live()).toHaveTextContent("Your class is ready");
  });

  it("offers to open the class when it's ready, holding the countdown while reading", () => {
    const onOpen = vi.fn();
    renderScreen(withReading, done, onOpen);
    expect(screen.getByText("Your class is ready")).toBeInTheDocument();
    expect(screen.getByText("Opening in 3…")).toBeInTheDocument();

    fireEvent.pointerEnter(screen.getByRole("region", { name: "Maybe while you wait" }));
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open your class" }));
    expect(onOpen).toHaveBeenCalled();
  });

  it("fades out on the way to the class", () => {
    const { container } = render(
      <LoadingScreen
        wod={base}
        checklist={classChecklist({ wod: base, ...done })}
        onOpen={vi.fn()}
        leaving
      />,
    );
    expect(container.firstChild).toHaveClass("opacity-0");
  });
});
