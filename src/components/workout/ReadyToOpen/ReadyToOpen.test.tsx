// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OPEN_COUNTDOWN_SECONDS, ReadyToOpen } from "./ReadyToOpen";

/** Lets the countdown tick, one second (and one render) at a time. */
const tick = (seconds: number) => {
  for (let i = 0; i < seconds; i++) act(() => vi.advanceTimersByTime(1000));
};

describe("ReadyToOpen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("counts down from seven seconds", () => {
    expect(OPEN_COUNTDOWN_SECONDS).toBe(7);
  });

  it("counts down and opens the class on its own", () => {
    const onOpen = vi.fn();
    render(<ReadyToOpen onOpen={onOpen} />);
    expect(screen.getByText("Your class is ready")).toBeInTheDocument();
    expect(screen.getByText(`Opening in ${OPEN_COUNTDOWN_SECONDS}…`)).toBeInTheDocument();

    tick(1);
    expect(screen.getByText(`Opening in ${OPEN_COUNTDOWN_SECONDS - 1}…`)).toBeInTheDocument();
    tick(OPEN_COUNTDOWN_SECONDS - 2);
    expect(onOpen).not.toHaveBeenCalled();
    tick(1);
    expect(onOpen).toHaveBeenCalled();
  });

  it("opens straight away from the button", () => {
    const onOpen = vi.fn();
    render(<ReadyToOpen onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: "Open your class" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("waits while someone is reading, then carries on", () => {
    const onOpen = vi.fn();
    const { rerender } = render(<ReadyToOpen onOpen={onOpen} paused />);
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
    tick(OPEN_COUNTDOWN_SECONDS + 5);
    expect(onOpen).not.toHaveBeenCalled();

    rerender(<ReadyToOpen onOpen={onOpen} />);
    expect(screen.getByText(`Opening in ${OPEN_COUNTDOWN_SECONDS}…`)).toBeInTheDocument();
    tick(OPEN_COUNTDOWN_SECONDS);
    expect(onOpen).toHaveBeenCalled();
  });
});
