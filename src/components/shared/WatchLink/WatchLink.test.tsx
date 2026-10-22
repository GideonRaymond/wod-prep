// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WatchLink } from "./WatchLink";

const video = {
  title: "Thruster technique",
  url: "https://www.youtube.com/watch?v=abc",
  duration: "3:40",
};

describe("WatchLink", () => {
  afterEach(() => {
    cleanup();
  });

  it("links to the video in a new tab, named for what it shows", () => {
    render(<WatchLink name="Thruster" video={video} />);
    const link = screen.getByRole("link", { name: "Watch Thruster: Thruster technique (3:40)" });
    expect(link).toHaveAttribute("href", video.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("leaves out the length when it isn't known", () => {
    render(<WatchLink name="Thruster" video={{ ...video, duration: undefined }} />);
    expect(screen.getByRole("link")).toHaveAccessibleName("Watch Thruster: Thruster technique");
  });

  it("turns a softer pink once it's been opened", () => {
    render(<WatchLink name="Thruster" video={video} />);
    expect(screen.getByRole("link")).toHaveClass(
      "text-purple-700",
      "visited:text-pink-700",
      "dark:visited:text-pink-400",
    );
  });
});
