// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhileYouWait, type WaitingReference } from "./WhileYouWait";

const video: WaitingReference = {
  kind: "video",
  title: "Fran explained",
  url: "https://example.com/v",
  meta: ["Video", "3:40", "Fran"],
};
const article: WaitingReference = {
  kind: "article",
  title: "Fooling Around with Fran",
  url: "https://library.crossfit.com/a.pdf",
  meta: ["Article", "CrossFit Journal", "11 min read"],
};

describe("WhileYouWait", () => {
  afterEach(() => {
    cleanup();
  });

  it("lists the videos and articles, opening in a new tab", () => {
    const { container } = render(<WhileYouWait references={[video, article]} />);
    expect(screen.getByRole("region", { name: "While you wait" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fran explained/ })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByText("Video · 3:40 · Fran")).toBeInTheDocument();
    expect(screen.getByText("Article · CrossFit Journal · 11 min read")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-play")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-book-open")).toBeInTheDocument();
  });

  it("turns its links a softer pink once they've been opened", () => {
    render(<WhileYouWait references={[video, article]} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("visited:text-pink-700", "dark:visited:text-pink-300");
    }
  });

  it("renders nothing until there's something", () => {
    const { container } = render(<WhileYouWait references={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says when someone is reading, by pointer or keyboard", () => {
    const onReading = vi.fn();
    render(<WhileYouWait references={[article]} onReading={onReading} />);
    const region = screen.getByRole("region");

    fireEvent.pointerEnter(region);
    fireEvent.pointerLeave(region);
    fireEvent.focus(screen.getByRole("link"));
    fireEvent.blur(screen.getByRole("link"));
    expect(onReading.mock.calls.map(([reading]) => reading)).toEqual([true, false, true, false]);
  });
});
