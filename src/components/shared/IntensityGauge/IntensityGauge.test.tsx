// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IntensityGauge } from "./IntensityGauge";

const needleEnd = () => {
  const needle = screen.getByTestId("intensity-needle");
  return { x: Number(needle.getAttribute("x2")), y: Number(needle.getAttribute("y2")) };
};

describe("IntensityGauge", () => {
  afterEach(() => {
    cleanup();
  });

  it("is an accessible meter with the value and its description", () => {
    render(<IntensityGauge value={7} />);
    const meter = screen.getByRole("meter", { name: "Intensity" });
    expect(meter).toHaveAttribute("aria-valuenow", "7");
    expect(meter).toHaveAttribute("aria-valuemin", "1");
    expect(meter).toHaveAttribute("aria-valuemax", "10");
    expect(meter).toHaveAttribute("aria-valuetext", "7 out of 10, Hard");
    expect(screen.getByText("7/10")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
  });

  it("points the needle left at 1, up in the middle and right at 10", () => {
    render(<IntensityGauge value={1} />);
    expect(needleEnd().x).toBeLessThan(40);
    expect(needleEnd().y).toBeCloseTo(40);
    cleanup();

    render(<IntensityGauge value={10} />);
    expect(needleEnd().x).toBeGreaterThan(40);
    expect(needleEnd().y).toBeCloseTo(40);
    cleanup();

    render(<IntensityGauge value={5} />);
    const middle = needleEnd();
    expect(middle.y).toBeLessThan(40);
    expect(middle.x).toBeLessThan(40);
  });

  it("draws a green-to-red gradient", () => {
    const { container } = render(<IntensityGauge value={5} />);
    const stops = [...container.querySelectorAll("stop")].map((s) => s.getAttribute("stop-color"));
    expect(stops).toEqual(["#22c55e", "#eab308", "#ef4444"]);
  });

  it("clamps and rounds out-of-range values", () => {
    render(<IntensityGauge value={14} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "10");
    cleanup();
    render(<IntensityGauge value={0} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "1");
    cleanup();
    render(<IntensityGauge value={6.6} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "7");
  });
});
