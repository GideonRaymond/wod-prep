// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OvertimeNote } from "./OvertimeNote";

describe("OvertimeNote", () => {
  afterEach(() => {
    cleanup();
  });

  it("says how far the class runs over, and that the safe parts stay in", () => {
    render(<OvertimeNote minutes={30} />);
    expect(screen.getByText(/This class runs 30 min over the 60-minute class\./)).toHaveTextContent(
      "The warm-up and progressions stay in to keep everyone safe",
    );
  });

  it("says at least, before the warm-up is planned", () => {
    render(<OvertimeNote minutes={28} estimate="minimum" />);
    expect(
      screen.getByText(
        /With a warm-up, this class runs at least 28 min over the 60-minute class\./,
      ),
    ).toBeInTheDocument();
  });

  it.each([0, null])("shows nothing for %s", (minutes) => {
    const { container } = render(<OvertimeNote minutes={minutes} />);
    expect(container).toBeEmptyDOMElement();
  });
});
