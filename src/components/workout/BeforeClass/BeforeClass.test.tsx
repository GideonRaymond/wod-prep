// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BeforeClass, beforeClassCounts } from "./BeforeClass";
import { strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const [squats, fran, cooldown] = toWodState(strengthAndMetcon).parts;
const video = (n: number) => ({
  title: `Fran video ${n}`,
  url: `https://example.com/v${n}`,
  duration: "3:40",
});
const withReferences = [
  {
    ...squats,
    articles: [
      { title: "Squat depth", url: "https://example.com/a", source: "example.com", minutes: 4 },
    ],
  },
  // Named workouts bring their general videos; the third is left out to keep the list short.
  { ...fran, videos: [video(1), video(2), video(3)] },
  // Movement videos are Watch links on the movements, not Before class material.
  { ...cooldown, movements: [{ ...cooldown.movements[0], videos: [video(9)] }] },
];

describe("BeforeClass", () => {
  afterEach(() => {
    cleanup();
  });

  it("says where the material will show up while there's none yet", () => {
    render(<BeforeClass parts={[squats, fran]} />);
    expect(screen.getByText(/show up here once they're found/)).toBeInTheDocument();
    expect(beforeClassCounts([squats, fran])).toBe("");
  });

  it("lists articles under Read and named workouts' videos under Watch", () => {
    render(<BeforeClass parts={withReferences} />);
    expect(screen.getByRole("heading", { name: "Read" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Watch" })).toBeInTheDocument();

    const article = screen.getByRole("link", { name: "Squat depth" });
    expect(article).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Article · example.com · 4 min read")).toBeInTheDocument();
    expect(screen.getAllByText("Video · 3:40 · Fran")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Fran video 3" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Fran video 9" })).not.toBeInTheDocument();
    expect(beforeClassCounts(withReferences)).toBe("1 article · 2 videos");
  });

  it("lines each icon up with its title's first line, by giving both the same line height", () => {
    render(<BeforeClass parts={withReferences} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.parentElement).toHaveClass("text-sm");
    }
  });

  it("keeps each icon inside its link, in the link's colour, so it turns pink with it", () => {
    render(<BeforeClass parts={withReferences} />);
    for (const link of screen.getAllByRole("link")) {
      const icon = link.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden");
      expect(icon).toHaveClass("absolute");
      expect(icon!.getAttribute("class")).not.toMatch(/text-purple/);
    }
  });

  it("turns its links a softer pink once they've been opened", () => {
    render(<BeforeClass parts={withReferences} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("visited:text-pink-700", "dark:visited:text-pink-300");
    }
  });

  it("only goes side by side from the sm breakpoint, when it has both lists", () => {
    const { container } = render(<BeforeClass parts={withReferences} />);
    expect(container.firstChild).toHaveClass("sm:grid-cols-2");
    expect(container.firstChild).not.toHaveClass("grid-cols-2");
  });

  it("shows why a video was picked, when it says", () => {
    const reason = "Breaks down pacing for the thrusters.";
    render(<BeforeClass parts={[{ ...fran, videos: [{ ...video(1), reason }] }]} />);
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it("says why an article was picked and when it needs a login", () => {
    const article = {
      title: "The Story of Fran",
      url: "https://journal.crossfit.com/2009/12/the-story-of-fran.tpl",
      source: "CrossFit Journal",
      reason: "Where Fran came from.",
      members: true,
    };
    render(<BeforeClass parts={[{ ...fran, articles: [article] }]} />);
    expect(screen.getByText("Article · CrossFit Journal · Login needed")).toBeInTheDocument();
    expect(screen.getByText("Where Fran came from.")).toBeInTheDocument();
  });
});
