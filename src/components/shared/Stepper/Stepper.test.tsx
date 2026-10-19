// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Stepper } from "./Stepper";

// Shows each link's view transition types, which next/link otherwise keeps to itself.
vi.mock("next/link", () => ({
  default: ({
    transitionTypes,
    ...props
  }: ComponentProps<"a"> & { transitionTypes?: string[] }) => (
    <a data-transition={transitionTypes?.join(" ")} {...props} />
  ),
}));

const steps = [
  { label: "Workout", href: "/" },
  { label: "Check", href: "/review" },
  { label: "Class", href: "/workout" },
];

describe("Stepper", () => {
  afterEach(() => {
    cleanup();
  });

  it("marks the current step, and the ones before it as done", () => {
    render(<Stepper steps={steps} current={1} />);
    const items = within(screen.getByRole("navigation", { name: "Progress" })).getAllByRole(
      "listitem",
    );
    expect(items.map((item) => item.textContent)).toEqual(["Workout", "2Check", "3Class"]);
    expect(screen.getByText("Check").closest("[aria-current]")).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("links the steps before this one, but not this one or later ones", () => {
    render(<Stepper steps={steps} current={1} />);
    expect(screen.getByRole("link", { name: "Workout (done)" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: /Check/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Class/ })).not.toBeInTheDocument();
  });

  it("links a later step that can already be opened", () => {
    render(<Stepper steps={steps} current={0} reachable={1} />);
    expect(screen.getByRole("link", { name: "Check" })).toHaveAttribute("href", "/review");
    expect(screen.queryByRole("link", { name: /Class/ })).not.toBeInTheDocument();
  });

  it("is centered", () => {
    render(<Stepper steps={steps} current={0} />);
    expect(within(screen.getByRole("navigation")).getByRole("list")).toHaveClass("justify-center");
  });

  it("slides back to an earlier step and forward to a later one", () => {
    render(<Stepper steps={steps} current={1} reachable={2} />);
    expect(screen.getByRole("link", { name: "Workout (done)" })).toHaveAttribute(
      "data-transition",
      "nav-back",
    );
    expect(screen.getByRole("link", { name: "Class" })).toHaveAttribute(
      "data-transition",
      "nav-forward",
    );
  });
});
