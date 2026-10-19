// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Flame } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import { ClassStage } from "./ClassStage";
import { StageMarker } from "./StageMarker";

function Harness({ last = false }: { last?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <ClassStage
      id="warmup"
      marker={<StageMarker icon={Flame} />}
      when="5′"
      title="Warm-up"
      subtitle="12 min · 2 rounds"
      summary={<span>Row · Air squats</span>}
      open={open}
      onToggle={() => setOpen(!open)}
      last={last}
    >
      <p>Row 250 m</p>
    </ClassStage>
  );
}

describe("ClassStage", () => {
  afterEach(() => {
    cleanup();
  });

  it("is a region named by its title, with its start time on the rail", () => {
    render(<Harness />);
    expect(screen.getByRole("region", { name: "Warm-up" })).toHaveAttribute("id", "stage-warmup");
    expect(screen.getByText("5′")).toBeInTheDocument();
    expect(screen.getByText("12 min · 2 rounds")).toBeInTheDocument();
  });

  it("shows the summary while folded and the content when opened", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: /Warm-up/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Row · Air squats")).toBeInTheDocument();
    expect(screen.getByText("Row 250 m")).not.toBeVisible();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Row 250 m")).toBeVisible();
    expect(screen.queryByText("Row · Air squats")).not.toBeInTheDocument();
  });
});

describe("StageMarker", () => {
  afterEach(() => {
    cleanup();
  });

  it("settles in after the loading screen, 60 ms after the stage before it", () => {
    render(
      <ClassStage
        id="b"
        marker={null}
        title="Fran"
        open={false}
        onToggle={() => {}}
        settleIndex={3}
      >
        <p>Fran</p>
      </ClassStage>,
    );
    const stage = screen.getByRole("region", { name: "Fran" });
    expect(stage).toHaveClass("motion-safe:animate-settle");
    expect(stage).toHaveStyle({ animationDelay: "180ms" });
  });

  it("doesn't animate otherwise", () => {
    render(<Harness />);
    expect(screen.getByRole("region", { name: "Warm-up" })).not.toHaveClass(
      "motion-safe:animate-settle",
    );
  });

  it("shows a part label", () => {
    render(<StageMarker label="B" />);
    expect(screen.getByText("B")).toHaveClass("bg-purple-600");
  });
});
