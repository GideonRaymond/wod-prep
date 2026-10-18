// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { BeforeClass } from "./BeforeClass";
import { franPart } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const fran = toWodState({ parts: [franPart] }).parts[0];
const withReferences = {
  ...fran,
  articles: [
    {
      title: "How to pace Fran",
      url: "https://example.com/pace",
      source: "example.com",
      minutes: 6,
    },
  ],
  movements: [
    {
      ...fran.movements[0],
      videos: [{ title: "Thruster technique", url: "https://example.com/t", duration: "4:12" }],
    },
    fran.movements[1],
  ],
};

describe("BeforeClass", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing while a part has no articles or videos", () => {
    const { container } = render(<BeforeClass part={fran} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists articles under Read and videos under Watch, opening in a new tab", () => {
    render(<BeforeClass part={withReferences} />);
    expect(screen.getByRole("button", { name: /Before class/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("1 video · 1 article")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Read" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Watch" })).toBeInTheDocument();

    const article = screen.getByRole("link", { name: "How to pace Fran" });
    expect(article).toHaveAttribute("href", "https://example.com/pace");
    expect(article).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Article · example.com · 6 min read")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Thruster technique" })).toBeInTheDocument();
    expect(screen.getByText("Video · 4:12 · Thruster")).toBeInTheDocument();
  });

  it("folds away and back", async () => {
    const user = userEvent.setup();
    render(<BeforeClass part={withReferences} />);
    const toggle = screen.getByRole("button", { name: /Before class/ });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "How to pace Fran" })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(screen.getByRole("link", { name: "How to pace Fran" })).toBeVisible();
  });
});
