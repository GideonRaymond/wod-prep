// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { ArrowLeft } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import { ButtonLink } from "./ButtonLink";

describe("ButtonLink", () => {
  afterEach(() => {
    cleanup();
  });

  it("is a link styled like a button", () => {
    render(
      <ButtonLink href="/" variant="secondary" size="sm" icon={ArrowLeft}>
        Back
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Back" });
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveClass("px-3", "text-zinc-600");
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
