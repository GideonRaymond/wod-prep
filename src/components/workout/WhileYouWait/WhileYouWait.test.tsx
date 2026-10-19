// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhileYouWait } from "./WhileYouWait";

const article = {
  title: "Fooling Around with Fran",
  url: "https://library.crossfit.com/a.pdf",
  source: "CrossFit Journal",
  minutes: 11,
  about: "Fran",
};
const video = {
  title: "Fran explained",
  url: "https://example.com/v",
  duration: "3:40",
  about: "Fran",
};

describe("WhileYouWait", () => {
  afterEach(() => {
    cleanup();
  });

  it("lists the reading and videos, opening in a new tab", () => {
    render(<WhileYouWait articles={[article]} videos={[video]} />);
    expect(screen.getByRole("region", { name: "Maybe while you wait" })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Fooling Around with Fran/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Article · CrossFit Journal · 11 min read")).toBeInTheDocument();
    expect(screen.getByText("Video · 3:40 · Fran")).toBeInTheDocument();
  });

  it("renders nothing without anything to read", () => {
    const { container } = render(<WhileYouWait articles={[]} videos={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says when someone is reading, by pointer or keyboard", () => {
    const onReading = vi.fn();
    render(<WhileYouWait articles={[article]} videos={[]} onReading={onReading} />);
    const region = screen.getByRole("region");

    fireEvent.pointerEnter(region);
    fireEvent.pointerLeave(region);
    fireEvent.focus(screen.getByRole("link"));
    fireEvent.blur(screen.getByRole("link"));
    expect(onReading.mock.calls.map(([reading]) => reading)).toEqual([true, false, true, false]);
  });
});
