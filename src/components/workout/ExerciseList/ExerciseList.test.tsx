// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExerciseList } from "./ExerciseList";
import { franPart } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const [thruster, pullUp] = toWodState({ parts: [franPart] }).parts[0].movements;
const withVideo = {
  ...thruster,
  videos: [
    { title: "How to Thruster", url: "https://www.youtube.com/watch?v=t", duration: "3:05" },
    { title: "Another one", url: "https://www.youtube.com/watch?v=u" },
  ],
};

describe("ExerciseList", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows each exercise with its reps and load", () => {
    render(<ExerciseList movements={[withVideo, pullUp]} />);
    expect(screen.getByRole("heading", { name: "Thruster" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pull-up" })).toBeInTheDocument();
    expect(screen.getAllByTitle("Load")[0]).toHaveTextContent("95/65 lb");
  });

  it("links to the first video only, opening in a new tab", () => {
    render(<ExerciseList movements={[withVideo, pullUp]} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Watch Thruster: How to Thruster (3:05)");
    expect(links[0]).toHaveAttribute("href", "https://www.youtube.com/watch?v=t");
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveTextContent("Watch3:05");
  });

  it("adds categories and points of performance for workout parts only", () => {
    render(<ExerciseList movements={[withVideo]} />);
    expect(screen.queryByText("weightlifting")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Points of performance" })).not.toBeInTheDocument();
    cleanup();

    render(<ExerciseList movements={[withVideo]} detailed />);
    expect(screen.getByText("weightlifting")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Points of performance" })).toBeInTheDocument();
  });
});
